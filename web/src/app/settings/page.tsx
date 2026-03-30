"use client"

import { useEffect, useState } from "react"
import {
  Server, CheckCircle2, XCircle, RefreshCw,
  Info, Cpu, Activity, GitBranch, Clock,
} from "lucide-react"

interface HealthStatus {
  status: string
}

interface ComponentInfo {
  name: string
  namespace: string
  status: string
  ready: boolean
}

interface SystemInfo {
  health: HealthStatus | null
  capiComponents: ComponentInfo[]
  clusterCount: number
  loadedAt: string
}

function StatusBadge({ ready, label }: { ready: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
      ready ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
    }`}>
      {ready ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
      {label}
    </span>
  )
}

export default function SettingsPage() {
  const [info, setInfo]       = useState<SystemInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchInfo = async () => {
    setLoading(true)
    try {
      const [healthRes, clustersRes, podsRes] = await Promise.all([
        fetch("/api/v1/health"),
        fetch("/api/v1/clusters"),
        fetch("/api/v1/logs/pods"),
      ])

      const health     = healthRes.ok  ? await healthRes.json()   : null
      const clusters   = clustersRes.ok ? await clustersRes.json() : []
      const pods: any[] = podsRes.ok   ? await podsRes.json()     : []

      // Group controller pods thành CAPI components
      const componentMap: Record<string, ComponentInfo> = {}
      for (const pod of pods) {
        const key = pod.namespace
        if (!componentMap[key]) {
          componentMap[key] = {
            name:      nsToName(pod.namespace),
            namespace: pod.namespace,
            status:    pod.status,
            ready:     pod.status === "Running",
          }
        }
        // Nếu bất kỳ pod nào không Running → component không ready
        if (pod.status !== "Running") componentMap[key].ready = false
      }

      setInfo({
        health,
        capiComponents: Object.values(componentMap),
        clusterCount:   clusters.length,
        loadedAt:       new Date().toLocaleString(),
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchInfo() }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Info</h1>
          <p className="text-slate-500 mt-1">Runtime status of the CAPI Dashboard and Management Cluster.</p>
        </div>
        <button onClick={fetchInfo}
          className="p-2 text-slate-500 hover:bg-white border rounded-lg transition-colors" title="Refresh">
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading && !info ? (
        <div className="flex items-center justify-center py-24 text-slate-400">
          <RefreshCw size={28} className="animate-spin mr-3" /> Loading system info...
        </div>
      ) : (
        <div className="space-y-6">

          {/* Row 1: Quick status cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="bg-blue-50 text-blue-600 p-3 rounded-lg"><Server size={22} /></div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Backend API</p>
                <StatusBadge ready={info?.health?.status === "UP"} label={info?.health?.status ?? "Unknown"} />
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg"><GitBranch size={22} /></div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Workload Clusters</p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">{info?.clusterCount ?? "—"}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="bg-slate-100 text-slate-600 p-3 rounded-lg"><Clock size={22} /></div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Last Refreshed</p>
                <p className="text-xs font-mono text-slate-700 mt-1">{info?.loadedAt ?? "—"}</p>
              </div>
            </div>
          </div>

          {/* Row 2: CAPI Components */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-6 py-4 border-b flex items-center gap-2">
              <Activity size={16} className="text-blue-600" />
              <h2 className="font-bold text-slate-800">CAPI Controller Components</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {info?.capiComponents.length === 0 ? (
                <div className="px-6 py-10 text-center text-slate-400 text-sm">
                  No controller pods found. Check if CAPI is installed on the management cluster.
                </div>
              ) : info?.capiComponents.map(c => (
                <div key={c.namespace} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{c.name}</p>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">{c.namespace}</p>
                  </div>
                  <StatusBadge ready={c.ready} label={c.ready ? "Running" : c.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Row 3: About */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-6 py-4 border-b flex items-center gap-2">
              <Info size={16} className="text-blue-600" />
              <h2 className="font-bold text-slate-800">About</h2>
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-y-4 text-sm">
              {[
                { label: "Project",      value: "CAPI Dashboard"              },
                { label: "Version",      value: "v0.1.0"                      },
                { label: "Tech Stack",   value: "Go / Gin + Next.js 16"       },
                { label: "K8s Client",   value: "client-go dynamic client"    },
                { label: "CAPI Version", value: "v1beta1"                     },
                { label: "Provider",     value: "OpenStack (CAPO)"            },
              ].map(row => (
                <div key={row.label}>
                  <p className="text-slate-400 text-xs uppercase font-semibold">{row.label}</p>
                  <p className="text-slate-800 font-medium mt-0.5">{row.value}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

// Helper: đổi namespace → tên thân thiện
function nsToName(ns: string): string {
  const map: Record<string, string> = {
    "capi-system":                         "Cluster API (Core)",
    "capo-system":                         "CAPO — OpenStack Provider",
    "capi-kubeadm-bootstrap-system":       "Kubeadm Bootstrap",
    "capi-kubeadm-control-plane-system":   "Kubeadm Control Plane",
  }
  return map[ns] ?? ns
}
