package controller

import (
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"os/exec"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/vnpay/capi-dashboard/internal/service"
)

var wsUpgrader = websocket.Upgrader{
	CheckOrigin:     func(r *http.Request) bool { return true },
	ReadBufferSize:  4096,
	WriteBufferSize: 4096,
}

// GetSystemTools handles GET /api/v1/system/tools
func GetSystemTools(c *gin.Context) {
	// Chỉ kiểm tra binary tồn tại — không chạy kubectl (tránh fail vì RBAC/network)
	_, err := exec.LookPath("kubectl-node_shell")
	c.JSON(http.StatusOK, gin.H{
		"kubectlNodeShell": gin.H{
			"available":   err == nil,
			"installHint": "curl -LO https://github.com/kvaps/kubectl-node-shell/raw/master/kubectl-node_shell && chmod +x kubectl-node_shell && mv kubectl-node_shell /usr/local/bin/",
			"usage":       "kubectl node-shell <node-name>",
			"docs":        "https://github.com/kvaps/kubectl-node-shell",
		},
	})
}

// NodeShellService — inject từ main.go
var NodeShellSvc *service.ClusterService

// NodeShellWS handles WebSocket — lấy kubeconfig từ CAPI Secret rồi spawn kubectl node-shell
// Route: GET /api/v1/clusters/:namespace/:name/machines/:node/shell
func NodeShellWS(c *gin.Context) {
	namespace   := c.Param("namespace")
	clusterName := c.Param("name")
	nodeName    := c.Param("node")

	conn, err := wsUpgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		slog.Error("WebSocket upgrade failed", "error", err)
		return
	}
	defer conn.Close()

	slog.Info("NodeShell session started", "cluster", clusterName, "node", nodeName)

	// Step 1: Kiểm tra binary kubectl-node_shell
	if _, err := exec.LookPath("kubectl-node_shell"); err != nil {
		writeWSMsg(conn, "\r\n\x1b[31m✗ kubectl-node_shell binary not found in PATH\x1b[0m\r\n")
		return
	}
	if _, err := exec.LookPath("kubectl"); err != nil {
		writeWSMsg(conn, "\r\n\x1b[31m✗ kubectl not found in PATH\x1b[0m\r\n")
		return
	}

	// Step 2: Lấy kubeconfig workload cluster từ CAPI Secret
	// CAPI convention: Secret "<cluster>-kubeconfig" trong namespace "<namespace>"
	writeWSMsg(conn, fmt.Sprintf("\x1b[36mFetching kubeconfig for cluster \x1b[1m%s\x1b[0m\x1b[36m...\x1b[0m\r\n", clusterName))

	kubeconfig, err := NodeShellSvc.GetWorkloadKubeconfig(c.Request.Context(), namespace, clusterName)
	if err != nil {
		writeWSMsg(conn, fmt.Sprintf("\r\n\x1b[31m✗ Cannot get kubeconfig: %s\x1b[0m\r\n", err.Error()))
		writeWSMsg(conn, "\x1b[33mEnsure CAPI Secret '<cluster>-kubeconfig' exists in namespace.\x1b[0m\r\n")
		return
	}

	// Step 3: Write kubeconfig ra temp file (xóa sau khi session kết thúc)
	tmpFile, err := os.CreateTemp("", "wl-kubeconfig-*.yaml")
	if err != nil {
		writeWSMsg(conn, "\r\n\x1b[31m✗ Cannot create temp kubeconfig: "+err.Error()+"\x1b[0m\r\n")
		return
	}
	defer os.Remove(tmpFile.Name())

	if _, err := tmpFile.Write(kubeconfig); err != nil {
		writeWSMsg(conn, "\r\n\x1b[31m✗ Cannot write kubeconfig: "+err.Error()+"\x1b[0m\r\n")
		return
	}
	tmpFile.Close()

	writeWSMsg(conn, fmt.Sprintf("\x1b[32m✓ Got kubeconfig, connecting to node \x1b[1m%s\x1b[0m\x1b[32m...\x1b[0m\r\n\r\n", nodeName))

	// Step 4: Spawn kubectl node-shell với workload kubeconfig
	// QUAN TRỌNG: Dùng clean env — loại bỏ KUBERNETES_SERVICE_HOST/PORT
	// để kubectl KHÔNG dùng in-cluster ServiceAccount của management cluster
	cmd := exec.Command("kubectl", "node-shell", nodeName,
		"--kubeconfig", tmpFile.Name(),
	)
	cmd.Env = []string{
		"KUBECONFIG=" + tmpFile.Name(),
		"HOME=/tmp",
		"PATH=" + os.Getenv("PATH"),
		"TERM=xterm-256color",
	}

	stdinPipe, err := cmd.StdinPipe()
	if err != nil {
		writeWSMsg(conn, "\r\n\x1b[31m✗ stdin pipe error: "+err.Error()+"\x1b[0m\r\n")
		return
	}
	stdoutPipe, err := cmd.StdoutPipe()
	if err != nil {
		writeWSMsg(conn, "\r\n\x1b[31m✗ stdout pipe error: "+err.Error()+"\x1b[0m\r\n")
		return
	}
	cmd.Stderr = cmd.Stdout

	if err := cmd.Start(); err != nil {
		writeWSMsg(conn, "\r\n\x1b[31m✗ Failed to start kubectl node-shell: "+err.Error()+"\x1b[0m\r\n")
		return
	}

	done := make(chan struct{})

	// stdout → WebSocket
	go func() {
		defer close(done)
		buf := make([]byte, 4096)
		for {
			n, err := stdoutPipe.Read(buf)
			if n > 0 {
				conn.WriteMessage(websocket.BinaryMessage, buf[:n])
			}
			if err != nil {
				if err != io.EOF {
					slog.Warn("stdout read error", "error", err)
				}
				break
			}
		}
	}()

	// WebSocket → stdin
	go func() {
		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				stdinPipe.Close()
				return
			}
			stdinPipe.Write(msg)
		}
	}()

	// Keepalive ping
	go func() {
		t := time.NewTicker(15 * time.Second)
		defer t.Stop()
		for {
			select {
			case <-done:
				return
			case <-t.C:
				conn.WriteMessage(websocket.PingMessage, nil)
			}
		}
	}()

	<-done
	cmd.Wait()
	writeWSMsg(conn, "\r\n\x1b[33m[Session ended]\x1b[0m\r\n")
	slog.Info("NodeShell session ended", "cluster", clusterName, "node", nodeName)
}

func writeWSMsg(conn *websocket.Conn, msg string) {
	conn.WriteMessage(websocket.TextMessage, []byte(msg))
}
