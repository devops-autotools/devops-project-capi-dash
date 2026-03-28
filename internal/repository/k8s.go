package repository

import (
	"context"
	"fmt"
	"io"
	"log/slog"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/runtime/serializer/yaml"
	"k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/discovery"
	"k8s.io/client-go/discovery/cached/memory"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/restmapper"
)

type K8sRepository struct {
	dynamicClient dynamic.Interface
	clientset     *kubernetes.Clientset
	mapper        meta.RESTMapper
}

func NewK8sRepository(config *rest.Config) (*K8sRepository, error) {
	dynamicClient, err := dynamic.NewForConfig(config)
	if err != nil {
		return nil, err
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, err
	}

	dc, err := discovery.NewDiscoveryClientForConfig(config)
	if err != nil {
		return nil, err
	}

	mapper := restmapper.NewDeferredDiscoveryRESTMapper(memory.NewMemCacheClient(dc))

	return &K8sRepository{
		dynamicClient: dynamicClient,
		clientset:     clientset,
		mapper:        mapper,
	}, nil
}

// Apply nhận một chuỗi YAML và apply nó vào cluster (tương đương kubectl apply)
func (r *K8sRepository) Apply(ctx context.Context, yamlData string) error {
	decUnstructured := yaml.NewDecodingSerializer(unstructured.UnstructuredJSONScheme)
	obj := &unstructured.Unstructured{}
	_, gvk, err := decUnstructured.Decode([]byte(yamlData), nil, obj)
	if err != nil {
		slog.Error("Failed to decode YAML", "error", err)
		return fmt.Errorf("failed to decode YAML: %w", err)
	}

	mapping, err := r.mapper.RESTMapping(gvk.GroupKind(), gvk.Version)
	if err != nil {
		return fmt.Errorf("failed to get REST mapping: %w", err)
	}

	var dr dynamic.ResourceInterface
	if mapping.Scope.Name() == meta.RESTScopeNameNamespace {
		dr = r.dynamicClient.Resource(mapping.Resource).Namespace(obj.GetNamespace())
	} else {
		dr = r.dynamicClient.Resource(mapping.Resource)
	}

	_, err = dr.Get(ctx, obj.GetName(), metav1.GetOptions{})
	if errors.IsNotFound(err) {
		slog.Info("Creating resource", "kind", gvk.Kind, "name", obj.GetName())
		_, err = dr.Create(ctx, obj, metav1.CreateOptions{})
		return err
	} else if err != nil {
		return err
	}

	slog.Info("Updating resource", "kind", gvk.Kind, "name", obj.GetName())
	_, err = dr.Update(ctx, obj, metav1.UpdateOptions{})
	return err
}

// ApplyMany nhận danh sách các chuỗi YAML và apply chúng theo thứ tự
func (r *K8sRepository) ApplyMany(ctx context.Context, yamls []string) error {
	for _, yamlData := range yamls {
		if err := r.Apply(ctx, yamlData); err != nil {
			return err
		}
	}
	return nil
}

// DeleteCluster xóa một Workload Cluster (CRD: clusters.cluster.x-k8s.io)
func (r *K8sRepository) DeleteCluster(ctx context.Context, namespace, name string) error {
	gvk := schema.GroupVersionKind{
		Group:   "cluster.x-k8s.io",
		Version: "v1beta1",
		Kind:    "Cluster",
	}

	mapping, err := r.mapper.RESTMapping(gvk.GroupKind(), gvk.Version)
	if err != nil {
		return fmt.Errorf("failed to get REST mapping for deletion: %w", err)
	}

	slog.Info("Deleting cluster", "namespace", namespace, "name", name)
	dr := r.dynamicClient.Resource(mapping.Resource).Namespace(namespace)
	err = dr.Delete(ctx, name, metav1.DeleteOptions{})
	if err != nil && !errors.IsNotFound(err) {
		return fmt.Errorf("failed to delete cluster %s/%s: %w", namespace, name, err)
	}

	return nil
}

// GetCluster lấy chi tiết một Workload Cluster
func (r *K8sRepository) GetCluster(ctx context.Context, namespace, name string) (*unstructured.Unstructured, error) {
	gvk := schema.GroupVersionKind{
		Group:   "cluster.x-k8s.io",
		Version: "v1beta1",
		Kind:    "Cluster",
	}

	mapping, err := r.mapper.RESTMapping(gvk.GroupKind(), gvk.Version)
	if err != nil {
		return nil, err
	}

	obj, err := r.dynamicClient.Resource(mapping.Resource).Namespace(namespace).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	return obj, nil
}

// ListClusters lấy danh sách toàn bộ Workload Clusters (CRD: clusters.cluster.x-k8s.io)
func (r *K8sRepository) ListClusters(ctx context.Context, namespace string) ([]unstructured.Unstructured, error) {
	gvk := schema.GroupVersionKind{
		Group:   "cluster.x-k8s.io",
		Version: "v1beta1",
		Kind:    "Cluster",
	}

	mapping, err := r.mapper.RESTMapping(gvk.GroupKind(), gvk.Version)
	if err != nil {
		return nil, err
	}

	list, err := r.dynamicClient.Resource(mapping.Resource).Namespace(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	return list.Items, nil
}

// WatchClusters theo dõi sự thay đổi của toàn bộ Clusters
func (r *K8sRepository) WatchClusters(ctx context.Context, namespace string) (watch.Interface, error) {
	gvk := schema.GroupVersionKind{
		Group:   "cluster.x-k8s.io",
		Version: "v1beta1",
		Kind:    "Cluster",
	}

	mapping, err := r.mapper.RESTMapping(gvk.GroupKind(), gvk.Version)
	if err != nil {
		return nil, err
	}

	return r.dynamicClient.Resource(mapping.Resource).Namespace(namespace).Watch(ctx, metav1.ListOptions{})
}

// ListPods lấy danh sách pods trong một namespace (cho việc xem log controllers)
func (r *K8sRepository) ListPods(ctx context.Context, namespace string, labelSelector string) ([]corev1.Pod, error) {
	list, err := r.clientset.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{
		LabelSelector: labelSelector,
	})
	if err != nil {
		return nil, err
	}
	return list.Items, nil
}

// GetPodLogs lấy log từ một pod
func (r *K8sRepository) GetPodLogs(ctx context.Context, namespace, name string, tailLines int64) (io.ReadCloser, error) {
	podLogOpts := corev1.PodLogOptions{
		TailLines: &tailLines,
		Follow:    false,
	}
	req := r.clientset.CoreV1().Pods(namespace).GetLogs(name, &podLogOpts)
	return req.Stream(ctx)
}

// ListMachines lấy danh sách Machines trong namespace (CAPI CRD)
func (r *K8sRepository) ListMachines(ctx context.Context, namespace string, clusterName string) ([]unstructured.Unstructured, error) {
	gvk := schema.GroupVersionKind{
		Group:   "cluster.x-k8s.io",
		Version: "v1beta1",
		Kind:    "Machine",
	}
	mapping, err := r.mapper.RESTMapping(gvk.GroupKind(), gvk.Version)
	if err != nil {
		return nil, err
	}

	listOpts := metav1.ListOptions{}
	if clusterName != "" {
		listOpts.LabelSelector = "cluster.x-k8s.io/cluster-name=" + clusterName
	}

	list, err := r.dynamicClient.Resource(mapping.Resource).Namespace(namespace).List(ctx, listOpts)
	if err != nil {
		return nil, err
	}
	return list.Items, nil
}

// ListMachineDeployments lấy danh sách MachineDeployments trong namespace
func (r *K8sRepository) ListMachineDeployments(ctx context.Context, namespace string, clusterName string) ([]unstructured.Unstructured, error) {
	gvk := schema.GroupVersionKind{
		Group:   "cluster.x-k8s.io",
		Version: "v1beta1",
		Kind:    "MachineDeployment",
	}
	mapping, err := r.mapper.RESTMapping(gvk.GroupKind(), gvk.Version)
	if err != nil {
		return nil, err
	}

	listOpts := metav1.ListOptions{}
	if clusterName != "" {
		listOpts.LabelSelector = "cluster.x-k8s.io/cluster-name=" + clusterName
	}

	list, err := r.dynamicClient.Resource(mapping.Resource).Namespace(namespace).List(ctx, listOpts)
	if err != nil {
		return nil, err
	}
	return list.Items, nil
}
