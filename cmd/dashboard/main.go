package main

import (
	"log"
	"log/slog"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/vnpay/capi-dashboard/internal/controller"
	"github.com/vnpay/capi-dashboard/internal/engine/render"
	"github.com/vnpay/capi-dashboard/internal/repository"
	"github.com/vnpay/capi-dashboard/internal/service"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	// K8s Config — ưu tiên KUBECONFIG, fallback InCluster
	var config *rest.Config
	var err error
	kubeconfigPath := os.Getenv("KUBECONFIG")
	if kubeconfigPath == "" {
		kubeconfigPath = os.Getenv("HOME") + "/.kube/config"
	}
	if _, statErr := os.Stat(kubeconfigPath); statErr == nil {
		config, err = clientcmd.BuildConfigFromFlags("", kubeconfigPath)
	} else {
		config, err = rest.InClusterConfig()
	}
	if err != nil {
		slog.Warn("Failed to get K8s config, running in limited mode", "error", err)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Repositories & Services
	k8sRepo, err := repository.NewK8sRepository(config)
	if err != nil {
		slog.Error("Failed to initialize K8s repository", "error", err)
		os.Exit(1)
	}

	templateDir := "internal/assets/templates/openstack"
	engine       := render.NewTemplateEngine(templateDir)
	clusterSvc   := service.NewClusterService(engine, k8sRepo)
	clusterCtrl  := controller.NewClusterController(clusterSvc)

	// Router
	r := gin.Default()
	v1 := r.Group("/api/v1")
	{
		v1.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"status": "UP"})
		})

		// Clusters
		v1.GET("/clusters",                                         clusterCtrl.List)
		v1.GET("/clusters/events",                                  clusterCtrl.Events)
		v1.GET("/clusters/:namespace/:name",                        clusterCtrl.Get)
		v1.POST("/clusters",                                        clusterCtrl.Create)
		v1.DELETE("/clusters/:namespace/:name",                     clusterCtrl.Delete)
		v1.GET("/clusters/:namespace/:name/machines",               clusterCtrl.ListMachines)
		v1.GET("/clusters/:namespace/:name/machinedeployments",     clusterCtrl.ListMachineDeployments)

		// Logs
		v1.GET("/logs/pods",              clusterCtrl.ListPods)
		v1.GET("/logs/:namespace/:name",  clusterCtrl.GetLogs)
	}

	slog.Info("🚀 CAPI Dashboard Backend starting", "port", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
