package controller

import (
	"net/http"
	"os/exec"

	"github.com/gin-gonic/gin"
)

// GetSystemTools handles GET /api/v1/system/tools
// Kiểm tra các CLI tools cần thiết trên management cluster
func GetSystemTools(c *gin.Context) {
	tools := map[string]interface{}{}

	// Kiểm tra kubectl-node-shell
	_, err := exec.LookPath("kubectl-node-shell")
	if err != nil {
		// Thử tìm thêm theo alias "kubectl node-shell" (plugin)
		cmd := exec.Command("kubectl", "node-shell", "--version")
		err = cmd.Run()
	}
	tools["kubectlNodeShell"] = map[string]interface{}{
		"available":   err == nil,
		"installHint": "kubectl krew install node-shell",
		"usage":       "kubectl node-shell <node-name>",
		"docs":        "https://github.com/kvaps/kubectl-node-shell",
	}

	c.JSON(http.StatusOK, tools)
}
