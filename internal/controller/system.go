package controller

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/exec"
	"time"

	"github.com/creack/pty"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/vnpay/capi-dashboard/internal/service"
)

var wsUpgrader = websocket.Upgrader{
	CheckOrigin:     func(r *http.Request) bool { return true },
	ReadBufferSize:  4096,
	WriteBufferSize: 4096,
}

// NodeShellSvc inject từ main.go
var NodeShellSvc *service.ClusterService

// GetSystemTools handles GET /api/v1/system/tools
func GetSystemTools(c *gin.Context) {
	_, err := exec.LookPath("kubectl-node_shell")
	c.JSON(http.StatusOK, gin.H{
		"kubectlNodeShell": gin.H{
			"available": err == nil,
			"usage":     "kubectl node-shell <node-name>",
			"docs":      "https://github.com/kvaps/kubectl-node-shell",
		},
	})
}

// NodeShellWS — spawn kubectl node-shell với PTY thật
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

	if _, err := exec.LookPath("kubectl"); err != nil {
		writeWSMsg(conn, "\r\n\x1b[31m✗ kubectl not found\x1b[0m\r\n")
		return
	}
	if _, err := exec.LookPath("kubectl-node_shell"); err != nil {
		writeWSMsg(conn, "\r\n\x1b[31m✗ kubectl-node_shell not found\x1b[0m\r\n")
		return
	}

	// Lấy workload kubeconfig từ CAPI Secret
	writeWSMsg(conn, fmt.Sprintf("\x1b[36mFetching kubeconfig for \x1b[1m%s\x1b[0m\x1b[36m...\x1b[0m\r\n", clusterName))
	kubeconfig, err := NodeShellSvc.GetWorkloadKubeconfig(c.Request.Context(), namespace, clusterName)
	if err != nil {
		writeWSMsg(conn, fmt.Sprintf("\r\n\x1b[31m✗ Cannot get kubeconfig: %s\x1b[0m\r\n", err.Error()))
		return
	}

	tmpFile, err := os.CreateTemp("", "wl-kubeconfig-*.yaml")
	if err != nil {
		writeWSMsg(conn, "\r\n\x1b[31m✗ Cannot create temp file\x1b[0m\r\n")
		return
	}
	defer os.Remove(tmpFile.Name())
	tmpFile.Write(kubeconfig)
	tmpFile.Close()

	writeWSMsg(conn, fmt.Sprintf("\x1b[32m✓ Connecting to \x1b[1m%s\x1b[0m\x1b[32m...\x1b[0m\r\n\r\n", nodeName))

	// Clean env — không kế thừa in-cluster vars
	cmd := exec.Command("kubectl", "node-shell", nodeName,
		"--kubeconfig", tmpFile.Name(),
	)
	cmd.Env = []string{
		"KUBECONFIG=" + tmpFile.Name(),
		"HOME=/tmp",
		"PATH=" + os.Getenv("PATH"),
		"TERM=xterm-256color",
	}

	// Start với PTY — bắt buộc để shell prompt hiển thị
	ptmx, err := pty.Start(cmd)
	if err != nil {
		writeWSMsg(conn, fmt.Sprintf("\r\n\x1b[31m✗ PTY start failed: %s\x1b[0m\r\n", err.Error()))
		return
	}
	defer ptmx.Close()
	pty.Setsize(ptmx, &pty.Winsize{Rows: 50, Cols: 220})

	done := make(chan struct{})

	// PTY stdout → WebSocket
	go func() {
		defer close(done)
		buf := make([]byte, 4096)
		for {
			n, readErr := ptmx.Read(buf)
			if n > 0 {
				if wErr := conn.WriteMessage(websocket.BinaryMessage, buf[:n]); wErr != nil {
					break
				}
			}
			if readErr != nil {
				break
			}
		}
	}()

	// WebSocket → PTY stdin
	go func() {
		for {
			_, msg, readErr := conn.ReadMessage()
			if readErr != nil {
				return
			}
			// Xử lý resize message từ frontend
			var resize struct {
				Type string `json:"type"`
				Cols uint16 `json:"cols"`
				Rows uint16 `json:"rows"`
			}
			if len(msg) > 2 && msg[0] == '{' {
				if jsonErr := json.Unmarshal(msg, &resize); jsonErr == nil && resize.Type == "resize" {
					pty.Setsize(ptmx, &pty.Winsize{Rows: resize.Rows, Cols: resize.Cols})
					continue
				}
			}
			ptmx.Write(msg)
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
