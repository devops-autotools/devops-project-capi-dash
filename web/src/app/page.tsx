"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  Plus, 
  Server, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  RefreshCw,
  Trash2,
  ExternalLink
} from "lucide-react"

interface Cluster {
  name: string
  namespace: string
  phase: string
  infrastructure: string
  createdAt: string
}

export default function Home() {
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchClusters = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/clusters')
      if (!res.ok) throw new Error('Failed to fetch clusters')
      const data = await res.json()
      setClusters(data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClusters()

    // Setup SSE for real-time updates
    const eventSource = new EventSource('/api/v1/clusters/events')
    
    eventSource.onmessage = (event) => {
      const updatedCluster = JSON.parse(event.data)
      setClusters(prev => {
        const index = prev.findIndex(c => c.name === updatedCluster.name && c.namespace === updatedCluster.namespace)
        
        if (updatedCluster.eventType === 'DELETED') {
          return prev.filter(c => !(c.name === updatedCluster.name && c.namespace === updatedCluster.namespace))
        }

        if (index > -1) {
          // Update existing
          const next = [...prev]
          next[index] = updatedCluster
          return next
        } else {
          // Add new
          return [updatedCluster, ...prev]
        }
      })
    }

    eventSource.onerror = (err) => {
      console.error("SSE connection error", err)
      // On error, the browser will automatically try to reconnect
    }

    return () => {
      eventSource.close()
    }
  }, [])

  const handleDelete = async (namespace: string, name: string) => {
    if (!confirm(`Are you sure you want to delete cluster "${name}"?`)) return
    
    setDeleting(`${namespace}/${name}`)
    try {
      const res = await fetch(`/api/v1/clusters/${namespace}/${name}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const err = await res.json()
        alert(`Failed to delete cluster: ${err.error}`)
      }
      // Note: We don't call fetchClusters() here because SSE will handle the update
    } catch (err) {
      alert("An error occurred while deleting cluster")
    } finally {
      setDeleting(null)
    }
  }

  const stats = [
    { label: 'Total Clusters', value: clusters.length.toString(), icon: Server, color: 'text-blue-600' },
    { label: 'Healthy', value: clusters.filter(c => c.phase === 'Provisioned').length.toString(), icon: CheckCircle2, color: 'text-emerald-600' },
    { label: 'Provisioning', value: clusters.filter(c => ['Provisioning', 'Scaling'].includes(c.phase)).length.toString(), icon: Clock, color: 'text-amber-600' },
    { label: 'Error', value: clusters.filter(c => c.phase === 'Failed').length.toString(), icon: AlertCircle, color: 'text-rose-600' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1">Manage and monitor your OpenStack workload clusters.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchClusters}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <Link 
            href="/clusters/create"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all"
          >
            <Plus size={20} />
            Create New Cluster
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-2 bg-slate-50 rounded-lg`}>
                <stat.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold">Recent Clusters</h2>
          {error && <span className="text-xs text-rose-500 font-medium">Error: {error}</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b">
              <tr>
                <th className="px-6 py-3">Cluster Name</th>
                <th className="px-6 py-3">Namespace</th>
                <th className="px-6 py-3">Phase</th>
                <th className="px-6 py-3">Infrastructure</th>
                <th className="px-6 py-3">Created At</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && clusters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                    Loading clusters...
                  </td>
                </tr>
              ) : clusters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                    No clusters found.
                  </td>
                </tr>
              ) : (
                clusters.map((cluster) => (
                  <tr key={`${cluster.namespace}/${cluster.name}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{cluster.name}</td>
                    <td className="px-6 py-4 font-mono text-xs">{cluster.namespace}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        cluster.phase === 'Provisioned' ? 'bg-emerald-100 text-emerald-800' :
                        ['Provisioning', 'Scaling'].includes(cluster.phase) ? 'bg-blue-100 text-blue-800' :
                        cluster.phase === 'Deleting' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {cluster.phase === 'Provisioned' && <CheckCircle2 size={12} />}
                        {['Provisioning', 'Scaling', 'Deleting'].includes(cluster.phase) && <Clock size={12} className="animate-spin" />}
                        {cluster.phase || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">{cluster.infrastructure || 'N/A'}</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(cluster.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link 
                          href={`/clusters/${cluster.namespace}/${cluster.name}`}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="View Details"
                        >
                          <ExternalLink size={18} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(cluster.namespace, cluster.name)}
                          disabled={deleting === `${cluster.namespace}/${cluster.name}`}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50"
                          title="Delete Cluster"
                        >
                          {deleting === `${cluster.namespace}/${cluster.name}` ? (
                            <RefreshCw size={18} className="animate-spin" />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
