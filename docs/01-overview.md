# Overview: CAPI Dashboard (OpenStack Edition)

## 1. Tầm nhìn (Vision)
Dự án nhằm đơn giản hóa việc quản lý vòng đời (lifecycle) của hàng loạt Workload Cluster được triển khai trên hạ tầng OpenStack thông qua Cluster API (CAPI). Dashboard này đóng vai trò là một lớp giao diện (Abstraction Layer) trên cùng, giúp Admin không cần thao tác trực tiếp với các file YAML phức tạp.

## 2. Mục tiêu chính (Main Objectives)
*   **Trực quan hóa (Visibility):** Cung cấp cái nhìn tổng thể về tình trạng sức khỏe, version, và tài nguyên của toàn bộ Workload Clusters.
*   **Tạo Cluster nhanh chóng (Rapid Provisioning):** Admin chỉ cần điền thông số vào Form (Flavor, Network, Image, Replicas...), hệ thống tự động sinh và apply YAML.
*   **Quản lý tập trung (Centralized Management):** Deploy trực tiếp trên Management Cluster, sử dụng chính cơ chế Auth của K8s/OpenStack.
*   **Tối ưu cho OpenStack:** Hỗ trợ sâu các tham số đặc thù của OpenStack như Project ID, Network VLAN, Floating IP, Security Groups, và Volume Storage.

## 3. Phạm vi (Scope)
*   **Giai đoạn 1:** Hỗ trợ liệt kê (List), xem chi tiết (Detail) và tạo mới (Create) Cluster dựa trên bộ 8 template tiêu chuẩn.
*   **Giai đoạn 2:** Hỗ trợ Scale (thay đổi số lượng replicas), Upgrade version K8s, và Xóa (Delete) Cluster.
*   **Giai đoạn 3:** Tích hợp log/monitor cơ bản cho từng cụm.
