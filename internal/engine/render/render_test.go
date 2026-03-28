package render

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/vnpay/capi-dashboard/internal/models"
)

func TestTemplateEngine_RenderAllTemplates(t *testing.T) {
	// 1. Tạo thư mục tạm và các file template giả lập
	tempDir, err := os.MkdirTemp("", "templates")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	tmpl1 := "name: {{.ClusterName}}\nnamespace: {{.Namespace}}"
	if err := os.WriteFile(filepath.Join(tempDir, "1-test.yaml.tmpl"), []byte(tmpl1), 0644); err != nil {
		t.Fatalf("failed to write temp template: %v", err)
	}

	tmpl2 := "image: {{.ImageName}}\nflavor: {{.CPFlavor}}"
	if err := os.WriteFile(filepath.Join(tempDir, "2-test.yaml.tmpl"), []byte(tmpl2), 0644); err != nil {
		t.Fatalf("failed to write temp template: %v", err)
	}

	// 2. Khởi tạo Engine
	engine := NewTemplateEngine(tempDir)

	// 3. Mock Config
	config := models.ClusterConfig{
		ClusterName: "test-cluster",
		Namespace:   "default",
		ImageName:   "ubuntu-22.04",
		CPFlavor:    "m1.medium",
	}

	// 4. Run test
	yamls, err := engine.RenderAllTemplates(config)
	if err != nil {
		t.Fatalf("RenderAllTemplates failed: %v", err)
	}

	// 5. Kiểm tra kết quả
	if len(yamls) != 2 {
		t.Errorf("expected 2 rendered yamls, got %d", len(yamls))
	}

	expected1 := "name: test-cluster\nnamespace: default"
	if yamls[0] != expected1 {
		t.Errorf("expected %q, got %q", expected1, yamls[0])
	}

	expected2 := "image: ubuntu-22.04\nflavor: m1.medium"
	if yamls[1] != expected2 {
		t.Errorf("expected %q, got %q", expected2, yamls[1])
	}
}
