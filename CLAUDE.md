# CAPI Dashboard - AI Agent Rules & Context
# Cập nhật: 2026-03-29 | Session 5

> 📋 **SKILL chi tiết:** Đọc `.claude/SKILL.md` trước khi làm bất kỳ thay đổi nào về pages, routing, hoặc services.

## 0. Quy tắc đầu tiên — Page Independence
- **MỖI page phải là component độc lập** — KHÔNG import component từ page khác
- `/clusters/page.tsx` KHÔNG ĐƯỢC `import from "@/app/page"` (đây là lỗi đã xảy ra)
- Dashboard (`/`) = monitoring/charts only | Workload Clusters (`/clusters`) = table + CRUD

## 1. Vai trò & Ngữ cảnh (Role & Context)
- Bạn là Senior Platform Engineer chuyên Kubernetes Operator, Cloud-Native UI và OpenStack.
- Dự án: "CAPI Dashboard" — Giao diện quản trị tập trung cho Cluster API (CAPI) trên Management Cluster.
- Đối tượng sử dụng: DevOps/SRE Admin quản lý workload clusters trên OpenStack.
- Infrastructure provider: **OpenStack** (CAPO — Cluster API Provider OpenStack).
- Management Cluster thực tế: `lab-thalt-01` (kubeconfig tại `~/.kube/config`).

## 2. Tech Stack (Bắt buộc tuân thủ)
### Backend (Go):
- **Framework:** Gin Web Framework (`github.com/gin-gonic/gin`)
- **K8s Client:** `client-go` dynamic client + `controller-runtime` REST mapper
- **OpenStack:** Gophercloud (`github.com/gophercloud/gophercloud`)
- **Logging:** Structured Logging với `log/slog` (JSON format) — KHÔNG dùng `log.Printf`
- **Entry point:** `cmd/dashboard/main.go`, port mặc định `8080`
- **Go version:** 1.23+

### Frontend (Next.js):
- **Framework:** Next.js 16+ với App Router, TypeScript strict
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React — KHÔNG dùng icon library khác
- **UI Components:** Thuần Tailwind — chưa tích hợp Shadcn/UI
- **Proxy:** `/api/v1/*` → `http://localhost:8080/api/v1/*` (cấu hình trong `next.config.mjs`)
- **Port dev:** `3000`

### Infrastructure:
- **Template Engine:** Go `text/template` với custom `FuncMap` (có hàm `default`)
- **YAML Templates:** 8 file `.tmpl` tại `internal/assets/templates/openstack/`
- **Deploy:** Docker multi-stage build, K8s manifests tại `deployments/`

## 3. Kiến trúc & Cấu trúc thư mục
```
capi-dashboard/
├── cmd/dashboard/main.go          # Entry point, wire dependencies
├── internal/
│   ├── controller/                # HTTP handlers (Gin) — KHÔNG chứa business logic
│   │   ├── cluster.go             # CRUD + SSE stream cho clusters
│   │   └── openstack.go           # Metadata endpoints (flavors/images/networks/sg)
│   ├── service/
│   │   └── cluster_service.go     # Business logic, orchestration
│   ├── repository/
│   │   ├── k8s.go                 # Dynamic client — apply/list/watch/delete CAPI CRDs
│   │   └── openstack.go           # Gophercloud — list flavors/images/networks/secgroups
│   ├── engine/render/
│   │   └── render.go              # TemplateEngine với custom FuncMap (hàm default)
│   ├── models/
│   │   └── cluster.go             # ClusterConfig struct — map 1:1 với form frontend
│   └── assets/templates/openstack/
│       ├── 1-secret-authen-openstack.yaml.tmpl
│       ├── 2-cluster.yaml.tmpl
│       ├── 3-infrastructure.yaml.tmpl
│       ├── 4-controlplane.yaml.tmpl
│       ├── 5-bootstrap.yaml.tmpl
│       ├── 6-KubeadmControlPlane-md.yaml.tmpl
│       ├── 7-workernode-md.yaml.tmpl
│       └── 8.MachineDeployment.yaml.tmpl
└── web/src/
    ├── app/                       # Next.js App Router pages
    └── components/layout/         # Sidebar + Header
```

## 4. Quy tắc lập trình (Coding Standards)
### Backend (Go):
- Luôn dùng `internal/` — không expose package ra ngoài.
- Error handling tường minh: KHÔNG nuốt lỗi, KHÔNG dùng `_` cho error.
- Logging: `slog.Info(...)`, `slog.Error(...)`, `slog.Warn(...)` — KHÔNG `fmt.Println`.
- CAPI API Groups cần nhớ:
  - Clusters: `cluster.x-k8s.io/v1beta1`
  - ControlPlane: `controlplane.cluster.x-k8s.io/v1beta1`
  - Infrastructure: `infrastructure.cluster.x-k8s.io/v1beta1`
  - Bootstrap: `bootstrap.cluster.x-k8s.io/v1beta1`

### Template Engine (Go text/template):
- **QUAN TRỌNG:** Go `text/template` KHÔNG có hàm `default` built-in (khác Helm/Sprig).
- Custom `FuncMap` đã được đăng ký trong `render.go` — dùng `{{ .Field | default "value" }}` bình thường.
- Khi thêm field mới vào template `.tmpl`, BẮT BUỘC thêm field tương ứng vào `models.ClusterConfig`.
- Khi thêm template function mới, thêm vào `funcMap` trong `render.go`.

### Frontend (Next.js/TypeScript):
- Tất cả pages dùng `"use client"` directive (không dùng Server Components cho data fetching).
- Fetch API trực tiếp — không dùng SWR hay React Query.
- Status Badge màu sắc bắt buộc:
  - `Provisioned` → `bg-emerald-100 text-emerald-800`
  - `Provisioning` / `Scaling` → `bg-blue-100 text-blue-800`
  - `Deleting` → `bg-amber-100 text-amber-800`
  - `Failed` / Error → `bg-rose-100 text-rose-800`
- SSE (Server-Sent Events) cho real-time: dùng `EventSource` tại `/api/v1/clusters/events`.
- Base64 encoding cho secrets: dùng `btoa(unescape(encodeURIComponent(rawString)))` — hỗ trợ UTF-8.

## 5. API Endpoints (Backend)
```
GET    /api/v1/health                        # Health check
GET    /api/v1/clusters?namespace=<ns>       # List CAPI Clusters
GET    /api/v1/clusters/events?namespace=<ns># SSE stream (watch)
GET    /api/v1/clusters/:namespace/:name     # Get cluster detail + conditions + raw YAML
POST   /api/v1/clusters                      # Create workload cluster (render + apply 8 templates)
DELETE /api/v1/clusters/:namespace/:name     # Delete cluster

GET    /api/v1/logs/pods                     # List CAPI controller pods
GET    /api/v1/logs/:namespace/:name         # Stream pod logs

GET    /api/v1/os/flavors                    # OpenStack flavors (chỉ có khi OS_* env được set)
GET    /api/v1/os/images                     # OpenStack images
GET    /api/v1/os/networks                   # OpenStack networks
GET    /api/v1/os/security-groups            # OpenStack security groups
```

## 6. ClusterConfig Model (Frontend ↔ Backend)
Khi thêm field mới vào form, cần cập nhật đồng thời:
1. `internal/models/cluster.go` — thêm field với json tag
2. Template `.tmpl` tương ứng trong `internal/assets/templates/openstack/`
3. `web/src/app/clusters/create/page.tsx` — thêm input + state

Fields đặc biệt:
- `CloudsYamlBase64` / `CaCertBase64`: Frontend encode base64 từ raw text, KHÔNG gửi plaintext.
- `ClusterName` và `Namespace` thường đồng giá trị — form tự sync.

## 7. Bảo mật (Security Rules)
- **KHÔNG BAO GIỜ** commit file chứa credentials thật vào Git:
  - `clouds.yaml` (kể cả đã encode base64)
  - Kubeconfig files
  - `.env` files
  - YAML manifest đã render với thông tin thật
- Thư mục `docs/templates/` đã bị xóa vì chứa credentials thật — KHÔNG tạo lại.
- Nếu cần ví dụ template: dùng placeholder rõ ràng như `<your-network-id>`, `<base64-encoded-clouds-yaml>`.
- Luôn kiểm tra `.gitignore` trước khi `git add`.

## 8. Môi trường Development
```bash
# Backend (Terminal 1)
export PATH=$PATH:/usr/local/go/bin
export KUBECONFIG=~/.kube/config
# export OS_AUTH_URL / OS_USERNAME / OS_PASSWORD / OS_PROJECT_NAME (tuỳ chọn)
go run cmd/dashboard/main.go

# Frontend (Terminal 2)
export NVM_DIR="$HOME/.nvm" && source $NVM_DIR/nvm.sh
cd web && npm run dev
```
- Node.js quản lý bằng **nvm** tại `~/.nvm/versions/node/v24.13.0/`
- Go binary tại `/usr/local/go/bin/go`
- Backend chạy trước, Frontend dùng proxy để forward `/api/v1/*`

## 9. Quản lý Context & Tiến độ
- Đọc `HISTORY.md` để biết trạng thái hiện tại và những gì đã làm.
- Đọc `docs/` trước khi thay đổi kiến trúc lớn.
- Sau khi hoàn thành feature/fix quan trọng: cập nhật `HISTORY.md`.
- Nếu thay đổi kiến trúc hoặc thêm API mới: cập nhật `docs/03-api-spec.md`.
- Nếu thay đổi template engine: cập nhật `docs/05-template-engine.md`.

## 10. Next Steps (Bước tiếp theo ưu tiên)
1. **RBAC & Authentication** — Tích hợp OIDC (Keycloak/Dex) cho multi-user.
2. **Machine Health Check View** — Hiển thị chi tiết Node/Machine/MachineSet.
3. **Helm Chart Production** — Hoàn thiện chart để deploy lên Management Cluster chính thức.
