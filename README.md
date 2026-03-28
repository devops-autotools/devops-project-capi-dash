# 🚀 CAPI Dashboard (OpenStack Edition)

<div align="center">
  <img src="https://skillicons.dev/icons?i=go,nextjs,react,ts,tailwind,kubernetes,docker,openstack" />
  <br />
  <p align="center">
    <strong>A modern, web-based management interface for Cluster API (CAPI) on OpenStack.</strong>
  </p>

  [![GitHub commits since 66a1108](https://img.shields.io/github/commits-since/devops-autotools/devops-project-capi-dash/66a110811f297d7991e2588ffc7dfa34b8e3eb74?style=for-the-badge&logo=github&color=blue)](https://github.com/devops-autotools/devops-project-capi-dash/commits/main)
  [![GitHub last commit](https://img.shields.io/github/last-commit/devops-autotools/devops-project-capi-dash?style=for-the-badge&logo=git&color=orange)](https://github.com/devops-autotools/devops-project-capi-dash/commits/main)
  [![Go Version](https://img.shields.io/badge/Go-1.25+-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://go.dev/)
  [![Next.js Version](https://img.shields.io/badge/Next.js-15+-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
  [![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
</div>

---

## 📖 Overview

The **CAPI Dashboard** is a streamlined administrative platform designed to simplify the lifecycle management of Kubernetes workload clusters on OpenStack infrastructure via **Cluster API (CAPI)**. 

By abstracting away complex YAML-based workflows, it empowers platform engineers and cloud architects to provision, monitor, and scale infrastructure through an intuitive and responsive user interface.

## ✨ Key Features

- 🖥️ **Centralized Dashboard:** Real-time health monitoring of all managed clusters across namespaces.
- ⚡ **Rapid Provisioning:** Intuitive form-based cluster creation with automatic OpenStack template rendering.
- 🛠️ **Infrastructure Management:** Direct visibility into OpenStack resources (Flavors, Images, Networks, Security Groups).
- 💓 **Machine Health Check:** Granular view of individual Nodes, Machines, and MachineDeployments with real-time status icons.
- 📜 **Log Streaming:** Integrated Terminal UI for real-time log viewing of controller pods via SSE (Server-Sent Events).
- 🔒 **Cloud Credentials:** Securely manage `clouds.yaml` and CA certificates directly through the UI.
- 🔄 **Real-time Updates:** Powered by Kubernetes Watchers and SSE for instant status reconciliation.

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | ![Go](https://img.shields.io/badge/Go-00ADD8?style=flat-square&logo=go&logoColor=white) ![Gin](https://img.shields.io/badge/Gin-008080?style=flat-square&logo=gin&logoColor=white) ![Gophercloud](https://img.shields.io/badge/Gophercloud-blue?style=flat-square) |
| **Frontend** | ![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white) ![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) |
| **Cloud/Infra** | ![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=flat-square&logo=kubernetes&logoColor=white) ![OpenStack](https://img.shields.io/badge/OpenStack-f12e24?style=flat-square&logo=openstack&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white) |
| **API/Comm** | ![SSE](https://img.shields.io/badge/SSE-Streaming-orange?style=flat-square) ![JSON](https://img.shields.io/badge/API-REST-blue?style=flat-square) |

## 🏗️ Architecture

```mermaid
graph TD
    User([User / Admin]) <-->|HTTPS| NextJS[Next.js Frontend]
    NextJS <-->|API / SSE| GoBackend[Go Gin Backend]
    GoBackend <-->|K8s Client-Go| K8sAPI[Management Cluster API]
    GoBackend <-->|Gophercloud| OSAPI[OpenStack API]
    K8sAPI <--> CAPI[Cluster API Controllers]
    CAPI <--> CAPO[CAPO - OpenStack Provider]
    CAPO <--> OSAPI
```

## 🚀 Quick Start

### 1. Prerequisites
- A functional Kubernetes Management Cluster.
- **Cluster API (CAPI)** & **OpenStack Provider (CAPO)** installed.
- `kubectl` with admin access to the management cluster.

### 2. Deployment
Apply the RBAC and Deployment manifests:

```bash
# Create namespace
kubectl create namespace capi-system --dry-run=client -o yaml | kubectl apply -f -

# Apply RBAC permissions
kubectl apply -f deployments/rbac.yaml

# Deploy the dashboard
kubectl apply -f deployments/deployment.yaml
```

### 3. Accessing the Dashboard
The service is exposed via **NodePort 30000** by default:
- **URL:** `http://<NODE_IP>:30000`

## 💻 Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/devops-autotools/devops-project-capi-dash.git
   cd devops-project-capi-dash
   ```

2. **Run Backend (Port 8080):**
   ```bash
   go run cmd/dashboard/main.go
   ```

3. **Run Frontend (Port 3000):**
   ```bash
   cd web
   npm install
   npm run dev
   ```

## 📂 Project Structure

- `cmd/`: Application entry point.
- `internal/`: Core business logic (Clean Architecture).
  - `controller/`: HTTP handlers.
  - `service/`: Domain services & orchestration.
  - `repository/`: Data access (K8s, OpenStack).
  - `engine/`: Template rendering logic.
- `web/`: Next.js frontend application.
- `deployments/`: Kubernetes manifests (RBAC, Deployment).
- `docs/`: Technical documentation.

## 🗺️ Roadmap

- [ ] **RBAC & Auth:** Integration with OIDC (Keycloak/Dex).
- [ ] **Helm Chart:** Production-ready Helm chart for easier deployment.
- [ ] **Multi-Provider Support:** Future extensions for AWS/Azure.
- [ ] **Cost Estimation:** Integration with OpenStack quotas/pricing.

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) (if available) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
<div align="center">
  Developed with ❤️ by the DevOps Autotools Team.
</div>
