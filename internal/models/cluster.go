package models

// ClusterConfig đại diện cho toàn bộ tham số để tạo một Workload Cluster trên OpenStack
type ClusterConfig struct {
	// General
	ClusterName string `json:"name" binding:"required"`
	Namespace   string `json:"namespace" binding:"required"`
	K8sVersion  string `json:"k8sVersion" default:"v1.30.10"`

	// OpenStack Auth & Secret
	CloudsYamlBase64 string `json:"cloudsYamlBase64"` // Nội dung file clouds.yaml đã encode base64
	CaCertBase64     string `json:"caCertBase64"`     // Nội dung file cacert đã encode base64 (nếu có)

	// Infrastructure (OpenStack)
	NetworkID                    string `json:"networkId" binding:"required"`
	ExternalNetworkID            string `json:"externalNetworkId" binding:"required"`
	SSHKeyName                   string `json:"sshKeyName" binding:"required"`
	APIServerLoadBalancerEnabled bool   `json:"apiServerLoadBalancerEnabled" default:"false"`
	SecurityGroupID              string `json:"securityGroupId"`
	AvailabilityZone             string `json:"availabilityZone" default:"nova"`

	// Topology & Flavors
	CPFlavor         string `json:"cpFlavor" default:"std.4x8"`
	WorkerFlavor     string `json:"workerFlavor" default:"std.4x8"`
	CPReplicas       int    `json:"cpReplicas" default:"1"`
	WorkerReplicas   int    `json:"workerReplicas" default:"1"`
	CPVolumeSize     int    `json:"cpVolumeSize" default:"50"`
	WorkerVolumeSize int    `json:"workerVolumeSize" default:"50"`
	ImageName        string `json:"imageName" binding:"required"`

	// Networking
	CNI           string `json:"cni" default:"cilium"`
	PodCIDR       string `json:"podCidr" default:"10.244.0.0/16"`
	ServiceCIDR   string `json:"serviceCidr" default:"10.96.0.0/12"`
	ServiceDomain string `json:"serviceDomain" default:"cluster.local"`
}
