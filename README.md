<div align="center">

# CAPI Dashboard

**A modern, web-based management interface for Cluster API (CAPI) on OpenStack.**

<img src="https://skillicons.dev/icons?i=go,nextjs,react,ts,tailwind,kubernetes,docker,openstack" />

<br />
<br />

[![GitHub last commit](https://img.shields.io/github/last-commit/devops-autotools/devops-project-capi-dash?style=for-the-badge&logo=git&color=orange)](https://github.com/devops-autotools/devops-project-capi-dash/commits/main)
[![Go Version](https://img.shields.io/badge/Go-1.23+-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://go.dev/)
[![Next.js Version](https://img.shields.io/badge/Next.js-16+-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

## Overview

**CAPI Dashboard** is a centralized administrative platform that simplifies the full lifecycle management of Kubernetes workload clusters provisioned on **OpenStack** via [Cluster API (CAPI)](https://cluster-api.sigs.k8s.io/).

Designed for Platform Engineers and SRE Admins, it eliminates the need for manual YAML authoring by providing an intuitive UI to provision, inspect, scale, and debug infrastructure — all from a single pane of glass.

---

## Features

| Feature | Description |
|:---|:---|
| **Real-time Cluster Monitoring** | Live health status of all managed clusters via Kubernetes Watchers + SSE |
| **Cluster Provisioning** | Form-based wizard that renders and applies full CAPI manifests automatically |
| **Machine & Node Management** | Deep visibility into Machines, MachineSets, MachineDeployments, and Control Planes |
| **Machine Health Checks** | Configurable health policies with live status indicators per node |
| **Interactive Node Shell** | Full PTY terminal over WebSocket (`kubectl node-shell`) directly in the browser |
| **Log Streaming** | Real-time pod log tailing via SSE with integrated terminal-style UI |
| **OpenStack Resource Browser** | Discover Flavors, Images, Networks, and Security Groups from the UI |
| **Cloud Credentials Management** | Securely upload and manage `clouds.yaml` and CA certificates |
| **Toast Notifications** | Contextual feedback for all cluster lifecycle actions |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        Browser                           │
│   Next.js 16 (App Router · TypeScript · Tailwind CSS)    │
│   xterm.js WebSocket Terminal · SSE Event Stream         │
└─────────────────────────┬────────────────────────────────┘
                          │ HTTP / SSE / WebSocket
┌─────────────────────────▼────────────────────────────────┐
│              nginx Reverse Proxy (port 80)               │
│         HTTP + WebSocket upgrade · Single entry point    │
└──────────┬───────────────────────────┬───────────────────┘
           │                           │
┌──────────▼──────────┐   ┌────────────▼───────────────────┐
│  Go Gin Backend     │   │   Next.js Frontend Server       │
│  port :8080         │   │   port :3000                    │
└──────────┬──────────┘   └────────────────────────────────┘
           │
  ┌────────┴─────────┐
  │                  │
┌─▼──────────────┐ ┌─▼──────────────────┐
│  K8s client-go │ │  Gophercloud        │
│  Management    │ │  OpenStack API      │
│  Cluster API   │ │  (Nova/Neutron/     │
│  CAPI/CAPO     │ │   Glance/Keystone)  │
└────────────────┘ └────────────────────┘
```

### Component Layout

```
capi-dashboard/
├── cmd/dashboard/main.go              # Application entry point (port 8080)
├── internal/
│   ├── controller/
│   │   ├── cluster.go                 # Cluster CRUD, SSE, Machine handlers
│   │   └── system.go                  # Node Shell WebSocket (PTY) + system tools
│   ├── service/cluster_service.go     # Business logic, kubeconfig management
│   ├── repository/k8s.go              # Kubernetes dynamic client
│   ├── engine/render/render.go        # Go text/template manifest renderer
│   └── models/cluster.go             # Domain models
├── web/src/
│   ├── app/                           # Next.js App Router pages
│   └── components/ui/
│       └── NodeTerminal.tsx           # xterm.js WebSocket PTY component
├── nginx.conf                         # Reverse proxy (HTTP + WebSocket upgrade)
├── Dockerfile                         # Multi-stage build
└── deployments/
    ├── deployment.yaml                # K8s Deployment + NodePort Service
    └── rbac.yaml                      # ServiceAccount + ClusterRole + Binding
```

---

## Tech Stack

| Layer | Technologies |
|:---|:---|
| **Backend** | Go 1.23 · Gin · client-go (dynamic) · controller-runtime · Gophercloud · creack/pty |
| **Frontend** | Next.js 16 · React · TypeScript (strict) · Tailwind CSS v4 · Lucide React · xterm.js |
| **Real-time** | Kubernetes Watchers · Server-Sent Events (SSE) · WebSocket (PTY terminal) |
| **Infrastructure** | Kubernetes (CAPI/CAPO) · OpenStack · Docker · nginx · tini |

---

## API Reference

```
GET    /api/v1/health
GET    /api/v1/clusters
GET    /api/v1/clusters/events                              # SSE stream
GET    /api/v1/clusters/:namespace/:name
POST   /api/v1/clusters
DELETE /api/v1/clusters/:namespace/:name

GET    /api/v1/clusters/:namespace/:name/machines
GET    /api/v1/clusters/:namespace/:name/machinedeployments
GET    /api/v1/clusters/:namespace/:name/machinesets
GET    /api/v1/clusters/:namespace/:name/controlplane
WS     /api/v1/clusters/:namespace/:name/machines/:node/shell  # PTY WebSocket

GET    /api/v1/logs/pods
GET    /api/v1/logs/:namespace/:name
GET    /api/v1/system/tools
```

---

## Quick Start

### Prerequisites

- Kubernetes Management Cluster with admin access
- [Cluster API (CAPI)](https://cluster-api.sigs.k8s.io/) installed
- [OpenStack Provider (CAPO)](https://github.com/kubernetes-sigs/cluster-api-provider-openstack) installed
- `kubectl` configured to point at the management cluster

### Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace capi-system --dry-run=client -o yaml | kubectl apply -f -

# Apply RBAC
kubectl apply -f deployments/rbac.yaml

# Deploy the dashboard
kubectl apply -f deployments/deployment.yaml

# Access via NodePort
echo "Dashboard: http://$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}'):30000"
```

### Docker (Single Container)

```bash
docker run -d \
  -p 8080:80 \
  --name capi-dashboard \
  -v ~/.kube/config:/root/.kube/config:ro \
  ghcr.io/devops-autotools/capi-dashboard:latest
```

---

## Local Development

### 1. Clone

```bash
git clone https://github.com/devops-autotools/devops-project-capi-dash.git
cd devops-project-capi-dash
```

### 2. Start Backend (port 8080)

```bash
export KUBECONFIG=~/.kube/config
go run cmd/dashboard/main.go
```

### 3. Start Frontend (port 3000)

```bash
cd web
unset NODE_ENV   # important: prevents devDeps from being excluded
npm install --legacy-peer-deps
npm run dev
```

Frontend proxies `/api/v1/*` → `localhost:8080` automatically.

### 4. Build & Verify

```bash
# Backend
go build -mod=vendor ./... && echo "BUILD OK"
go test -mod=vendor ./internal/... && echo "TESTS OK"

# Frontend
cd web && npm run build
```

### Build Docker Image

```bash
# Vendor Go modules first (offline build)
go mod vendor

# Build image
docker build -t capi-dashboard:latest .
```

---

## Roadmap

- [ ] **RBAC & Authentication** — OIDC integration (Keycloak / Dex)
- [ ] **Helm Chart** — Production-ready chart for management cluster deployment
- [ ] **Multi-Provider Support** — AWS (CAPA), Azure (CAPZ) provider extensions
- [ ] **Cost Estimation** — OpenStack quota & pricing integration
- [ ] **Audit Logging** — Track all provisioning and deletion events

---

## Security

- Cloud credentials (`clouds.yaml`, kubeconfigs) are never persisted to disk beyond the active session
- Node Shell sessions use temporary kubeconfig files (`/tmp/wl-kubeconfig-*.yaml`) cleaned up on disconnect
- Do not commit `clouds.yaml`, kubeconfig files, or `.env` to the repository

---

## Contributing

Contributions are welcome. Please open an issue to discuss significant changes before submitting a pull request.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
  Built for Platform Engineers, by Platform Engineers.
</div>
