# CAPI Dashboard - Project History & Progress

## 🟢 Session 1: Documentation & Architecture (2026-03-25)

- **Khởi tạo Backend (Yêu cầu B):** 
    - Khởi tạo Go module `github.com/vnpay/capi-dashboard`.
    - Setup cấu trúc thư mục Clean Architecture (`internal/controller`, `service`, `repository`, `engine`, `models`).
    - Cài đặt Gin Web Framework và tạo file `main.go` with endpoint `/health`.

- **Khởi tạo Frontend (Yêu cầu C):** 
    - Khởi tạo project Next.js v15+ (App Router, TypeScript, Tailwind CSS) trong thư mục `web/`.
    - Cài đặt các thư viện UI cơ bản: `lucide-react`, `clsx`, `tailwind-merge` (chuẩn bị for Shadcn/UI).
    - Setup cấu trúc `@/*` alias cho việc import thuận tiện.

### 📍 Trạng thái hiện tại (Current Status):
- **Documentation:** Hoàn thành.
- **Templates:** Hoàn thành.
- **Backend:** Đã khởi tạo cấu trúc và HTTP server cơ bản.
- **Frontend:** Đã khởi tạo cấu trúc và UI framework cơ bản.

### 🟢 Giai đoạn Thực thi (Execution Phase) - (2026-03-25)

- **Triển khai Core Engine (Backend):**
    - Định nghĩa `ClusterConfig` models và hoàn thành `TemplateEngine`.
- **K8s Integration (Yêu cầu A):**
    - Triển khai `K8sRepository` sử dụng Dynamic Client để apply YAML động.
    - Xây dựng `ClusterService` điều phối Render và Apply.
- **UI Layout (Yêu cầu B):**
    - Xây dựng Sidebar, Header chuyên nghiệp với Next.js & Tailwind.
    - Thiết kế trang Dashboard Overview với các chỉ số thống kê và bảng danh sách cụm cluster.
- **OpenStack Metadata API (Yêu cầu C):**
    - Tích hợp Gophercloud để kết nối trực tiếp với OpenStack API.
    - Cung cấp các endpoint `/api/v1/os/flavors`, `/images`, `/networks` để lấy dữ liệu cho Form.

### 📍 Trạng thái hiện tại (Current Status):
- **Backend:** Hoàn thành các tính năng cốt lõi (Render, Apply, OpenStack Metadata).
- **Frontend:** Hoàn thành bộ khung Layout và Dashboard chính.

- **Kết nối Dữ liệu thực tế & Form Tạo Cluster (2026-03-25):**
    - **Backend:** Triển khai logic List Clusters từ Kubernetes API (CRD `clusters.cluster.x-k8s.io`).
    - **Frontend Dashboard:** Kết nối API để hiển thị danh sách cụm thực tế và các chỉ số thống kê (Healthy, Provisioning, Error).
    - **Frontend Create Form:** Xây dựng trang tạo Cluster mới với đầy đủ các field: 
        - Thông tin chung (Name, Namespace).
        - Hạ tầng OpenStack (Network, External Network, SSH Key, Image).
        - Topology (Flavor & Replicas cho cả Control Plane và Worker).
        - Tích hợp Metadata API để tự động load danh sách Flavor/Image từ OpenStack.

### 📍 Trạng thái hiện tại (Current Status):
- **Core Engine:** Hoàn thành (Render & Apply).
- **Dashboard:** Hoàn thành (Hiển thị real data, hỗ trợ Xóa cluster).
- **Provisioning:** Hoàn thành (Có Form tạo Cluster kết nối trực tiếp với Backend).
- **Cluster Detail:** Hoàn thành (Trang chi tiết với Overview, Conditions và Raw YAML).

- **Real-time Updates & Infrastructure View (2026-03-25):**
    - **Backend:**
        - Triển khai **Server-Sent Events (SSE)** tại `/api/v1/clusters/events`.
        - Sử dụng **K8s Watcher** để stream trạng thái cụm ngay lập tức khi có thay đổi.
        - Chuyển đổi toàn bộ log sang **Structured Logging (slog)** theo chuẩn `.cursorrules`.
    - **Infrastructure & Security View:** 
        - Xây dựng trang quản lý tài nguyên OpenStack (Flavors, Images, Networks).
        - Triển khai Security Groups view kết nối trực tiếp OpenStack API.
    - **Logs Viewer:**
        - Backend: Thêm API liệt kê pods và stream logs từ controller pods.
        - Frontend: Xây dựng Terminal UI để theo dõi log trực tiếp với tính năng Auto-refresh và Search.
    - **Deployment & Production Ready:**
        - Tạo Dockerfile đa tầng (multi-stage) để đóng gói FE + BE.
        - Xây dựng manifest RBAC (`rbac.yaml`) và Deployment (`deployment.yaml`) để deploy lên Management Cluster.
        - Hoàn thiện trang Settings cơ bản.

### 📍 Trạng thái hiện tại (Current Status):
- **Tính năng:** Đã hoàn thành 100% các yêu cầu chức năng.
- **Hệ thống:** Dashboard đã sẵn sàng để triển khai và sử dụng thực tế.

## 🟢 Session 2: Web Testing & Refinement (2026-03-27)

- **Kiểm thử hệ thống (Web Testing):**
    - Đã xác minh Backend (Go/Gin) hoạt động ổn định trên cổng 8080.
    - Đã xác minh Frontend (Next.js) hoạt động ổn định trên cổng 3000.
    - Kết nối Real-time (SSE) và dữ liệu thực tế từ K8s Cluster (`lab-thalt-01`) đã sẵn sàng.
- **Cải thiện công cụ quản lý:**
    - Cập nhật `Makefile` với đầy đủ các lệnh tiêu chuẩn (`install`, `dev`, `build`, `docker-build`).
    - Đồng bộ hóa quy trình khởi chạy để hỗ trợ môi trường phát triển nhanh.

### 📍 Trạng thái hiện tại (Current Status):
- **Cơ sở hạ tầng:** Đã sẵn sàng 100% để truy cập và kiểm tra UI/UX.
- **Dữ liệu:** Hiển thị chính xác trạng thái cluster thực tế từ Management Cluster.

### ⏭️ Bước tiếp theo (Next Steps):
1.  **RBAC & Authentication (Advanced):** Tích hợp OIDC (Keycloak/Dex).
2.  **Machine Health Check View:** Hiển thị chi tiết Node/Machine.
3.  **Helm Chart Production:** Hoàn thiện chart để triển khai chính thức.

## 🟢 Session 3: Bug Fixes & UX Improvements (2026-03-28)

- **Fix Template Engine:**
    - Thêm custom `FuncMap` vào `render.go` với function `default` (Go's `text/template` không có built-in).
    - Thêm field `ServiceDomain` vào `models.ClusterConfig` (template dùng nhưng struct thiếu).
    - Scan toàn bộ 8 template để đảm bảo tất cả fields đều có trong struct.

- **Cải thiện Form Create Cluster:**
    - Đổi toàn bộ `<select>` sang `<input>` text cho phần OpenStack Infrastructure và Cluster Topology.
    - Thêm section **Cloud Credentials** với `textarea` cho `clouds.yaml` (raw) và CA Certificate (tuỳ chọn).
    - Frontend tự động `btoa()` encode Base64 trước khi submit — đảm bảo Secret tạo ra có đủ dữ liệu.
    - Namespace tự động sync theo Cluster Name.

- **Code Cleanup & Git Ready:**
    - Xóa: binary `dashboard`, `backend.log`, `frontend.log`, `next.config.ts` (duplicate), `web/.git` (submodule dư).
    - Xóa: default Next.js boilerplate assets (`public/*.svg`), auto-generated files (`tsconfig.tsbuildinfo`, `next-env.d.ts`).
    - Xóa: AI-specific files (`web/AGENTS.md`, `web/CLAUDE.md`, `docs/ai-prompts/`), empty dirs.
    - Tạo `.gitignore` root chuẩn cho monorepo Go + Next.js.
    - Tạo `.env.example` document hoá các biến môi trường cần thiết.

### 📍 Trạng thái hiện tại (Current Status):
- **Tính năng:** Tạo cluster hoạt động end-to-end với đầy đủ Secret cloud credentials.
- **Codebase:** Sạch, sẵn sàng push lên Git.

### ⏭️ Bước tiếp theo (Next Steps):
1. **RBAC & Authentication** — Tích hợp OIDC (Keycloak/Dex).
2. **Machine Health Check View** — Hiển thị chi tiết Node/Machine.
3. **Helm Chart Production** — Hoàn thiện chart để deploy chính thức.

## 🟢 Session 4: Machine Health Check View (2026-03-28)

- **Backend — 2 endpoints mới:**
    - `GET /api/v1/machines?namespace=<ns>` — List toàn bộ CAPI Machine objects, format đầy đủ: phase, nodeName, version, bootstrapReady, infrastructureReady, failureReason.
    - `GET /api/v1/machinedeployments?namespace=<ns>` — List MachineDeployments kèm replicas/readyReplicas/availableReplicas.
    - Thêm `ListMachines` + `ListMachineDeployments` vào `K8sRepository`, `ClusterService`, `ClusterController`.

- **Frontend — Trang `/machines` mới:**
    - Stat cards: Total / Running / Provisioning / Failed machines.
    - Tab **Machines**: bảng chi tiết từng machine — phase badge, node name, version, bootstrap & infra ready icons, failure reason inline.
    - Tab **Machine Deployments**: bảng replica count với color indicator (xanh = đủ replica, vàng = thiếu).
    - Sidebar thêm mục **Machine Health** (icon Cpu) giữa Workload Clusters và Infrastructure.

- **Deploy:**
    - Review và clean `deployments/deployment.yaml`: bỏ env thừa (PORT, OS_*), thêm readinessProbe + livenessProbe.
    - Tối ưu `Dockerfile`: Next.js standalone output, Go static binary với `-ldflags="-s -w"`, dùng `tini` làm PID 1.

### 📍 Trạng thái hiện tại (Current Status):
- **Machine Health Check:** Hoàn thành — hiển thị Machines + MachineDeployments real-time từ Management Cluster.
- **Deploy:** Dockerfile + deployment.yaml sẵn sàng production.

### ⏭️ Bước tiếp theo (Next Steps):
1. **RBAC & Authentication** — Tích hợp OIDC (Keycloak/Dex).
2. **Helm Chart Production** — Hoàn thiện chart để deploy chính thức.

## 🟢 Session 5: Unit Tests & Monitoring Dashboard (2026-03-29)

- **Unit Tests — 22 tests, tất cả PASS:**
    - `internal/engine/render` — 9 tests, coverage **94.7%**:
      TestRenderAllTemplates_Basic, Ordered, DefaultFunction, DefaultFunctionPreservesValue,
      EmptyDir, InvalidTemplateSyntax, UnknownField, IgnoresNonTmplFiles, AllFields
    - `internal/service` — 7 tests, coverage **100%** trên format functions:
      TestFormatCluster_BasicFields, MissingStatusFields,
      TestFormatMachine_BasicFields, FailureFields,
      TestFormatMachineDeployment_BasicFields, UnhealthyReplicas
    - `internal/controller` — 6 tests:
      TestHealthEndpoint, CreateCluster_MissingRequiredFields, InvalidJSON,
      DeleteCluster_MissingParams, GetCluster_RouteMatch, MachineRoutes_PathParams
    - Repository layer: 0% — cần K8s cluster thật hoặc fake client để test (future work)

- **Makefile — workflow deploy an toàn:**
    - `make test` — chạy toàn bộ tests verbose
    - `make test-short` — chạy tests không verbose
    - `make test-coverage` — báo cáo coverage từng function
    - `make build-safe` — chạy tests TRƯỚC khi build, block deploy nếu tests fail

- **Dashboard Monitoring redesign:**
    - Cài thêm `recharts` cho charts
    - Donut chart phân bố phase, Bar chart CP/Infra readiness,
      Area chart live event activity, Live event feed panel

### 📍 Trạng thái hiện tại (Current Status):
- **Tests:** 22/22 PASS, coverage engine ~95%, service format 100%
- **Services:** Backend :8080 ✅ | Frontend :3000 ✅

### ⏭️ Bước tiếp theo (Next Steps):
1. **RBAC & Authentication** — Tích hợp OIDC (Keycloak/Dex).
2. **Helm Chart Production** — Hoàn thiện chart để deploy chính thức.
3. **Tăng test coverage** — Mock K8s fake client cho repository layer.

## 🟢 Session 6: Machine Health Check View (2026-04-01)

- **Backend — 2 endpoints mới:**
    - `GET /api/v1/clusters/:namespace/:name/machinesets` — List MachineSets theo cluster (desired/ready/available replicas + conditions)
    - `GET /api/v1/clusters/:namespace/:name/controlplane` — Get KubeadmControlPlane chi tiết (version, replicas, initialized, ready, conditions)
    - Thêm `ListMachineSets`, `GetKubeadmControlPlane` vào `K8sRepository`
    - Thêm `FormatMachineSet`, `FormatKubeadmControlPlane`, `ListMachineSets`, `GetKubeadmControlPlane` vào `ClusterService`
    - Thêm `ListMachineSets`, `GetKubeadmControlPlane` handlers vào `ClusterController`

- **Frontend — Tab "Machine Health" trong Cluster Detail:**
    - Đổi tên tab từ "Machines" → "Machine Health"
    - 3 sub-tabs:
      - **Machines** — bảng chi tiết machines với health summary cards (Total/Running/Provisioning/Failed), failure message inline
      - **MachineSets** — bảng replica counts (Desired/Ready/Available/FullyLabeled) + conditions preview
      - **Control Plane** — KCP status cards (version, replicas, ready, unavailable), initialized/ready badges, conditions table đầy đủ
    - Overview tab thêm Node Summary card (Total/Running/Failed)

- **Build + Tests:** BUILD OK | 22/22 tests PASS

### 📍 Trạng thái hiện tại (Current Status):
- **Machine Health Check:** Hoàn thành — Machines + MachineSets + KubeadmControlPlane health view
- **API mới:** `/machinesets`, `/controlplane` scoped theo cluster

### ⏭️ Bước tiếp theo (Next Steps):
1. **RBAC & Authentication** — Tích hợp OIDC (Keycloak/Dex).
2. **Helm Chart Production** — Hoàn thiện chart để deploy chính thức.
## 🟢 Session 7: Node Shell Terminal + Docker Production (2026-04-03)

### Tính năng: Node Shell Terminal (SSH vào workload node)

**Backend — WebSocket Shell:**
- Endpoint: `GET /api/v1/clusters/:namespace/:name/machines/:node/shell`
- Endpoint: `GET /api/v1/system/tools` — check kubectl-node_shell binary
- Flow chuẩn CAPI:
  1. Đọc Secret `<cluster>-kubeconfig` trong namespace workload (CAPI convention)
  2. Write ra temp file `/tmp/wl-kubeconfig-*.yaml` (xóa sau session)
  3. Spawn `kubectl node-shell <node> --kubeconfig=<tmpfile>` với **PTY thật** (`creack/pty`)
  4. Proxy stdin/stdout qua WebSocket bidirectional
- **Clean env** — loại bỏ `KUBERNETES_SERVICE_HOST/PORT` để kubectl dùng workload kubeconfig thay vì in-cluster ServiceAccount
- **PTY** (`github.com/creack/pty`) — bắt buộc để shell prompt hiển thị đúng, hỗ trợ resize terminal

**Frontend — NodeTerminal component:**
- `web/src/components/ui/NodeTerminal.tsx` — xterm.js terminal emulator
- WebSocket URL dùng `window.location.host` (không hardcode port)
- Gửi resize event `{"type":"resize","cols":N,"rows":N}` khi terminal resize
- Dark theme, traffic lights, font monospace

### Docker Production Build

**Dockerfile (multi-stage):**
- Stage 1: Node.js frontend builder (`npm install --legacy-peer-deps`)
- Stage 2: Go backend builder (`-mod=vendor`, không cần internet)
- Stage 3: Final — `node:20-alpine` + nginx + tini + kubectl + kubectl-node_shell
- Cài kubectl + kubectl-node_shell binary trong Docker image
- `go mod vendor` — copy 76MB dependencies vào source, build không cần proxy.golang.org

**nginx reverse proxy (nginx.conf):**
- Single port 80 — thay cho 2 ports 3000+8080
- HTTP proxy → Next.js `:3000`
- `/api/v1/*` proxy → Go `:8080` với WebSocket upgrade headers
- `proxy_read_timeout 3600s` cho long-running shell sessions

**K8s Deployment (deployment.yaml):**
- Chỉ expose 1 port: `containerPort: 80`, NodePort `30000 → 80`
- Probe: `GET /api/v1/health` port 80

**Các lỗi Docker đã fix:**
| Lỗi | Fix |
|---|---|
| `npm ci --only=production=false` invalid | `npm install --legacy-peer-deps` |
| `go mod download` timeout (no internet) | `go mod vendor` + `-mod=vendor` |
| `PORT=3000` conflict Go vs Next.js | Set `PORT=8080` inline cho từng process |
| TypeScript errors `percent undefined` | `(percent ?? 0) * 100` |
| `NODE_ENV=production` mất devDeps | `unset NODE_ENV` trước npm install |

**Các lỗi Shell đã fix:**
| Lỗi | Fix |
|---|---|
| "Connection error" (WebSocket port 8080 hardcoded) | Dùng `window.location.host` |
| "kubectl not found" | Thêm kubectl vào Dockerfile |
| "plugin chưa cài" dù đã cài | `LookPath("kubectl-node_shell")` thay vì chạy kubectl |
| `Forbidden: cannot list nodes` | Clean env — bỏ `KUBERNETES_SERVICE_HOST` |
| Không thấy shell prompt | Dùng PTY thật (`creack/pty`) thay vì pipe |

### Build + Tests
- `go build -mod=vendor` ✅
- 22/22 tests PASS ✅
- `npm run build` TypeScript clean ✅

### 📍 Trạng thái hiện tại
- **Node Shell Terminal:** Hoạt động end-to-end — click SSH → terminal mở → shell prompt hiển thị
- **Docker image:** Production-ready, single port 80, nginx proxy WS+HTTP
- **K8s deployment:** NodePort 30000

### ⏭️ Bước tiếp theo
1. **RBAC & Authentication** — Tích hợp OIDC (Keycloak/Dex)
2. **Helm Chart Production** — Hoàn thiện chart deploy chính thức

## 🟢 Session 8: Add-ons Tab (HelmReleaseProxy) (2026-04-17)

### Tính năng: Add-ons Tab trong Cluster Detail

**Yêu cầu:** Mỗi workload cluster cần tab Add-ons hiển thị toàn bộ add-on (HelmChartProxy/HelmReleaseProxy) đã deploy, bao gồm thông tin lỗi inline nếu add-on fails.

**Backend — endpoint mới:**
- `GET /api/v1/clusters/:namespace/:name/addons`
- Repository: `ListHelmReleaseProxies()` — query CRD `addons.cluster.x-k8s.io/v1alpha1/HelmReleaseProxy`, filter bằng label `addons.cluster.x-k8s.io/cluster-name=<cluster>`
- Service: `FormatHelmReleaseProxy()` + `ListClusterAddons()` — extract chart name, version, release namespace, status, revision, error message, conditions
- Controller: `ListClusterAddons()` handler
- Route: đăng ký `GET /clusters/:namespace/:name/addons` trong `main.go`

**RBAC — thêm permission:**
- `addons.cluster.x-k8s.io` → `helmreleaseproxies`, `helmchartproxies` (get, list, watch)

**Frontend — tab "Add-ons" mới trong Cluster Detail:**
- Icon: `Package` (lucide-react)
- Badge trên tab: tổng số add-ons — đỏ nếu có failed, xám nếu tất cả healthy
- Table: Add-on Name, Chart, Version, Release Namespace, Revision, Status
- Status badge: xanh (deployed), xanh nhạt + spin (pending), đỏ (failed)
- Nếu failed: hiển thị error message inline dưới badge với icon AlertTriangle
- Empty state: thông báo không có add-on, kèm gợi ý CAAPH

**Data model (HelmReleaseProxy):**
- Namespace-scoped, cùng namespace với workload cluster
- Label `addons.cluster.x-k8s.io/cluster-name` dùng để filter theo cluster
- Label `addons.cluster.x-k8s.io/helm-chart-proxy-name` liên kết với HelmChartProxy cha
- `status.status`: deployed | failed | pending-install | pending-upgrade
- `status.conditions[Ready]`: True/False — source of truth cho UI badge

**Build + Tests:**
- `go build -mod=vendor` ✅
- 22/22 tests PASS ✅
- `npm run build` TypeScript clean ✅

### 📍 Trạng thái hiện tại
- **Add-ons Tab:** Hoàn thành — hiển thị toàn bộ HelmReleaseProxy theo cluster, lỗi inline
- **RBAC:** Cập nhật thêm permission CAAPH

### ⏭️ Bước tiếp theo
1. **RBAC & Authentication** — Tích hợp OIDC (Keycloak/Dex)
2. **Helm Chart Production** — Hoàn thiện chart deploy chính thức
