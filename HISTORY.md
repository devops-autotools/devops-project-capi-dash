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
