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
	"github.com/gophercloud/gophercloud"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

func main() {
	// Setup Structured Logging
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	// 1. K8s Config
	var config *rest.Config
	var err error

	kubeconfigPath := os.Getenv("KUBECONFIG")
	if kubeconfigPath == "" {
		kubeconfigPath = os.Getenv("HOME") + "/.kube/config"
	}

	if _, err := os.Stat(kubeconfigPath); err == nil {
		config, err = clientcmd.BuildConfigFromFlags("", kubeconfigPath)
	} else {
		config, err = rest.InClusterConfig()
	}

	if err != nil {
		slog.Warn("Failed to get K8s config. Running in mock/limited mode.", "error", err)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// 3. OpenStack Config (From ENV)
	authOptions := gophercloud.AuthOptions{
		IdentityEndpoint: os.Getenv("OS_AUTH_URL"),
		Username:         os.Getenv("OS_USERNAME"),
		Password:         os.Getenv("OS_PASSWORD"),
		TenantName:       os.Getenv("OS_PROJECT_NAME"),
		DomainName:       os.Getenv("OS_DOMAIN_NAME"),
	}

	// 4. Initialize Repositories
	k8sRepo, err := repository.NewK8sRepository(config)
	if err != nil {
		slog.Error("Failed to initialize K8s repository", "error", err)
		os.Exit(1)
	}

	osRepo, err := repository.NewOpenStackRepository(authOptions)
	if err != nil {
		slog.Warn("Failed to initialize OpenStack repository (check OS_ ENV vars)", "error", err)
	}

	templateDir := "internal/assets/templates/openstack"
	engine := render.NewTemplateEngine(templateDir)

	clusterService := service.NewClusterService(engine, k8sRepo)
	clusterCtrl := controller.NewClusterController(clusterService)
	osCtrl := controller.NewOpenStackController(osRepo)

	// 5. Initialize Router
	r := gin.Default()

	v1 := r.Group("/api/v1")
	{
		v1.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"status": "UP"})
		})

		v1.GET("/clusters", clusterCtrl.List)
		v1.GET("/clusters/events", clusterCtrl.Events) // SSE Stream
		v1.GET("/clusters/:namespace/:name", clusterCtrl.Get)
		v1.POST("/clusters", clusterCtrl.Create)
		v1.DELETE("/clusters/:namespace/:name", clusterCtrl.Delete)

		// Logs Viewer
		v1.GET("/logs/pods", clusterCtrl.ListPods)
		v1.GET("/logs/:namespace/:name", clusterCtrl.GetLogs)

		// OpenStack Metadata
		if osRepo != nil {
			osGroup := v1.Group("/os")
			{
				osGroup.GET("/flavors", osCtrl.GetFlavors)
				osGroup.GET("/images", osCtrl.GetImages)
				osGroup.GET("/networks", osCtrl.GetNetworks)
				osGroup.GET("/security-groups", osCtrl.GetSecurityGroups)
			}
		}
	}

	// 4. Start Server
	slog.Info("🚀 CAPI Dashboard Backend starting", "port", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
