# CAPI Dashboard (OpenStack Edition)

A web-based management interface designed to simplify the lifecycle management of Kubernetes workload clusters on OpenStack infrastructure via Cluster API (CAPI).

## 🚀 Overview

The **CAPI Dashboard** serves as an abstraction layer over the complex YAML-based workflows of Cluster API. It empowers administrators to manage multiple workload clusters through an intuitive UI, eliminating the need for manual template manipulation and direct `kubectl` interactions for common tasks.

### Core Functions:
- **Visualization:** Real-time health monitoring and resource overview of all Managed Clusters.
- **Rapid Provisioning:** Form-based cluster creation that automatically renders and applies optimized OpenStack-specific CAPI templates.
- **Centralized Management:** A single pane of glass for monitoring status, versions, and infrastructure components (Compute, Network, Storage).
- **OpenStack Optimized:** Deep integration with OpenStack parameters such as Project IDs, VLANs, Floating IPs, and Security Groups.

## 👥 Target Audience

- **Cloud Architects & System Administrators:** Who need to maintain a fleet of Kubernetes clusters on OpenStack.
- **Platform Engineers:** Looking to provide a self-service internal developer platform (IDP) for cluster provisioning.
- **DevOps Teams:** Who want a simplified, visual way to track the state of their infrastructure-as-code deployments.

## ✨ Expected Outcomes

- **Reduced Operational Complexity:** Transform hundreds of lines of YAML into a few clicks.
- **Faster Time-to-Market:** Standardize and accelerate the deployment of production-ready workload clusters.
- **Enhanced Reliability:** Minimize human error in cluster configurations through validated templates and automated workflows.
- **Real-time Insights:** Instant visibility into provisioning logs and cluster reconciliation states.

## 🛠 Manual Deployment on Kubernetes

Follow these steps to deploy the CAPI Dashboard onto your **Management Cluster**.

### 1. Prerequisites
- A functional Kubernetes Management Cluster.
- **Cluster API (CAPI)** core providers installed.
- **Cluster API Provider OpenStack (CAPO)** installed and configured.
- `kubectl` configured with cluster-admin access.

### 2. Create Namespace
Ensure the target namespace exists:
```bash
kubectl create namespace capi-system --dry-run=client -o yaml | kubectl apply -f -
```

### 3. Deploy RBAC (Permissions)
The dashboard requires specific permissions to watch and manage CAPI/CAPO resources:
```bash
kubectl apply -f deployments/rbac.yaml
```

### 4. Deploy the Dashboard
Apply the deployment and service configurations. This will start the dual-stack container (Next.js Frontend & Go Backend):
```bash
kubectl apply -f deployments/deployment.yaml
```

### 5. Verify Installation
Check if the pod is running and the service is exposed:
```bash
kubectl get pods -n capi-system -l app=capi-dashboard
kubectl get svc -n capi-system capi-dashboard
```

### 6. Access the UI
By default, the service is configured as a `NodePort` on port `30000`:
- **URL:** `http://<ANY_NODE_IP>:30000`
- **Backend API:** `http://<ANY_NODE_IP>:30000/api/v1` (Proxied internally)

---
*Note: For production environments, it is recommended to configure an Ingress controller and SSL/TLS termination.*
