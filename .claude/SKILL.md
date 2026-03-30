# CAPI Dashboard — Project Skill

## Mục đích
Đây là skill tự động cho project CAPI Dashboard. Claude phải đọc file này TRƯỚC KHI làm bất kỳ thay đổi nào.

## Page Routing — PHẢI PHÂN BIỆT RÕ

| Route | File | Mục đích |
|---|---|---|
| `/` | `src/app/page.tsx` | **Monitoring Dashboard** — charts, health bar, live event feed. KHÔNG có table cluster, KHÔNG có CRUD |
| `/clusters` | `src/app/clusters/page.tsx` | **Workload Clusters** — table list đầy đủ, stats bar, Delete + View Detail actions, SSE real-time |
| `/clusters/create` | `src/app/clusters/create/page.tsx` | Form tạo cluster mới |
| `/clusters/[ns]/[name]` | `src/app/clusters/[namespace]/[name]/page.tsx` | Chi tiết cluster: tabs Overview / Machines / Conditions / YAML |
| `/logs` | `src/app/logs/page.tsx` | Terminal log viewer cho CAPI controller pods |
| `/settings` | `src/app/settings/page.tsx` | **System Info** — backend health, CAPI component status, cluster count, about |

> ❌ **Đã xóa:** `/infrastructure` và `/security` — không cần thiết, phụ thuộc OpenStack API riêng biệt
> ❌ **Đã xóa:** `controller/openstack.go`, `repository/openstack.go`, dependency `gophercloud`

### ⚠️ Quy tắc QUAN TRỌNG về pages:
- `/clusters/page.tsx` KHÔNG ĐƯỢC import từ `@/app/page` (đây là root cause bug cũ)
- Dashboard (`/`) = monitoring only, NO table, NO delete button
- Workload Clusters (`/clusters`) = table + CRUD + stats, NO charts
- Mỗi page phải có component riêng, độc lập hoàn toàn

## Cách Start Services

```bash
# Backend (Terminal 1)
cd /home/thalt/vnpay/vnpay-project/sandbox/tools/capi-dashboard
export PATH=$PATH:/usr/local/go/bin
export KUBECONFIG=/home/thalt/.kube/config
go run cmd/dashboard/main.go

# Frontend (Terminal 2)
cd web
export NVM_DIR="$HOME/.nvm" && source $NVM_DIR/nvm.sh
npm run dev
```

- Go binary: `/usr/local/go/bin/go`
- Node.js: nvm tại `~/.nvm/versions/node/v24.13.0/`
- Backend port: **8080** | Frontend port: **3000**
- Frontend proxy `/api/v1/*` → `localhost:8080` qua `next.config.mjs`

## npm — Lưu ý quan trọng

```bash
# LUÔN dùng --legacy-peer-deps (Next.js 16 + React 19 có peer dep conflict)
npm install <package> --legacy-peer-deps

# Nếu node_modules bị hỏng sau install:
rm -rf node_modules && npm install --legacy-peer-deps

# Cài devDependencies riêng nếu mất:
npm install --save-dev tailwindcss @tailwindcss/postcss --legacy-peer-deps
```

## Trước khi Deploy

```bash
# Chạy test trước — BẮTT BUỘC
make test          # verbose
make build-safe    # test + build, block nếu fail

# Test coverage
make test-coverage
```

## API Endpoints

```
GET  /api/v1/clusters                              List clusters
GET  /api/v1/clusters/events                       SSE stream
GET  /api/v1/clusters/:ns/:name                    Cluster detail
POST /api/v1/clusters                              Create cluster
DEL  /api/v1/clusters/:ns/:name                    Delete cluster
GET  /api/v1/clusters/:ns/:name/machines           Machines của cluster
GET  /api/v1/clusters/:ns/:name/machinedeployments MachineDeployments
GET  /api/v1/logs/pods                             Controller pods
GET  /api/v1/logs/:ns/:name                        Pod logs
GET  /api/v1/os/flavors|images|networks|security-groups
```

## Khi thêm tính năng mới — Checklist

- [ ] Backend: repo → service → controller → đăng ký route trong `main.go`
- [ ] Frontend: tạo page mới độc lập (KHÔNG import từ page khác)
- [ ] Thêm vào sidebar nếu cần (`web/src/components/layout/sidebar.tsx`)
- [ ] Viết unit test (`make test` phải pass)
- [ ] Cập nhật `HISTORY.md`
- [ ] Cập nhật `CLAUDE.md` nếu có thay đổi kiến trúc
