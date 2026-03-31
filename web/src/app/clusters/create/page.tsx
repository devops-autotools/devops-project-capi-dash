"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2, Info, Server, KeyRound, Network } from "lucide-react"
import Link from "next/link"

export default function CreateClusterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    namespace: "",
    k8sVersion: "v1.30.10",
    networkId: "",
    externalNetworkId: "",
    sshKeyName: "",
    cpFlavor: "std.4x8",
    workerFlavor: "std.4x8",
    cpReplicas: 1,
    workerReplicas: 1,
    imageName: "",
  })

  // Raw text — sẽ được encode base64 trước khi submit
  const [cloudsYamlRaw, setCloudsYamlRaw] = useState("")
  const [cacertRaw, setCacertRaw] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cloudsYamlRaw.trim()) {
      alert("clouds.yaml content is required")
      return
    }
    setLoading(true)
    try {
      // Encode base64 ngay trên browser trước khi gửi
      const cloudsYamlBase64 = btoa(unescape(encodeURIComponent(cloudsYamlRaw)))
      const caCertBase64 = cacertRaw.trim() ? btoa(unescape(encodeURIComponent(cacertRaw))) : ""

      const payload = {
        ...formData,
        cloudsYamlBase64,
        caCertBase64,
      }

      const res = await fetch('/api/v1/clusters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        router.push('/')
      } else {
        const error = await res.json()
        alert(`Failed to create cluster: ${error.error}`)
      }
    } catch (err) {
      alert("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create New Workload Cluster</h1>
          <p className="text-slate-500">Deploy a new Kubernetes cluster on OpenStack infra.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* General Info */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Info size={18} className="text-blue-600" />
            General Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Cluster Name</label>
              <input
                required
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                placeholder="e.g. vnpay-prod-01"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value, namespace: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Namespace</label>
              <input
                required
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                placeholder="e.g. vnpay-prod-01"
                value={formData.namespace}
                onChange={e => setFormData({...formData, namespace: e.target.value})}
              />
            </div>
          </div>
        </section>

        {/* Cloud Credentials */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <KeyRound size={18} className="text-blue-600" />
            Cloud Credentials
          </h2>
          <p className="text-xs text-slate-400">
            Nội dung sẽ được mã hóa Base64 tự động và lưu vào Secret <code className="bg-slate-100 px-1 rounded">{"{cluster-name}"}-cloud-config</code>
          </p>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1">
                clouds.yaml <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={10}
                className="w-full border rounded-md px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-blue-500/20 outline-none bg-slate-50 resize-y"
                placeholder={`clouds:\n  openstack:\n    auth:\n      auth_url: https://172.25.150.20:5000\n      application_credential_id: "..."\n      application_credential_secret: "..."\n    region_name: "RegionOne"\n    interface: "public"\n    identity_api_version: 3\n    auth_type: "v3applicationcredential"\n    verify: false`}
                value={cloudsYamlRaw}
                onChange={e => setCloudsYamlRaw(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-600">
                CA Certificate <span className="text-slate-400 font-normal">(tuỳ chọn)</span>
              </label>
              <textarea
                rows={3}
                className="w-full border rounded-md px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-blue-500/20 outline-none bg-slate-50 resize-y"
                placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                value={cacertRaw}
                onChange={e => setCacertRaw(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* OpenStack Infrastructure */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Server size={18} className="text-blue-600" />
            OpenStack Infrastructure
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Network ID (VLAN)</label>
              <input
                required
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={formData.networkId}
                onChange={e => setFormData({...formData, networkId: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">External Network ID</label>
              <input
                required
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={formData.externalNetworkId}
                onChange={e => setFormData({...formData, externalNetworkId: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">SSH Key Name</label>
              <input
                required
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                placeholder="e.g. thalt-key"
                value={formData.sshKeyName}
                onChange={e => setFormData({...formData, sshKeyName: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Image Name (CAPI Ready)</label>
              <input
                required
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                placeholder="e.g. kaas-v1.30.10"
                value={formData.imageName}
                onChange={e => setFormData({...formData, imageName: e.target.value})}
              />
            </div>
          </div>
        </section>

        {/* Cluster Topology */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Network size={18} className="text-blue-600" />
            Cluster Topology
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-sm border-b pb-2">Control Plane</h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase text-slate-500">Flavor</label>
                  <input
                    className="w-full border rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="e.g. std.4x8"
                    value={formData.cpFlavor}
                    onChange={e => setFormData({...formData, cpFlavor: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase text-slate-500">Replicas</label>
                  <input
                    type="number" min="1" max="5"
                    className="w-full border rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={formData.cpReplicas}
                    onChange={e => setFormData({...formData, cpReplicas: parseInt(e.target.value) || 1})}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-sm border-b pb-2">Worker Nodes</h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase text-slate-500">Flavor</label>
                  <input
                    className="w-full border rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="e.g. std.4x8"
                    value={formData.workerFlavor}
                    onChange={e => setFormData({...formData, workerFlavor: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase text-slate-500">Replicas</label>
                  <input
                    type="number" min="1" max="100"
                    className="w-full border rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={formData.workerReplicas}
                    onChange={e => setFormData({...formData, workerReplicas: parseInt(e.target.value) || 1})}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3 pt-4">
          <Link
            href="/"
            className="px-6 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-2 rounded-lg font-semibold shadow-lg shadow-blue-500/20 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            Provision Cluster
          </button>
        </div>
      </form>
    </div>
  )
}
