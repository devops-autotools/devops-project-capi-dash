package render

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"text/template"

	"github.com/vnpay/capi-dashboard/internal/models"
)

// funcMap bổ sung các hàm mà Go text/template không có sẵn
var funcMap = template.FuncMap{
	// default trả về giá trị mặc định nếu giá trị hiện tại là zero value
	"default": func(defaultVal interface{}, val interface{}) interface{} {
		if val == nil {
			return defaultVal
		}
		switch v := val.(type) {
		case string:
			if v == "" {
				return defaultVal
			}
		case int:
			if v == 0 {
				return defaultVal
			}
		case bool:
			// bool không dùng default theo zero value, trả thẳng
			return val
		}
		return val
	},
}

// TemplateEngine xử lý việc render YAML từ bộ 8 file mẫu
type TemplateEngine struct {
	TemplateDir string
}

func NewTemplateEngine(dir string) *TemplateEngine {
	return &TemplateEngine{TemplateDir: dir}
}

// RenderAllTemplates render toàn bộ 8 file template theo đúng thứ tự
func (e *TemplateEngine) RenderAllTemplates(config models.ClusterConfig) ([]string, error) {
	// 1. Quét toàn bộ file .tmpl trong thư mục
	files, err := os.ReadDir(e.TemplateDir)
	if err != nil {
		return nil, fmt.Errorf("failed to read template directory: %w", err)
	}

	var templateFiles []string
	for _, f := range files {
		if !f.IsDir() && strings.HasSuffix(f.Name(), ".tmpl") {
			templateFiles = append(templateFiles, f.Name())
		}
	}

	// 2. Sắp xếp file theo tên (để đảm bảo thứ tự 1-8)
	sort.Strings(templateFiles)

	var renderedYamls []string
	for _, fileName := range templateFiles {
		fullPath := filepath.Join(e.TemplateDir, fileName)
		
		// 3. Parse và Execute template (với custom funcMap)
		tmpl, err := template.New(fileName).Funcs(funcMap).ParseFiles(fullPath)
		if err != nil {
			return nil, fmt.Errorf("failed to parse template %s: %w", fileName, err)
		}

		var buf bytes.Buffer
		if err := tmpl.Execute(&buf, config); err != nil {
			return nil, fmt.Errorf("failed to execute template %s: %w", fileName, err)
		}

		renderedYamls = append(renderedYamls, buf.String())
	}

	return renderedYamls, nil
}
