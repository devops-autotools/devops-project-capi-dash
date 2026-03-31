package service

import (
	"context"
	"fmt"
	"io"

	"github.com/vnpay/capi-dashboard/internal/engine/render"
	"github.com/vnpay/capi-dashboard/internal/models"
	"github.com/vnpay/capi-dashboard/internal/repository"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/watch"
)

type ClusterService struct {
	engine *render.TemplateEngine
	repo   *repository.K8sRepository
}

func NewClusterService(engine *render.TemplateEngine, repo *repository.K8sRepository) *ClusterService {
	return &ClusterService{
		engine: engine,
		repo:   repo,
	}
}

// FormatCluster biến Unstructured object thành Map format cho UI
func (s *ClusterService) FormatCluster(item *unstructured.Unstructured) map[string]interface{} {
	phase, _, _ := unstructured.NestedString(item.Object, "status", "phase")
	infraKind, _, _ := unstructured.NestedString(item.Object, "spec", "infrastructureRef", "kind")
	cpReady, _, _ := unstructured.NestedBool(item.Object, "status", "controlPlaneReady")
	infraReady, _, _ := unstructured.NestedBool(item.Object, "status", "infrastructureReady")

	return map[string]interface{}{
		"name":                item.GetName(),
		"namespace":           item.GetNamespace(),
		"phase":               phase,
		"status":              phase,
		"infrastructure":      infraKind,
		"controlPlaneReady":   cpReady,
		"infrastructureReady": infraReady,
		"createdAt":           item.GetCreationTimestamp(),
	}
}

// ListClusters lấy và format danh sách clusters theo chuẩn CAPI
func (s *ClusterService) ListClusters(ctx context.Context, namespace string) ([]map[string]interface{}, error) {
	items, err := s.repo.ListClusters(ctx, namespace)
	if err != nil {
		return nil, err
	}

	result := make([]map[string]interface{}, 0)
	for _, item := range items {
		result = append(result, s.FormatCluster(&item))
	}

	return result, nil
}

// WatchClusters stream cluster events
func (s *ClusterService) WatchClusters(ctx context.Context, namespace string) (<-chan map[string]interface{}, error) {
	watcher, err := s.repo.WatchClusters(ctx, namespace)
	if err != nil {
		return nil, err
	}

	out := make(chan map[string]interface{})

	go func() {
		defer watcher.Stop()
		defer close(out)

		for {
			select {
			case <-ctx.Done():
				return
			case event, ok := <-watcher.ResultChan():
				if !ok {
					return
				}

				if event.Type == watch.Error {
					continue
				}

				obj, ok := event.Object.(*unstructured.Unstructured)
				if !ok {
					continue
				}

				formatted := s.FormatCluster(obj)
				formatted["eventType"] = string(event.Type)
				out <- formatted
			}
		}
	}()

	return out, nil
}

// GetCluster lấy chi tiết một cluster
func (s *ClusterService) GetCluster(ctx context.Context, namespace, name string) (map[string]interface{}, error) {
	item, err := s.repo.GetCluster(ctx, namespace, name)
	if err != nil {
		return nil, err
	}

	formatted := s.FormatCluster(item)
	
	// Extract conditions additional to base format
	conditions, _, _ := unstructured.NestedSlice(item.Object, "status", "conditions")
	formatted["conditions"] = conditions
	formatted["raw"] = item.Object

	return formatted, nil
}

// DeleteCluster thực hiện xóa cluster
func (s *ClusterService) DeleteCluster(ctx context.Context, namespace, name string) error {
	return s.repo.DeleteCluster(ctx, namespace, name)
}

// ListControllerPods liệt kê pods của các controllers
func (s *ClusterService) ListControllerPods(ctx context.Context) ([]map[string]interface{}, error) {
	// Kiểm tra các namespace phổ biến của CAPI
	namespaces := []string{
		"capi-system",
		"capo-system",
		"caaph-system",
		"capi-kubeadm-bootstrap-system",
		"capi-kubeadm-control-plane-system",
	}
	
	result := make([]map[string]interface{}, 0)
	for _, ns := range namespaces {
		pods, err := s.repo.ListPods(ctx, ns, "")
		if err != nil {
			continue
		}
		for _, p := range pods {
			result = append(result, map[string]interface{}{
				"name":      p.Name,
				"namespace": p.Namespace,
				"status":    string(p.Status.Phase),
				"node":      p.Spec.NodeName,
			})
		}
	}
	return result, nil
}

// GetPodLogs lấy log
func (s *ClusterService) GetPodLogs(ctx context.Context, namespace, name string, tailLines int64) (io.ReadCloser, error) {
	return s.repo.GetPodLogs(ctx, namespace, name, tailLines)
}

// CreateWorkloadCluster thực hiện Render và Apply chuỗi YAML
func (s *ClusterService) CreateWorkloadCluster(ctx context.Context, config models.ClusterConfig) error {
	yamls, err := s.engine.RenderAllTemplates(config)
	if err != nil {
		return fmt.Errorf("render failed: %w", err)
	}
	return s.repo.ApplyMany(ctx, yamls)
}

// ApplyMany logic inside Service to wrap Repo call (if needed)
func (s *ClusterService) ApplyMany(ctx context.Context, yamls []string) error {
	return s.repo.ApplyMany(ctx, yamls)
}

// FormatMachine biến Machine object thành map cho UI
func (s *ClusterService) FormatMachine(item *unstructured.Unstructured) map[string]interface{} {
	phase, _, _ := unstructured.NestedString(item.Object, "status", "phase")
	clusterName, _, _ := unstructured.NestedString(item.Object, "spec", "clusterName")
	version, _, _ := unstructured.NestedString(item.Object, "spec", "version")
	nodeName, _, _ := unstructured.NestedString(item.Object, "status", "nodeRef", "name")
	infraKind, _, _ := unstructured.NestedString(item.Object, "spec", "infrastructureRef", "kind")
	bootstrapReady, _, _ := unstructured.NestedBool(item.Object, "status", "bootstrapReady")
	infraReady, _, _ := unstructured.NestedBool(item.Object, "status", "infrastructureReady")
	failureReason, _, _ := unstructured.NestedString(item.Object, "status", "failureReason")
	failureMsg, _, _ := unstructured.NestedString(item.Object, "status", "failureMessage")

	return map[string]interface{}{
		"name":               item.GetName(),
		"namespace":          item.GetNamespace(),
		"clusterName":        clusterName,
		"phase":              phase,
		"version":            version,
		"nodeName":           nodeName,
		"infrastructure":     infraKind,
		"bootstrapReady":     bootstrapReady,
		"infrastructureReady": infraReady,
		"failureReason":      failureReason,
		"failureMessage":     failureMsg,
		"createdAt":          item.GetCreationTimestamp(),
	}
}

// FormatMachineDeployment biến MachineDeployment object thành map cho UI
func (s *ClusterService) FormatMachineDeployment(item *unstructured.Unstructured) map[string]interface{} {
	clusterName, _, _ := unstructured.NestedString(item.Object, "spec", "clusterName")
	replicas, _, _ := unstructured.NestedInt64(item.Object, "spec", "replicas")
	readyReplicas, _, _ := unstructured.NestedInt64(item.Object, "status", "readyReplicas")
	availableReplicas, _, _ := unstructured.NestedInt64(item.Object, "status", "availableReplicas")
	phase, _, _ := unstructured.NestedString(item.Object, "status", "phase")

	return map[string]interface{}{
		"name":               item.GetName(),
		"namespace":          item.GetNamespace(),
		"clusterName":        clusterName,
		"phase":              phase,
		"replicas":           replicas,
		"readyReplicas":      readyReplicas,
		"availableReplicas":  availableReplicas,
		"createdAt":          item.GetCreationTimestamp(),
	}
}

// ListMachines lấy và format danh sách Machines
func (s *ClusterService) ListMachines(ctx context.Context, namespace string, clusterName string) ([]map[string]interface{}, error) {
	items, err := s.repo.ListMachines(ctx, namespace, clusterName)
	if err != nil {
		return nil, err
	}
	result := make([]map[string]interface{}, 0, len(items))
	for _, item := range items {
		result = append(result, s.FormatMachine(&item))
	}
	return result, nil
}

// ListMachineDeployments lấy và format danh sách MachineDeployments
func (s *ClusterService) ListMachineDeployments(ctx context.Context, namespace string, clusterName string) ([]map[string]interface{}, error) {
	items, err := s.repo.ListMachineDeployments(ctx, namespace, clusterName)
	if err != nil {
		return nil, err
	}
	result := make([]map[string]interface{}, 0, len(items))
	for _, item := range items {
		result = append(result, s.FormatMachineDeployment(&item))
	}
	return result, nil
}
