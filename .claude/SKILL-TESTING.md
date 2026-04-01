# CAPI Dashboard — Testing Skill

## Nguyên tắc: Test trước, merge sau
Mọi feature mới hoặc bug fix PHẢI có test tương ứng. `make test` phải pass trước khi deploy.

---

## Backend Unit Tests (Go)

### Cấu trúc test file
```
internal/
  engine/render/render_test.go      ← template engine tests
  service/cluster_service_test.go   ← format function tests
  controller/cluster_test.go        ← HTTP handler tests
```

### Pattern chuẩn
```go
func TestXxx_ScenarioName(t *testing.T) {
    // Arrange
    // Act
    result, err := ...
    // Assert
    if err != nil { t.Fatalf(...) }
    if result != want { t.Errorf(...) }
}
```

### Khi thêm field mới vào ClusterConfig
1. Thêm field vào `baseConfig()` trong `render_test.go`
2. Thêm test case `TestRenderAllTemplates_AllFields` kiểm tra field đó được render đúng
3. Thêm test `TestFormatXxx_BasicFields` nếu có format function mới

### Khi thêm endpoint mới
```go
// controller/cluster_test.go — pattern mẫu
func TestNewEndpoint_RouteMatch(t *testing.T) {
    r := newTestRouter()
    r.GET("/api/v1/new-path/:param", func(c *gin.Context) {
        c.JSON(200, gin.H{"param": c.Param("param")})
    })
    w := httptest.NewRecorder()
    req := httptest.NewRequest("GET", "/api/v1/new-path/test-value", nil)
    r.ServeHTTP(w, req)
    if w.Code != 200 { t.Errorf(...) }
}
```

### Khi fix bug template
```go
func TestRenderAllTemplates_BugRepro(t *testing.T) {
    // Template tái hiện bug
    engine := newTempEngine(t, map[string]string{
        "1-fix.yaml.tmpl": `value: {{ .TheField | default "fallback" }}`,
    })
    cfg := baseConfig()
    cfg.TheField = ""  // điều kiện trigger bug
    yamls, err := engine.RenderAllTemplates(cfg)
    // Assert giá trị đúng sau khi fix
}
```

### Chạy tests
```bash
make test              # verbose, tất cả packages
make test-short        # nhanh, không verbose
make test-coverage     # với coverage report
make build-safe        # test + build — dùng trước deploy
```

---

## Frontend Manual Test Cases

### TC-01: Create Cluster — Happy Path
1. Vào `/clusters/create`
2. Điền đủ tất cả fields (name, namespace, clouds.yaml, network IDs, SSH key, image, flavor, replicas)
3. Click "Provision Cluster"
4. **Expected:** Toast xanh "Cluster X creation initiated!", redirect về `/`

### TC-02: Create Cluster — Validation
| Input | Expected |
|---|---|
| Bỏ trống Cluster Name | Form không submit, browser validation |
| Bỏ trống clouds.yaml | Alert "clouds.yaml content is required" |
| Replica = xóa hết số | Value giữ nguyên 1 (không NaN) |
| Replica tăng/giảm | Không có lỗi NaN trên console |

### TC-03: Delete Cluster
1. Vào `/clusters`
2. Click icon xóa của bất kỳ cluster
3. Click OK trong confirm dialog
4. **Expected:** Toast xanh "Cluster X deleted successfully"
5. **Expected:** Cluster biến mất khỏi table (SSE cập nhật)

### TC-04: Cluster Detail — Machines Tab
1. Vào `/clusters`
2. Click vào một cluster
3. Click tab "Machines"
4. **Expected:** Badge số đúng = số lượng machines thật (không cộng thêm MachineDeployments)
5. **Expected:** Chỉ có 1 table Machines, không có sub-tab MachineDeployments

### TC-05: Cluster Detail — Provisioned Log
1. Vào cluster detail có tất cả machines Running
2. Mở DevTools Console
3. **Expected:** Log `✅ Cluster "X" — All N machine(s) Provisioned`

### TC-06: Dashboard — SSE Live Events
1. Mở `/` Dashboard
2. Từ terminal: tạo hoặc xóa một cluster
3. **Expected:** Panel "Recent Events" xuất hiện event mới trong vài giây
4. **Expected:** Badge Live màu xanh, không phải "Connecting..."

### TC-07: Dashboard — Node Topology Chart
1. Vào `/`
2. **Expected:** Bar chart hiển thị đúng Master/Worker count theo từng cluster
3. VD: lab-thalt-01 (1 master, 1 worker) → 2 bars đúng height

### TC-08: System Logs — Auto-load
1. Vào `/logs`
2. **Expected:** Pod đầu tiên trong capi-system được tự động chọn, logs hiển thị ngay
3. **Expected:** Không có overlay mờ che toàn màn hình

### TC-09: System Logs — Keyword Filter
1. Vào `/logs`, chọn pod
2. Nhập keyword vào ô "Filter logs..."
3. **Expected:** Chỉ hiển thị dòng log chứa keyword
4. Xóa keyword → **Expected:** Hiện lại toàn bộ log

### TC-10: Search Clusters
1. Vào `/clusters`
2. Gõ tên cluster vào ô search
3. **Expected:** Table filter realtime, hiện counter "X / Y clusters"
4. Gõ sai tên → **Expected:** "No clusters matching..."
5. Click ✕ → **Expected:** Reset về full list
