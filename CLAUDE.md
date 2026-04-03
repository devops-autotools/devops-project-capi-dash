# CAPI Dashboard - AI Agent Rules & Context
# Cập nhật: 2026-04-03 | Session 7

> 📋 **SKILL chi tiết:** Đọc `.claude/SKILL.md` trước khi làm bất kỳ thay đổi nào về pages, routing, hoặc services.
> 🧪 **SKILL Testing:** Đọc `.claude/SKILL-TESTING.md` khi thêm feature mới hoặc fix bug — phải có test case tương ứng.

## 0. Quy tắc đầu tiên — Page Independence
- **MỖI page phải là component độc lập** — KHÔNG import component từ page khác
- `/clusters/page.tsx` KHÔNG ĐƯỢC `import from "@/app/page"` (đây là lỗi đã xảy ra)
- Dashboard (`/`) = monitoring/charts only | Workload Clusters (`/clusters`) = table + CRUD

## 1. Vai trò & Ngữ cảnh
- Senior Platform Engineer chuyên Kubernetes Operator, Cloud-Native UI và OpenStack.
- Dự án: "CAPI Dashboard" — Giao diện quản trị tập trung cho Cluster API (CAPI) trên Management Cluster.
- Đối tượng: DevOps/SRE Admin quản lý workload clusters trên OpenStack.
- Infrastructure provider: **OpenStack** (CAPO). Management Cluster: `lab-thalt-01`.

## 2. Tech Stack
### Backend (Go):
- Framework: Gin | K8s Client: `client-go` dynamic + `controller-runtime` REST mapper
- Logging: `log/slog` JSON — KHÔNG `log.Printf`
- Entry point: `cmd/dashboard/main.go`, port `8080`
- Go version: 1.23+

### Frontend (Next.js):
- Next.js 16+ App Router, TypeScript strict, Tailwind CSS v4, Lucide React
- WebSocket terminal: `xterm` + `xterm-addon-fit` + `creack/pty` (backend)
- Dev proxy: `/api/v1/*` → `http://localhost:8080`

### Production (Docker/K8s):
- **nginx** — single port 80, proxy HTTP + WebSocket upgrade tới backend :8080 và frontend :3000
- `go mod vendor` — build không cần internet (`-mod=vendor`)
- K8s: NodePort 30000 → 80
- Docker image: `node:20-alpine` + nginx + tini + kubectl + kubectl-node_shell

## 3. Cấu trúc thư mục
```
capi-dashboard/
├── cmd/dashboard/main.go
├── internal/
│   ├── controller/cluster.go      # CRUD + SSE + Machine handlers
│   ├── controller/system.go       # NodeShellWS (PTY WebSocket) + GetSystemTools
│   ├── service/cluster_service.go # Business logic + GetWorkloadKubeconfig
│   ├── repository/k8s.go          # K8s dynamic client + GetWorkloadKubeconfig
│   ├── engine/render/render.go    # Go text/template engine
│   └── models/cluster.go          # ClusterConfig struct
├── nginx.conf                     # Reverse proxy config (HTTP + WS)
├── Dockerfile                     # Multi-stage: node builder + go builder + final
├── deployments/
│   ├── deployment.yaml            # K8s Deployment + Service (port 80)
│   └── rbac.yaml                  # ServiceAccount + ClusterRole + Binding
└── web/src/
    ├── app/                       # Next.js pages
    └── components/ui/NodeTerminal.tsx  # xterm.js WebSocket terminal
```

## 4. Quy tắc lập trình
### Backend (Go):
- Error handling tường minh — KHÔNG nuốt lỗi
- CAPI API Groups: Clusters `cluster.x-k8s.io/v1beta1` | CP `controlplane.cluster.x-k8s.io/v1beta1`
- Node Shell: dùng `creack/pty` (PTY thật) + **clean env** (bỏ KUBERNETES_SERVICE_HOST/PORT)
- CAPI Secret convention: `<cluster>-kubeconfig` trong namespace workload

### Frontend:
- `"use client"` directive — không dùng Server Components cho data fetch
- WebSocket URL: `window.location.host` — KHÔNG hardcode port
- Resize terminal: gửi `{"type":"resize","cols":N,"rows":N}` qua WebSocket

## 5. API Endpoints
```
GET  /api/v1/health
GET  /api/v1/clusters
GET  /api/v1/clusters/events                                    # SSE
GET  /api/v1/clusters/:namespace/:name
POST /api/v1/clusters
DELETE /api/v1/clusters/:namespace/:name

GET  /api/v1/clusters/:namespace/:name/machines
GET  /api/v1/clusters/:namespace/:name/machinedeployments
GET  /api/v1/clusters/:namespace/:name/machinesets
GET  /api/v1/clusters/:namespace/:name/controlplane
GET  /api/v1/clusters/:namespace/:name/machines/:node/shell     # WebSocket PTY

GET  /api/v1/logs/pods
GET  /api/v1/logs/:namespace/:name
GET  /api/v1/system/tools                                       # Check kubectl-node_shell
```

## 6. Docker Build Rules
```bash
# LUÔN vendor trước khi build Docker
go mod vendor

# LUÔN unset NODE_ENV trước npm install (NODE_ENV=production bỏ devDeps!)
unset NODE_ENV && npm install --legacy-peer-deps

# Verify packages đủ (~400+)
npm list --depth=0 | wc -l

# Build
docker build -t <image>:<tag> .
```

## 7. Bảo mật
- KHÔNG commit clouds.yaml, kubeconfig, .env
- Node Shell: kubeconfig workload chỉ tồn tại trong `/tmp/wl-kubeconfig-*.yaml`, xóa sau session

## 8. Môi trường Development
```bash
# Backend
export PATH=$PATH:/usr/local/go/bin && export KUBECONFIG=~/.kube/config
go run cmd/dashboard/main.go

# Frontend
export NVM_DIR="$HOME/.nvm" && source $NVM_DIR/nvm.sh && unset NODE_ENV
cd web && npm run dev
```

## 9. Checklist trước khi báo Done
```bash
go build -mod=vendor ./... && echo "BUILD OK"
go test -mod=vendor ./internal/... && echo "TESTS OK"
# Verify frontend build clean
cd web && npm run build 2>&1 | tail -5
```

## 10. Next Steps
1. **RBAC & Authentication** — OIDC (Keycloak/Dex)
2. **Helm Chart Production** — Deploy chính thức lên Management Cluster
