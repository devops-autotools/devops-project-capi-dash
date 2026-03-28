# API Specification (V1)

Toàn bộ API sử dụng JSON làm định dạng trao đổi dữ liệu.

## 1. Cluster Management

### 1.1 List Clusters
*   **Endpoint:** `GET /api/v1/clusters`
*   **Response:** `200 OK`
    ```json
    [
      {
        "name": "lab-thalt-01",
        "namespace": "default",
        "status": "Provisioned",
        "k8sVersion": "v1.30.10",
        "controlPlaneReady": true,
        "infrastructureReady": true,
        "cpNodes": 1,
        "workerNodes": 2,
        "createdAt": "2026-03-25T10:00:00Z"
      }
    ]
    ```

### 1.2 Create Cluster
*   **Endpoint:** `POST /api/v1/clusters`
*   **Payload:**
    ```json
    {
      "name": "new-cluster",
      "namespace": "default",
      "k8sVersion": "v1.30.10",
      "openstack": {
        "networkId": "...",
        "externalNetworkId": "...",
        "sshKey": "...",
        "cpFlavor": "std.4x8",
        "workerFlavor": "std.4x8",
        "image": "..."
      },
      "topology": {
        "cpReplicas": 1,
        "workerReplicas": 2
      }
    }
    ```

### 1.3 Delete Cluster
*   **Endpoint:** `DELETE /api/v1/clusters/{namespace}/{name}`

## 2. OpenStack Metadata (Helpers cho UI Form)

Để người dùng không phải nhập tay ID, Backend sẽ cung cấp các API proxy sang OpenStack:

*   **GET `/api/v1/os/flavors`**: List danh sách Flavor.
*   **GET `/api/v1/os/images`**: List danh sách Images hỗ trợ CAPI.
*   **GET `/api/v1/os/networks`**: List danh sách Network khả dụng.
