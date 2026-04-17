# CAPI Dashboard — Project Skill

## Mục đích
Đây là skill tự động cho project CAPI Dashboard. Claude phải đọc file này TRƯỚC KHI làm bất kỳ thay đổi nào.

## Page Routing — PHẢI PHÂN BIỆT RÕ

| Route | File | Mục đích |
|---|---|---|
| `/` | `src/app/page.tsx` | **Monitoring Dashboard** — charts, health bar, live event feed. KHÔNG có table cluster, KHÔNG có CRUD |
| `/clusters` | `src/app/clusters/page.tsx` | **Workload Clusters** — table list đầy đủ, stats bar, Delete + View Detail actions, SSE real-time |
| `/clusters/create` | `src/app/clusters/create/page.tsx` | Form tạo cluster mới |
| `/clusters/[ns]/[name]` | `src/app/clusters/[namespace]/[name]/page.tsx` | Chi tiết cluster: tabs Overview / Machines / Conditions / Events / Add-ons / YAML |
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
- Node.js: quản lý qua nvm (`export NVM_DIR="$HOME/.nvm" && source $NVM_DIR/nvm.sh`)
- Backend port: **8080** | Frontend port: **3000**
- Frontend proxy `/api/v1/*` → `localhost:8080` qua `next.config.mjs`

## npm — Lưu ý quan trọng ⚠️

```bash
# ROOT CAUSE BUG: NODE_ENV=production làm npm bỏ qua devDependencies
# LUÔN unset NODE_ENV trước khi install
unset NODE_ENV && npm install --legacy-peer-deps

# Sau mỗi lần cài package mới, PHẢI verify đủ packages:
ls node_modules/@tailwindcss/postcss && echo "✅ tailwind OK"
ls node_modules/typescript && echo "✅ typescript OK"

# Nếu node_modules bị hỏng (thường thấy 67 packages thay vì ~400+):
unset NODE_ENV && rm -rf node_modules package-lock.json && npm install --legacy-peer-deps

# Dấu hiệu bị hỏng: npm list hiện < 100 packages thay vì ~400
npm list --depth=0 | wc -l
```

**Root cause đã gặp nhiều lần:** `NODE_ENV=production` trong shell environment → npm skip devDependencies → mất `@tailwindcss/postcss`, `tailwindcss`, `typescript`, etc.

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
GET    /api/v1/health                                              Backend health check
GET    /api/v1/clusters                                            List clusters
GET    /api/v1/clusters/events                                     SSE stream (real-time)
GET    /api/v1/clusters/:ns/:name                                  Cluster detail
POST   /api/v1/clusters                                            Create cluster
DELETE /api/v1/clusters/:ns/:name                                  Delete cluster

GET    /api/v1/clusters/:ns/:name/machines                         Machines của cluster
GET    /api/v1/clusters/:ns/:name/machinedeployments               MachineDeployments
GET    /api/v1/clusters/:ns/:name/machinesets                      MachineSets
GET    /api/v1/clusters/:ns/:name/controlplane                     KubeadmControlPlane
WS     /api/v1/clusters/:ns/:name/machines/:node/shell             Node Shell PTY (WebSocket)
GET    /api/v1/clusters/:ns/:name/addons                         HelmReleaseProxy list (CAAPH add-ons)

GET    /api/v1/logs/pods                                           Controller pods trong capi-system
GET    /api/v1/logs/:ns/:name                                      Pod logs (SSE)

GET    /api/v1/system/tools                                        Kiểm tra kubectl-node_shell có sẵn không
```

> ❌ **Đã xóa:** `/api/v1/os/flavors`, `/api/v1/os/images`, `/api/v1/os/networks`, `/api/v1/os/security-groups` — cùng với `gophercloud` dependency

## ✅ Checklist trước khi báo "Done"

Sau mỗi thay đổi code hoặc fix lỗi, BẮT BUỘC verify theo thứ tự:

```bash
# 1. Backend compile + tests
cd /home/thalt/vnpay/vnpay-project/sandbox/tools/capi-dashboard
export PATH=$PATH:/usr/local/go/bin
go build -mod=vendor ./... && echo "BUILD OK"
go test -mod=vendor ./internal/... -count=1 && echo "TESTS OK"

# 2. Frontend — check node_modules đủ (~400 packages)
npm list --depth=0 2>/dev/null | wc -l   # phải > 100

# 3. Start và đọc logs thực tế
# Backend: check không có error khi start
# Frontend: check page load 200, không có CSS/module error

# 4. Verify API trả đúng
curl -s http://localhost:8080/api/v1/health  # {"status":"UP"}
```

**KHÔNG báo done nếu:**
- Chưa chạy `go build` thành công
- Frontend còn lỗi trong console/terminal (đặc biệt CSS module errors)
- Chưa verify API endpoint mới hoạt động

- [ ] Backend: repo → service → controller → đăng ký route trong `main.go`
- [ ] Frontend: tạo page mới độc lập (KHÔNG import từ page khác)
- [ ] Thêm vào sidebar nếu cần (`web/src/components/layout/sidebar.tsx`)
- [ ] Viết unit test (`make test` phải pass)
- [ ] Cập nhật `HISTORY.md`
- [ ] Cập nhật `CLAUDE.md` nếu có thay đổi kiến trúc
