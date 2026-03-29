package render

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/vnpay/capi-dashboard/internal/models"
)

// ── helpers ──────────────────────────────────────────────────────────────────

func newTempEngine(t *testing.T, files map[string]string) *TemplateEngine {
	t.Helper()
	dir, err := os.MkdirTemp("", "tpl-test-*")
	if err != nil {
		t.Fatalf("MkdirTemp: %v", err)
	}
	t.Cleanup(func() { os.RemoveAll(dir) })
	for name, body := range files {
		if err := os.WriteFile(filepath.Join(dir, name), []byte(body), 0644); err != nil {
			t.Fatalf("WriteFile %s: %v", name, err)
		}
	}
	return NewTemplateEngine(dir)
}

func baseConfig() models.ClusterConfig {
	return models.ClusterConfig{
		ClusterName:       "lab-test-01",
		Namespace:         "lab-test-01",
		K8sVersion:        "v1.30.10",
		NetworkID:         "net-uuid-123",
		ExternalNetworkID: "ext-uuid-456",
		SSHKeyName:        "my-key",
		ImageName:         "kaas-v1.30.10",
		CPFlavor:          "std.4x8",
		WorkerFlavor:      "std.4x8",
		CPReplicas:        1,
		WorkerReplicas:    2,
		CPVolumeSize:      50,
		WorkerVolumeSize:  50,
		CNI:               "cilium",
		PodCIDR:           "10.244.0.0/16",
		ServiceCIDR:       "10.96.0.0/12",
		ServiceDomain:     "cluster.local",
		AvailabilityZone:  "nova",
		CloudsYamlBase64:  "dGVzdA==",
	}
}

// ── Tests ─────────────────────────────────────────────────────────────────────

func TestRenderAllTemplates_Basic(t *testing.T) {
	engine := newTempEngine(t, map[string]string{
		"1-a.yaml.tmpl": "name: {{.ClusterName}}",
		"2-b.yaml.tmpl": "ns: {{.Namespace}}",
	})
	yamls, err := engine.RenderAllTemplates(baseConfig())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(yamls) != 2 {
		t.Fatalf("want 2 yamls, got %d", len(yamls))
	}
	if yamls[0] != "name: lab-test-01" {
		t.Errorf("yaml[0] = %q", yamls[0])
	}
	if yamls[1] != "ns: lab-test-01" {
		t.Errorf("yaml[1] = %q", yamls[1])
	}
}

func TestRenderAllTemplates_OrderedByFilename(t *testing.T) {
	engine := newTempEngine(t, map[string]string{
		"3-c.yaml.tmpl": "third",
		"1-a.yaml.tmpl": "first",
		"2-b.yaml.tmpl": "second",
	})
	yamls, err := engine.RenderAllTemplates(baseConfig())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	want := []string{"first", "second", "third"}
	for i, w := range want {
		if yamls[i] != w {
			t.Errorf("yaml[%d] = %q, want %q", i, yamls[i], w)
		}
	}
}

func TestRenderAllTemplates_DefaultFunction(t *testing.T) {
	engine := newTempEngine(t, map[string]string{
		"1-t.yaml.tmpl": `cni: {{ .CNI | default "calico" }}`,
	})
	cfg := baseConfig()
	cfg.CNI = ""
	yamls, err := engine.RenderAllTemplates(cfg)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if yamls[0] != `cni: calico` {
		t.Errorf("default fn failed: got %q", yamls[0])
	}
}

func TestRenderAllTemplates_DefaultFunctionPreservesValue(t *testing.T) {
	engine := newTempEngine(t, map[string]string{
		"1-t.yaml.tmpl": `cni: {{ .CNI | default "calico" }}`,
	})
	yamls, err := engine.RenderAllTemplates(baseConfig())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if yamls[0] != `cni: cilium` {
		t.Errorf("default fn should not override non-empty: got %q", yamls[0])
	}
}

func TestRenderAllTemplates_EmptyDir(t *testing.T) {
	engine := newTempEngine(t, map[string]string{})
	yamls, err := engine.RenderAllTemplates(baseConfig())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(yamls) != 0 {
		t.Errorf("want 0 yamls, got %d", len(yamls))
	}
}

func TestRenderAllTemplates_InvalidTemplateSyntax(t *testing.T) {
	engine := newTempEngine(t, map[string]string{
		"1-bad.yaml.tmpl": "{{ .ClusterName",
	})
	_, err := engine.RenderAllTemplates(baseConfig())
	if err == nil {
		t.Fatal("expected parse error, got nil")
	}
}

func TestRenderAllTemplates_UnknownField(t *testing.T) {
	engine := newTempEngine(t, map[string]string{
		"1-t.yaml.tmpl": "{{ .NonExistentField }}",
	})
	_, err := engine.RenderAllTemplates(baseConfig())
	if err == nil {
		t.Fatal("expected execute error for unknown field, got nil")
	}
}

func TestRenderAllTemplates_IgnoresNonTmplFiles(t *testing.T) {
	engine := newTempEngine(t, map[string]string{
		"1-a.yaml.tmpl": "valid",
		"README.md":     "not a template",
		"notes.txt":     "ignored",
	})
	yamls, err := engine.RenderAllTemplates(baseConfig())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(yamls) != 1 {
		t.Errorf("want 1 yaml, got %d", len(yamls))
	}
}

func TestRenderAllTemplates_AllFields(t *testing.T) {
	tpl := `cluster: {{.ClusterName}}
namespace: {{.Namespace}}
network: {{.NetworkID}}
external: {{.ExternalNetworkID}}
ssh: {{.SSHKeyName}}
image: {{.ImageName}}
cpFlavor: {{.CPFlavor}}
workerFlavor: {{.WorkerFlavor}}
cpReplicas: {{.CPReplicas}}
workerReplicas: {{.WorkerReplicas}}
serviceDomain: {{.ServiceDomain}}`

	engine := newTempEngine(t, map[string]string{"1-all.yaml.tmpl": tpl})
	yamls, err := engine.RenderAllTemplates(baseConfig())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	for _, check := range []string{
		"cluster: lab-test-01",
		"network: net-uuid-123",
		"ssh: my-key",
		"cpReplicas: 1",
		"workerReplicas: 2",
		"serviceDomain: cluster.local",
	} {
		if !strings.Contains(yamls[0], check) {
			t.Errorf("output missing %q\nfull output:\n%s", check, yamls[0])
		}
	}
}
