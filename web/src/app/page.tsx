"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from "recharts"
import {
  Server, CheckCircle2, AlertCircle, Clock,
  RefreshCw, Plus, Wifi, WifiOff, Activity,
} from "lucide-react"

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

const PHASE_COLOR: Record<string, string> = {
  Provisioned:  "#10b981",
  Provisioning: "#3b82f6",
  Scaling:      "#6366f1",
  Deleting:     "#f59e0b",
  Failed:       "#ef4444",
  Unknown:      "#94a3b8",
}

export default function DashboardPage() {
  const [clusters,  setClusters]  = useState<Cluster[]>([])
  const [events,    setEvents]    = useState<LiveEvent[]>([])
  const [loading,   setLoading]   = useState(true)
  const [sseOk,     setSseOk]     = useState(false)

  const fetchClusters = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/v1/clusters")
      if (res.ok) setClusters(await res.json())
    } finally { setLoading(false) }
  }

  useEffect(() => {
    fetchClusters()
    const es = new EventSource("/api/v1/clusters/events")
    es.onopen = () => setSseOk(true)
    es.onerror = () => setSseOk(false)
    es.onmessage = (e) => {
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
    }
    return () => es.close()
  }, [])

  // ── Derived data for charts ──────────────────────────────────────────
  const total        = clusters.length
  const healthy      = clusters.filter(c => c.phase === "Provisioned").length
  const provisioning = clusters.filter(c => ["Provisioning","Scaling"].includes(c.phase)).length
  const failed       = clusters.filter(c => c.phase === "Failed").length
  const healthPct    = total > 0 ? Math.round((healthy / total) * 100) : 0

  // Pie: phase distribution
  const phaseMap = clusters.reduce<Record<string, number>>((acc, c) => {
    const p = c.phase || "Unknown"
    acc[p] = (acc[p] || 0) + 1
    return acc
  }, {})
  const pieData = Object.entries(phaseMap).map(([name, value]) => ({ name, value }))

  // Bar: CP ready & Infra ready per cluster (max 10)
  const barData = clusters.slice(0, 10).map(c => ({
    name:          c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
    "Control Plane": c.controlPlaneReady ? 1 : 0,
    "Infrastructure": c.infrastructureReady ? 1 : 0,
  }))

  // Area: event activity over time (last 20, reversed for chronological)
  const areaData = [...events].reverse().map((ev, i) => ({
    t:       ev.time,
    idx:     i + 1,
    ADDED:   ev.eventType === "ADDED"    ? 1 : 0,
    MODIFIED:ev.eventType === "MODIFIED" ? 1 : 0,
    DELETED: ev.eventType === "DELETED"  ? 1 : 0,
  }))

  const statCards = [
    { label: "Total Clusters",  value: total,        icon: Server,       color: "text-blue-600",    bg: "bg-blue-50"    },
    { label: "Healthy",         value: healthy,       icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Provisioning",    value: provisioning,  icon: Clock,        color: "text-indigo-600",  bg: "bg-indigo-50"  },
    { label: "Failed",          value: failed,        icon: AlertCircle,  color: "text-rose-600",    bg: "bg-rose-50"    },
  ]

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitoring Overview</h1>
          <p className="text-slate-500 mt-1">Real-time cluster health & activity across Management Cluster.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${sseOk ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-slate-400 border-slate-200 bg-slate-50"}`}>
            {sseOk ? <Wifi size={12} /> : <WifiOff size={12} />}
            {sseOk ? "Live" : "Connecting..."}
          </span>
          <button onClick={fetchClusters} className="p-2 text-slate-500 hover:bg-white border rounded-lg transition-colors">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <Link href="/clusters/create"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all">
            <Plus size={16} /> New Cluster
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">{s.label}</p>
              <p className="text-3xl font-bold mt-0.5">{s.value}</p>
            </div>
            <div className={`${s.color} ${s.bg} p-2.5 rounded-lg`}><s.icon size={22} /></div>
          </div>
        ))}
      </div>

      {/* Health bar */}
      {total > 0 && (
        <div className="bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-600">Overall Health</span>
            <span className={`text-sm font-bold ${healthPct === 100 ? "text-emerald-600" : healthPct >= 50 ? "text-amber-600" : "text-rose-600"}`}>
              {healthPct}% — {healthy}/{total} healthy
            </span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${healthPct === 100 ? "bg-emerald-500" : healthPct >= 50 ? "bg-amber-400" : "bg-rose-500"}`}
              style={{ width: `${healthPct}%` }} />
          </div>
        </div>
      )}

      {/* Row 2: Pie chart + Bar chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Donut — Phase distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-slate-700 mb-4">Cluster Phase Distribution</h2>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-slate-400 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={PHASE_COLOR[entry.name] ?? PHASE_COLOR.Unknown} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v} cluster(s)`, "Count"]} />
                <Legend iconType="circle" iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar — CP & Infra ready per cluster */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-slate-700 mb-4">Control Plane & Infrastructure Readiness</h2>
          {barData.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-slate-400 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 1]} ticks={[0, 1]} tickFormatter={v => v === 1 ? "✓" : "✗"} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => v === 1 ? "Ready" : "Not Ready"} />
                <Legend iconType="circle" iconSize={10} />
                <Bar dataKey="Control Plane"    fill="#10b981" radius={[4,4,0,0]} maxBarSize={32} />
                <Bar dataKey="Infrastructure"   fill="#3b82f6" radius={[4,4,0,0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 3: Area chart + Live event feed */}
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
                  <linearGradient id="gAdded"    x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                  <linearGradient id="gModified" x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
                  <linearGradient id="gDeleted"  x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
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
