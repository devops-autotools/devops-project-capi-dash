# Development Guide

## 1. Prerequisites
*   **Go:** v1.22+
*   **Node.js:** v20+ (cho Frontend)
*   **Kubernetes Cluster:** Đã cài sẵn Cluster API và OpenStack Provider (CAPO).
*   **Kubeconfig:** Có quyền admin trên Management Cluster.

## 2. Project Setup

### 2.1 Backend
```bash
cd internal
go mod download
go run cmd/dashboard/main.go
```

### 2.2 Frontend
```bash
cd web
npm install
npm run dev
```

## 3. Environment Variables
Tạo file `.env` tại thư mục gốc:
```env
KUBECONFIG=~/.kube/config
PORT=8080
GIN_MODE=debug
```

## 4. Building for Production

### 4.1 Build Docker Image
Hệ thống khuyến khích sử dụng Multi-stage build để tối ưu dung lượng:
```bash
make docker-build
```

### 4.2 Deploy to Kubernetes
```bash
kubectl apply -f deployments/manifests/
```
Hoặc dùng Helm (Khuyên dùng):
```bash
helm install capi-dashboard ./deployments/helm
```

## 5. Coding Standards
*   **Backend:** Theo chuẩn Clean Architecture. Logic nghiệp vụ nằm trong `internal/service`.
*   **Frontend:** Sử dụng Functional Components và Hooks. Style guide tuân thủ Tailwind CSS.
*   **API:** Luôn cập nhật `docs/03-api-spec.md` khi thay đổi endpoint.
