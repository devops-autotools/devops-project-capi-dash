"use client"

import { useEffect, useState } from "react"
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from "recharts"
import { RefreshCw, Wifi, WifiOff, Activity } from "lucide-react"

interface Cluster {
  name: string
  namespace: string
  phase: string
  infrastructure: string
  controlPlaneReady: boolean
  infrastructureReady: boolean
  createdAt: string
}

interface LiveEvent {
  time: string
  label: string
  eventType: "ADDED" | "MODIFIED" | "DELETED"
  phase: string
}

interface NodeTopology {
  name: string   // cluster name (truncated)
  Master: number
  Worker: number
}

const PHASE_COLOR: Record<string, string> = {
  Provisioned:  "#10b981",
  Provisioning: "#3b82f6",
  Scaling:      "#6366f1",
  Deleting:     "#f59e0b",
  Failed:       "#ef4444",
  Unknown:      "#94a3b8",
}

export default function DashboardPage() {
  const [clusters,     setClusters]     = useState<Cluster[]>([])
  const [events,       setEvents]       = useState<LiveEvent[]>([])
  const [nodeTopology, setNodeTopology] = useState<NodeTopology[]>([])
  const [loading,      setLoading]      = useState(true)
  const [sseOk,        setSseOk]        = useState(false)

  // Fetch node topology cho tất cả clusters
  const fetchNodeTopology = async (clusterList: Cluster[]) => {
    const results = await Promise.all(
      clusterList.slice(0, 10).map(async (c) => {
        try {
          const [mRes, mdRes] = await Promise.all([
            fetch(`/api/v1/clusters/${c.namespace}/${c.name}/machines`),
            fetch(`/api/v1/clusters/${c.namespace}/${c.name}/machinedeployments`),
          ])
          const machines: any[] = mRes.ok  ? await mRes.json()  : []
          const mds: any[]      = mdRes.ok ? await mdRes.json() : []

          // Worker = tổng desired replicas của tất cả MachineDeployments
          const workerCount = mds.reduce((sum: number, md: any) => sum + (md.replicas ?? 0), 0)
          // Master = machines không thuộc worker (machines.length - workerCount, min 0)
          const masterCount = Math.max(0, machines.length - workerCount)

          return {
            name:   c.name.length > 14 ? c.name.slice(0, 14) + "…" : c.name,
            Master: masterCount,
            Worker: workerCount,
          }
        } catch {
          return { name: c.name, Master: 0, Worker: 0 }
        }
      })
    )
    setNodeTopology(results)
  }

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/v1/clusters")
      if (res.ok) {
        const list: Cluster[] = await res.json()
        setClusters(list)
        await fetchNodeTopology(list)
      }
    } finally { setLoading(false) }
  }

  useEffect(() => {
    fetchAll()
    const es = new EventSource("/api/v1/clusters/watch")
    es.onopen  = () => setSseOk(true)
    es.onerror = () => setSseOk(false)
    // Backend dùng SSEvent("message", ...) → lắng nghe qua addEventListener
    es.addEventListener("message", (e) => {
      const d = JSON.parse(e.data)
      setClusters(prev => {
        const idx = prev.findIndex(c => c.name === d.name && c.namespace === d.namespace)
        if (d.eventType === "DELETED") return prev.filter((_, i) => i !== idx)
        if (idx > -1) { const n = [...prev]; n[idx] = d; return n }
        return [d, ...prev]
      })
      setEvents(prev => [{
        time:      new Date().toLocaleTimeString(),
        label:     `${d.name} → ${d.phase || d.eventType}`,
        eventType: d.eventType,
        phase:     d.phase,
      }, ...prev].slice(0, 20))
    })
    return () => es.close()
  }, [])

  // ── Chart data ────────────────────────────────────────────────────────
  const phaseMap = clusters.reduce<Record<string, number>>((acc, c) => {
    const p = c.phase || "Unknown"; acc[p] = (acc[p] || 0) + 1; return acc
  }, {})
  const pieData = Object.entries(phaseMap).map(([name, value]) => ({ name, value }))

  const areaData = [...events].reverse().map((ev) => ({
    t:        ev.time,
    ADDED:    ev.eventType === "ADDED"    ? 1 : 0,
    MODIFIED: ev.eventType === "MODIFIED" ? 1 : 0,
    DELETED:  ev.eventType === "DELETED"  ? 1 : 0,
  }))

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitoring Overview</h1>
          <p className="text-slate-500 mt-1">Real-time cluster health & activity across Management Cluster.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${
            sseOk ? "text-emerald-600 border-emerald-200 bg-emerald-50"
                  : "text-slate-400 border-slate-200 bg-slate-50"}`}>
            {sseOk ? <Wifi size={12} /> : <WifiOff size={12} />}
            {sseOk ? "Live" : "Connecting..."}
          </span>
          <button onClick={fetchAll} className="p-2 text-slate-500 hover:bg-white border rounded-lg transition-colors">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Health bar */}
      {clusters.length > 0 && (() => {
        const total    = clusters.length
        const healthy  = clusters.filter(c => c.phase === "Provisioned").length
        const pct      = Math.round((healthy / total) * 100)
        return (
          <div className="bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-600">Overall Health</span>
              <span className={`text-sm font-bold ${pct === 100 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-rose-600"}`}>
                {pct}% — {healthy}/{total} healthy
              </span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${pct === 100 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-rose-500"}`}
                style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })()}

      {/* Row 1: Donut + Node Topology bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Donut — phase distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-slate-700 mb-4">Cluster Phase Distribution</h2>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-slate-400 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {pieData.map(entry => (
                    <Cell key={entry.name} fill={PHASE_COLOR[entry.name] ?? PHASE_COLOR.Unknown} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v ?? 0} cluster(s)`, "Count"]} />
                <Legend iconType="circle" iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar — Node topology per cluster */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-slate-700 mb-4">Node Topology per Cluster</h2>
          {nodeTopology.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-slate-400 text-sm">
              {loading ? "Loading..." : "No data"}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={nodeTopology} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v, name) => [`${v ?? 0} node(s)`, name]} />
                <Legend iconType="circle" iconSize={10} />
                <Bar dataKey="Master" fill="#6366f1" radius={[4,4,0,0]} maxBarSize={36} />
                <Bar dataKey="Worker" fill="#10b981" radius={[4,4,0,0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 2: Area chart + Live event feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Area — event activity */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Activity size={14} /> Live Event Activity
          </h2>
          {areaData.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-slate-400 text-sm">
              Waiting for cluster events...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={areaData} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                <defs>
                  <linearGradient id="gAdded"    x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gModified" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gDeleted"  x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="t" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconType="circle" iconSize={10} />
                <Area type="monotone" dataKey="ADDED"    stroke="#3b82f6" fill="url(#gAdded)"    strokeWidth={2} />
                <Area type="monotone" dataKey="MODIFIED" stroke="#f59e0b" fill="url(#gModified)" strokeWidth={2} />
                <Area type="monotone" dataKey="DELETED"  stroke="#ef4444" fill="url(#gDeleted)"  strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Live event feed */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700">Recent Events</h2>
            <span className={`w-2 h-2 rounded-full ${sseOk ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50 max-h-[230px]">
            {events.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">No events yet</div>
            ) : events.map((ev, i) => (
              <div key={i} className="px-5 py-2.5 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700 truncate">{ev.label}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                    ev.eventType === "ADDED"   ? "bg-blue-100 text-blue-700"  :
                    ev.eventType === "DELETED" ? "bg-rose-100 text-rose-700"  :
                    "bg-amber-100 text-amber-700"
                  }`}>{ev.eventType}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{ev.time}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
