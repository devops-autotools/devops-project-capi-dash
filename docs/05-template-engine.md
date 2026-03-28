# Template Engine & YAML Mapping

## 1. Nguyên lý hoạt động
Hệ thống sử dụng cơ chế **Declarative Template**. Thay vì hardcode các giá trị YAML trong code, chúng ta sử dụng bộ 8 file mẫu hiện có và biến chúng thành các file Go Template (`.tmpl`).

## 2. Danh sách 8 file Template & Nhiệm vụ
Hệ thống sẽ thực hiện apply theo thứ tự sau để đảm bảo tính phụ thuộc:

1.  **Secret Auth (`1-secret-authen-openstack.yaml`):** Chứa credentials (clouds.yaml) của OpenStack.
2.  **Cluster (`2-cluster.yaml`):** Định nghĩa cụm Cluster tổng quát, ref tới ControlPlane và Infrastructure.
3.  **Infrastructure (`3-infrastructure.yaml`):** Cấu hình Network, Subnet, Floating IP đặc thù của OpenStack.
4.  **ControlPlane (`4-controlplane.yaml`):** Cấu hình Kubeadm cho các node master.
5.  **Bootstrap (`5-bootstrap.yaml`):** Cấu hình join cho các worker nodes.
6.  **ControlPlane Machine Template (`6-KubeadmControlPlane-md.yaml`):** Flavor, Image cho Master.
7.  **Worker Machine Template (`7-workernode-md.yaml`):** Flavor, Image cho Worker.
8.  **MachineDeployment (`8.MachineDeployment.yaml`):** Định nghĩa số lượng worker replicas.

## 3. Bảng Mapping Biến (Variable Mapping)

Dưới đây là các biến chính sẽ được người dùng nhập từ UI:

| Biến Template | Ý nghĩa | Ví dụ |
| :--- | :--- | :--- |
| `{{ .ClusterName }}` | Tên của Workload Cluster | `vnpay-prod-01` |
| `{{ .Namespace }}` | Namespace trên Management Cluster | `clusters-prod` |
| `{{ .K8sVersion }}` | Phiên bản Kubernetes | `v1.30.10` |
| `{{ .NetworkID }}` | ID của VLAN Network trên OpenStack | `eda97e04-...` |
| `{{ .ExternalNetworkID }}` | ID của External Network (cho LoadBalancer) | `11e33526-...` |
| `{{ .SSHKeyName }}` | Tên SSH Key đã có trên OpenStack | `admin-key` |
| `{{ .CPFlavor }}` | Cấu hình máy cho Control Plane | `std.4x8` |
| `{{ .WorkerFlavor }}` | Cấu hình máy cho Worker Node | `std.8x16` |
| `{{ .CPReplicas }}` | Số lượng Control Plane nodes | `3` |
| `{{ .WorkerReplicas }}` | Số lượng Worker nodes | `5` |
| `{{ .ImageName }}` | Tên Image Ubuntu/CentOS có sẵn CAPI | `kaas-v1.30.10` |

## 4. Quy trình Render
Backend sẽ thực hiện:
1.  Đọc file `.yaml.tmpl` từ bộ nhớ hoặc disk.
2.  Sử dụng thư viện `text/template` của Go để inject struct `ClusterConfig` vào.
3.  Kết quả đầu ra là một chuỗi YAML hoàn chỉnh.
4.  Dùng `UniversalDeserializer` của K8s để biến YAML thành Object và Apply.
