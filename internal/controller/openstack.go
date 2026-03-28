package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/vnpay/capi-dashboard/internal/repository"
)

type OpenStackController struct {
	repo *repository.OpenStackRepository
}

func NewOpenStackController(repo *repository.OpenStackRepository) *OpenStackController {
	return &OpenStackController{repo: repo}
}

func (ctrl *OpenStackController) GetFlavors(c *gin.Context) {
	flavors, err := ctrl.repo.ListFlavors(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, flavors)
}

func (ctrl *OpenStackController) GetImages(c *gin.Context) {
	images, err := ctrl.repo.ListImages(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, images)
}

func (ctrl *OpenStackController) GetNetworks(c *gin.Context) {
	networks, err := ctrl.repo.ListNetworks(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, networks)
}

func (ctrl *OpenStackController) GetSecurityGroups(c *gin.Context) {
	groups, err := ctrl.repo.ListSecurityGroups(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, groups)
}
