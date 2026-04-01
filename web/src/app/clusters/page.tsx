"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Plus, Server, CheckCircle2, AlertCircle,
  Clock, RefreshCw, Trash2, ExternalLink, Search,
} from "lucide-react"
import { ToastContainer, useToast } from "@/components/ui/toast"

interface Cluster {
  name: string
  namespace: string
  phase: string
  infrastructure: string
  createdAt: string
}

export default function ClustersPage() {
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const { toasts, addToast, removeToast } = useToast()

  const fetchClusters = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/v1/clusters")
      if (!res.ok) throw new Error("Failed to fetch clusters")
      setClusters(await res.json())
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClusters()
    const es = new EventSource("/api/v1/clusters/events")
    es.onmessage = (e) => {
      const d = JSON.parse(e.data)
      setClusters(prev => {
        const idx = prev.findIndex(c => c.name === d.name && c.namespace === d.namespace)
        if (d.eventType === "DELETED") return prev.filter((_, i) => i !== idx)
        if (idx > -1) { const n = [...prev]; n[idx] = d; return n }
        return [d, ...prev]
      })
    }
    return () => es.close()
  }, [])

  const handleDelete = async (namespace: string, name: string) => {
    if (!confirm(`Delete cluster "${name}"?`)) return
    setDeleting(`${namespace}/${name}`)
    try {
      const res = await fetch(`/api/v1/clusters/${namespace}/${name}`, { method: "DELETE" })
      if (res.ok) {
        addToast(`Cluster "${name}" deleted successfully`, "success")
      } else {
        const err = await res.json()
        addToast(`Failed to delete "${name}": ${err.error}`, "error")
      }
    } catch {
      addToast("An error occurred while deleting cluster", "error")
    } finally {
      setDeleting(null)
    }
  }

  const phaseBadge = (phase: string) => {
    const cfg: Record<string, string> = {
      Provisioned:  "bg-emerald-100 text-emerald-800",
      Provisioning: "bg-blue-100 text-blue-800",
      Scaling:      "bg-blue-100 text-blue-800",
      Deleting:     "bg-amber-100 text-amber-800",
      Failed:       "bg-rose-100 text-rose-800",
    }
    const icon =
      phase === "Provisioned"                      ? <CheckCircle2 size={12} /> :
      ["Provisioning","Scaling","Deleting"].includes(phase) ? <Clock size={12} className="animate-spin" /> :
      phase === "Failed"                           ? <AlertCircle size={12} /> : null
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg[phase] ?? "bg-slate-100 text-slate-600"}`}>
        {icon} {phase || "Unknown"}
      </span>
    )
  }

  const filteredClusters = clusters.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.namespace.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workload Clusters</h1>
          <p className="text-slate-500 mt-1">Manage all CAPI workload clusters on OpenStack.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search clusters..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 bg-white w-52"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                ✕
              </button>
            )}
          </div>
          <button onClick={fetchClusters}
            className="p-2 text-slate-500 hover:bg-white border rounded-lg transition-colors"
            title="Refresh">
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <Link href="/clusters/create"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all">
            <Plus size={18} /> Create Cluster
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total",        value: clusters.length,                                                  color: "text-blue-600",    bg: "bg-blue-50",    icon: Server       },
          { label: "Healthy",      value: clusters.filter(c => c.phase === "Provisioned").length,           color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle2 },
          { label: "Provisioning", value: clusters.filter(c => ["Provisioning","Scaling"].includes(c.phase)).length, color: "text-blue-500", bg: "bg-blue-50", icon: Clock },
          { label: "Failed",       value: clusters.filter(c => c.phase === "Failed").length,                color: "text-rose-600",    bg: "bg-rose-50",    icon: AlertCircle  },
        ].map(s => (
          <div key={s.label} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">{s.label}</p>
              <p className="text-2xl font-bold mt-0.5">{s.value}</p>
            </div>
            <div className={`${s.color} ${s.bg} p-2.5 rounded-lg`}><s.icon size={20} /></div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2"><Server size={18} /> All Clusters</h2>
          <div className="flex items-center gap-2">
            {searchTerm && (
              <span className="text-xs text-slate-500">
                {filteredClusters.length} / {clusters.length} clusters
              </span>
            )}
            {error && <span className="text-xs text-rose-500 font-medium">Error: {error}</span>}
          </div>
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
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  <RefreshCw size={24} className="animate-spin mx-auto mb-2" />Loading clusters...
                </td></tr>
              ) : filteredClusters.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  {searchTerm
                    ? <>No clusters matching <span className="font-semibold text-slate-600">"{searchTerm}"</span></>
                    : <>No clusters found.{" "}<Link href="/clusters/create" className="text-blue-600 hover:underline">Create one</Link></>
                  }
                </td></tr>
              ) : filteredClusters.map(c => (
                <tr key={`${c.namespace}/${c.name}`} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">{c.name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-600">{c.namespace}</td>
                  <td className="px-6 py-4">{phaseBadge(c.phase)}</td>
                  <td className="px-6 py-4 text-slate-600">{c.infrastructure || "OpenStack"}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs">{new Date(c.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/clusters/${c.namespace}/${c.name}`}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="View Details">
                        <ExternalLink size={17} />
                      </Link>
                      <button onClick={() => handleDelete(c.namespace, c.name)}
                        disabled={deleting === `${c.namespace}/${c.name}`}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-40" title="Delete">
                        {deleting === `${c.namespace}/${c.name}`
                          ? <RefreshCw size={17} className="animate-spin" />
                          : <Trash2 size={17} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  )
}
