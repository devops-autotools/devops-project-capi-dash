package service

import (
	"testing"
	"time"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// newUnstructured tạo object giả cho test
func newUnstructured(name, namespace string, fields map[string]interface{}) *unstructured.Unstructured {
	obj := &unstructured.Unstructured{Object: map[string]interface{}{
		"metadata": map[string]interface{}{
			"name":              name,
			"namespace":         namespace,
			"creationTimestamp": time.Now().UTC().Format(time.RFC3339),
		},
	}}
	for k, v := range fields {
		_ = unstructured.SetNestedField(obj.Object, v, splitDots(k)...)
	}
	return obj
}

func splitDots(s string) []string {
	var parts []string
	cur := ""
	for _, c := range s {
		if c == '.' {
			parts = append(parts, cur)
			cur = ""
		} else {
			cur += string(c)
		}
	}
	return append(parts, cur)
}

func newService() *ClusterService {
	return &ClusterService{} // repo & engine nil — chỉ test format functions
}

// ── FormatCluster ─────────────────────────────────────────────────────────────

func TestFormatCluster_BasicFields(t *testing.T) {
	obj := newUnstructured("my-cluster", "my-ns", map[string]interface{}{
		"status.phase":               "Provisioned",
		"spec.infrastructureRef.kind": "OpenStackCluster",
		"status.controlPlaneReady":   true,
		"status.infrastructureReady": true,
	})
	svc := newService()
	result := svc.FormatCluster(obj)

	checks := map[string]interface{}{
		"name":                "my-cluster",
		"namespace":           "my-ns",
		"phase":               "Provisioned",
		"infrastructure":      "OpenStackCluster",
		"controlPlaneReady":   true,
		"infrastructureReady": true,
	}
	for k, want := range checks {
		if result[k] != want {
			t.Errorf("FormatCluster[%s] = %v, want %v", k, result[k], want)
		}
	}
}

func TestFormatCluster_MissingStatusFields(t *testing.T) {
	obj := &unstructured.Unstructured{Object: map[string]interface{}{
		"metadata": map[string]interface{}{
			"name":              "empty-cluster",
			"namespace":         "default",
			"creationTimestamp": metav1.Now(),
		},
	}}
	svc := newService()
	result := svc.FormatCluster(obj)

	if result["phase"] != "" {
		t.Errorf("expected empty phase, got %v", result["phase"])
	}
	if result["controlPlaneReady"] != false {
		t.Errorf("expected false controlPlaneReady, got %v", result["controlPlaneReady"])
	}
}

// ── FormatMachine ─────────────────────────────────────────────────────────────

func TestFormatMachine_BasicFields(t *testing.T) {
	obj := newUnstructured("machine-01", "ns-01", map[string]interface{}{
		"status.phase":               "Running",
		"spec.clusterName":           "cluster-01",
		"spec.version":               "v1.30.10",
		"status.nodeRef.name":        "node-01",
		"spec.infrastructureRef.kind": "OpenStackMachine",
		"status.bootstrapReady":      true,
		"status.infrastructureReady": true,
	})
	svc := newService()
	result := svc.FormatMachine(obj)

	checks := map[string]interface{}{
		"name":               "machine-01",
		"namespace":          "ns-01",
		"phase":              "Running",
		"clusterName":        "cluster-01",
		"version":            "v1.30.10",
		"nodeName":           "node-01",
		"infrastructure":     "OpenStackMachine",
		"bootstrapReady":     true,
		"infrastructureReady": true,
	}
	for k, want := range checks {
		if result[k] != want {
			t.Errorf("FormatMachine[%s] = %v, want %v", k, result[k], want)
		}
	}
}

func TestFormatMachine_FailureFields(t *testing.T) {
	obj := newUnstructured("failed-machine", "ns-01", map[string]interface{}{
		"status.phase":          "Failed",
		"status.failureReason":  "InsufficientResourcesOnNode",
		"status.failureMessage": "not enough CPU",
	})
	svc := newService()
	result := svc.FormatMachine(obj)

	if result["failureReason"] != "InsufficientResourcesOnNode" {
		t.Errorf("failureReason = %v", result["failureReason"])
	}
	if result["failureMessage"] != "not enough CPU" {
		t.Errorf("failureMessage = %v", result["failureMessage"])
	}
}

// ── FormatMachineDeployment ───────────────────────────────────────────────────

func TestFormatMachineDeployment_BasicFields(t *testing.T) {
	obj := newUnstructured("md-workers", "ns-01", map[string]interface{}{
		"spec.clusterName":           "cluster-01",
		"spec.replicas":              int64(3),
		"status.readyReplicas":       int64(3),
		"status.availableReplicas":   int64(3),
		"status.phase":               "Running",
	})
	svc := newService()
	result := svc.FormatMachineDeployment(obj)

	if result["clusterName"] != "cluster-01" {
		t.Errorf("clusterName = %v", result["clusterName"])
	}
	if result["replicas"] != int64(3) {
		t.Errorf("replicas = %v", result["replicas"])
	}
	if result["readyReplicas"] != int64(3) {
		t.Errorf("readyReplicas = %v", result["readyReplicas"])
	}
}

func TestFormatMachineDeployment_UnhealthyReplicas(t *testing.T) {
	obj := newUnstructured("md-workers", "ns-01", map[string]interface{}{
		"spec.replicas":            int64(3),
		"status.readyReplicas":     int64(1),
		"status.availableReplicas": int64(1),
	})
	svc := newService()
	result := svc.FormatMachineDeployment(obj)

	if result["readyReplicas"] == result["replicas"] {
		t.Error("should be unhealthy: readyReplicas != replicas")
	}
}
