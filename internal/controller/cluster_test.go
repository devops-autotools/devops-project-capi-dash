package controller

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func newTestRouter() *gin.Engine {
	r := gin.New()
	return r
}

// ── Health endpoint ───────────────────────────────────────────────────────────

func TestHealthEndpoint(t *testing.T) {
	r := newTestRouter()
	r.GET("/api/v1/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "UP"})
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/v1/health", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	var body map[string]string
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}
	if body["status"] != "UP" {
		t.Errorf("expected status=UP, got %v", body["status"])
	}
}

// ── ClusterController — validation tests ─────────────────────────────────────

func TestCreateCluster_MissingRequiredFields(t *testing.T) {
	r := newTestRouter()
	ctrl := &ClusterController{Service: nil}
	r.POST("/api/v1/clusters", ctrl.Create)

	// Gửi body rỗng — phải 400
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/api/v1/clusters",
		strings.NewReader(`{}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for missing required fields, got %d", w.Code)
	}
}

func TestCreateCluster_InvalidJSON(t *testing.T) {
	r := newTestRouter()
	ctrl := &ClusterController{Service: nil}
	r.POST("/api/v1/clusters", ctrl.Create)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/api/v1/clusters",
		strings.NewReader(`{invalid json`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid JSON, got %d", w.Code)
	}
}

func TestDeleteCluster_MissingParams(t *testing.T) {
	r := newTestRouter()
	ctrl := &ClusterController{Service: nil}
	// Route tanpa namespace/name — tidak cocok, harus 404
	r.DELETE("/api/v1/clusters/:namespace/:name", ctrl.Delete)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("DELETE", "/api/v1/clusters", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected 404 for missing path params, got %d", w.Code)
	}
}

func TestGetCluster_RouteMatch(t *testing.T) {
	r := newTestRouter()
	// Mock handler để kiểm tra params được parse đúng
	r.GET("/api/v1/clusters/:namespace/:name", func(c *gin.Context) {
		ns := c.Param("namespace")
		name := c.Param("name")
		c.JSON(http.StatusOK, gin.H{"namespace": ns, "name": name})
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/v1/clusters/lab-ns/lab-cluster", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
	var body map[string]string
	json.Unmarshal(w.Body.Bytes(), &body)
	if body["namespace"] != "lab-ns" {
		t.Errorf("namespace = %v", body["namespace"])
	}
	if body["name"] != "lab-cluster" {
		t.Errorf("name = %v", body["name"])
	}
}

func TestMachineRoutes_PathParams(t *testing.T) {
	r := newTestRouter()
	r.GET("/api/v1/clusters/:namespace/:name/machines", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"namespace": c.Param("namespace"),
			"cluster":   c.Param("name"),
		})
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/v1/clusters/test-ns/test-cluster/machines", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
	var body map[string]string
	json.Unmarshal(w.Body.Bytes(), &body)
	if body["cluster"] != "test-cluster" {
		t.Errorf("cluster param = %v", body["cluster"])
	}
}
