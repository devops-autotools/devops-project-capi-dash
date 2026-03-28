"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Activity,
  Code,
  Info,
  Server
} from "lucide-react"

interface Condition {
  type: string
  status: string
  reason?: string
  message?: string
  lastTransitionTime: string
}

interface ClusterDetail {
  name: string
  namespace: string
  phase: string
  status: string
  infrastructure: string
  controlPlaneReady: boolean
  infrastructureReady: boolean
  createdAt: string
  conditions: Condition[]
  raw: any
}

export default function ClusterDetailPage({ params }: { params: Promise<{ namespace: string, name: string }> }) {
  const resolvedParams = use(params)
  const [cluster, setCluster] = useState<ClusterDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'conditions' | 'yaml'>('overview')

  const fetchDetail = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/clusters/${resolvedParams.namespace}/${resolvedParams.name}`)
      if (res.ok) {
        setCluster(await res.json())
      }
    } catch (err) {
      console.error("Failed to fetch cluster detail", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [resolvedParams.namespace, resolvedParams.name])

  if (loading && !cluster) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="animate-spin text-blue-600" size={32} />
      </div>
    )
  }

  if (!cluster) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-800">Cluster Not Found</h2>
        <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">Back to Dashboard</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-white rounded-full transition-colors border">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{cluster.name}</h1>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                cluster.phase === 'Provisioned' ? 'bg-emerald-100 text-emerald-800' :
                ['Provisioning', 'Scaling'].includes(cluster.phase) ? 'bg-blue-100 text-blue-800' :
                'bg-slate-100 text-slate-600'
              }`}>
                {cluster.phase || 'Unknown'}
              </span>
            </div>
            <p className="text-slate-500 text-sm">Namespace: {cluster.namespace} • Created: {new Date(cluster.createdAt).toLocaleString()}</p>
          </div>
        </div>
        <button 
          onClick={fetchDetail}
          className="p-2 text-slate-500 hover:bg-white border rounded-lg transition-colors"
        >
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <div className="flex items-center gap-2">
            <Info size={16} /> Overview
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('conditions')}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${activeTab === 'conditions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <div className="flex items-center gap-2">
            <Activity size={16} /> Conditions
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('yaml')}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${activeTab === 'yaml' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <div className="flex items-center gap-2">
            <Code size={16} /> YAML
          </div>
        </button>
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-lg">Cluster Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">Control Plane</span>
                    {cluster.controlPlaneReady ? (
                      <span className="flex items-center gap-1 text-emerald-600 text-sm font-bold">
                        <CheckCircle2 size={16} /> Ready
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600 text-sm font-bold">
                        <Clock size={16} className="animate-spin" /> Pending
                      </span>
                    )}
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">Infrastructure</span>
                    {cluster.infrastructureReady ? (
                      <span className="flex items-center gap-1 text-emerald-600 text-sm font-bold">
                        <CheckCircle2 size={16} /> Ready
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600 text-sm font-bold">
                        <Clock size={16} className="animate-spin" /> Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-lg">Infrastructure Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">Provider</span>
                    <span className="font-medium">{cluster.infrastructure || 'OpenStack'}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">API Server LB</span>
                    <span className="font-medium">{cluster.raw?.spec?.controlPlaneEndpoint?.host || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-lg">Summary</h3>
                <div className="flex items-center gap-4 p-4 bg-blue-50 text-blue-800 rounded-lg">
                  <Server size={24} />
                  <div>
                    <p className="text-xs font-medium uppercase">Infrastructure Kind</p>
                    <p className="font-bold">{cluster.infrastructure}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'conditions' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                <tr>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Reason</th>
                  <th className="px-6 py-3">Last Transition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cluster.conditions?.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold">{c.type}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        c.status === 'True' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-700">{c.reason || 'N/A'}</p>
                      <p className="text-slate-500 text-xs mt-1">{c.message}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{new Date(c.lastTransitionTime).toLocaleString()}</td>
                  </tr>
                ))}
                {!cluster.conditions?.length && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-400">No conditions reported yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'yaml' && (
          <div className="bg-slate-900 rounded-xl p-6 text-slate-300 font-mono text-xs overflow-auto max-h-[600px]">
            <pre>{JSON.stringify(cluster.raw, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
