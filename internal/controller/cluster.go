package controller

import (
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/vnpay/capi-dashboard/internal/models"
	"github.com/vnpay/capi-dashboard/internal/service"
)

type ClusterController struct {
	Service *service.ClusterService
}

func NewClusterController(service *service.ClusterService) *ClusterController {
	return &ClusterController{Service: service}
}

// List handles GET /api/v1/clusters
func (ctrl *ClusterController) List(c *gin.Context) {
	namespace := c.Query("namespace") // Optional filter

	clusters, err := ctrl.Service.ListClusters(c.Request.Context(), namespace)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, clusters)
}

// Get handles GET /api/v1/clusters/:namespace/:name
func (ctrl *ClusterController) Get(c *gin.Context) {
	namespace := c.Param("namespace")
	name := c.Param("name")

	cluster, err := ctrl.Service.GetCluster(c.Request.Context(), namespace, name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, cluster)
}

// Create handles POST /api/v1/clusters
func (ctrl *ClusterController) Create(c *gin.Context) {
	var config models.ClusterConfig
	if err := c.ShouldBindJSON(&config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Gọi service để Render và Apply
	if err := ctrl.Service.CreateWorkloadCluster(c.Request.Context(), config); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create cluster: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Workload cluster creation initiated successfully",
	})
}

// Delete handles DELETE /api/v1/clusters/:namespace/:name
func (ctrl *ClusterController) Delete(c *gin.Context) {
	namespace := c.Param("namespace")
	name := c.Param("name")

	if namespace == "" || name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Namespace and Name are required"})
		return
	}

	if err := ctrl.Service.DeleteCluster(c.Request.Context(), namespace, name); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Cluster deletion initiated successfully",
	})
}

// Events handles GET /api/v1/clusters/events (SSE)
func (ctrl *ClusterController) Events(c *gin.Context) {
	namespace := c.Query("namespace")
	
	events, err := ctrl.Service.WatchClusters(c.Request.Context(), namespace)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	c.Stream(func(w io.Writer) bool {
		select {
		case <-c.Request.Context().Done():
			return false
		case <-ticker.C:
			c.SSEvent("heartbeat", "ping")
			return true
		case event, ok := <-events:
			if !ok {
				return false
			}
			c.SSEvent("message", event)
			return true
		}
	})
}

// ListPods handles GET /api/v1/logs/pods
func (ctrl *ClusterController) ListPods(c *gin.Context) {
	pods, err := ctrl.Service.ListControllerPods(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, pods)
}

// GetLogs handles GET /api/v1/logs/:namespace/:name
func (ctrl *ClusterController) GetLogs(c *gin.Context) {
	namespace := c.Param("namespace")
	name := c.Param("name")
	tailStr := c.DefaultQuery("tail", "100")
	tail, _ := strconv.ParseInt(tailStr, 10, 64)

	stream, err := ctrl.Service.GetPodLogs(c.Request.Context(), namespace, name, tail)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer stream.Close()

	c.Header("Content-Type", "text/plain")
	io.Copy(c.Writer, stream)
}

// ListMachines handles GET /api/v1/clusters/:namespace/:name/machines
func (ctrl *ClusterController) ListMachines(c *gin.Context) {
	namespace := c.Param("namespace")
	clusterName := c.Param("name")
	machines, err := ctrl.Service.ListMachines(c.Request.Context(), namespace, clusterName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, machines)
}

// ListMachineDeployments handles GET /api/v1/clusters/:namespace/:name/machinedeployments
func (ctrl *ClusterController) ListMachineDeployments(c *gin.Context) {
	namespace := c.Param("namespace")
	clusterName := c.Param("name")
	mds, err := ctrl.Service.ListMachineDeployments(c.Request.Context(), namespace, clusterName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, mds)
}
