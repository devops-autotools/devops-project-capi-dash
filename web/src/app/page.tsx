"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import {
  Server, CheckCircle2, AlertCircle, Clock, RefreshCw,
  Plus, Cpu, Activity, ExternalLink, Wifi, WifiOff,
  AlertTriangle, Circle,
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

interface ClusterEvent {
  time: string
  clusterName: string
  namespace: string
  eventType: string
  phase: string
}

function PhaseDot({ phase }: { phase: string }) {
  if (phase === 'Provisioned') return <Circle size={10} className="fill-emerald-500 text-emerald-500" />
  if (phase === 'Failed')      return <Circle size={10} className="fill-rose-500 text-rose-500" />
  if (phase === 'Deleting')    return <Circle size={10} className="fill-amber-400 text-amber-400" />
  return <Circle size={10} className="fill-blue-400 text-blue-400 animate-pulse" />
}

function ClusterCard({ cluster }: { cluster: Cluster }) {
  const isHealthy   = cluster.phase === 'Provisioned'
  const isFailed    = cluster.phase === 'Failed'
  const isDeleting  = cluster.phase === 'Deleting'

  const borderColor = isHealthy  ? 'border-emerald-200' :
                      isFailed   ? 'border-rose-200'    :
                      isDeleting ? 'border-amber-200'   : 'border-blue-200'

  const headerBg    = isHealthy  ? 'bg-emerald-50'  :
                      isFailed   ? 'bg-rose-50'      :
                      isDeleting ? 'bg-amber-50'     : 'bg-blue-50'

  return (
    <div className={`bg-white rounded-xl border-2 ${borderColor} shadow-sm overflow-hidden flex flex-col`}>
      {/* Card header */}
      <div className={`${headerBg} px-5 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-2 min-w-0">
          <PhaseDot phase={cluster.phase} />
          <p className="font-bold text-slate-900 truncate">{cluster.name}</p>
        </div>
        <Link
          href={`/clusters/${cluster.namespace}/${cluster.name}`}
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-md transition-colors flex-shrink-0"
          title="View detail"
        >
          <ExternalLink size={15} />
        </Link>
      </div>

      {/* Status rows */}
      <div className="px-5 py-4 space-y-3 flex-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 flex items-center gap-1.5"><Server size={13} /> Control Plane</span>
          {cluster.controlPlaneReady
            ? <span className="flex items-center gap-1 text-emerald-600 font-semibold text-xs"><CheckCircle2 size={13} /> Ready</span>
            : <span className="flex items-center gap-1 text-amber-600 font-semibold text-xs"><Clock size={13} className="animate-spin" /> Pending</span>}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 flex items-center gap-1.5"><Cpu size={13} /> Infrastructure</span>
          {cluster.infrastructureReady
            ? <span className="flex items-center gap-1 text-emerald-600 font-semibold text-xs"><CheckCircle2 size={13} /> Ready</span>
            : <span className="flex items-center gap-1 text-amber-600 font-semibold text-xs"><Clock size={13} className="animate-spin" /> Pending</span>}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 flex items-center gap-1.5"><Activity size={13} /> Provider</span>
          <span className="text-xs font-mono text-slate-600">{cluster.infrastructure || 'OpenStack'}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-400 font-mono">{cluster.namespace}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          isHealthy  ? 'bg-emerald-100 text-emerald-700' :
          isFailed   ? 'bg-rose-100 text-rose-700'       :
          isDeleting ? 'bg-amber-100 text-amber-700'     :
          'bg-blue-100 text-blue-700'
        }`}>{cluster.phase || 'Unknown'}</span>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [events, setEvents]     = useState<ClusterEvent[]>([])
  const [loading, setLoading]   = useState(true)
  const [sseOk, setSseOk]       = useState(false)
  const eventsRef               = useRef<HTMLDivElement>(null)

  const fetchClusters = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/clusters')
      if (res.ok) setClusters(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClusters()

    const es = new EventSource('/api/v1/clusters/events')

    es.onopen = () => setSseOk(true)

    es.onmessage = (e) => {
      const data = JSON.parse(e.data)
      // Cập nhật cluster list real-time
      setClusters(prev => {
        const idx = prev.findIndex(c => c.name === data.name && c.namespace === data.namespace)
        if (data.eventType === 'DELETED') return prev.filter((_, i) => i !== idx)
        if (idx > -1) { const next = [...prev]; next[idx] = data; return next }
        return [data, ...prev]
      })
      // Push vào event feed
      setEvents(prev => [{
        time:        new Date().toLocaleTimeString(),
        clusterName: data.name,
        namespace:   data.namespace,
        eventType:   data.eventType,
        phase:       data.phase,
      }, ...prev].slice(0, 30)) // giữ tối đa 30 events
    }

    es.onerror = () => setSseOk(false)

    return () => es.close()
  }, [])

  // Scroll event feed xuống khi có event mới
  useEffect(() => {
    if (eventsRef.current) eventsRef.current.scrollTop = 0
  }, [events])

  const total       = clusters.length
  const healthy     = clusters.filter(c => c.phase === 'Provisioned').length
  const provisioning= clusters.filter(c => ['Provisioning', 'Scaling'].includes(c.phase)).length
  const failed      = clusters.filter(c => c.phase === 'Failed').length
  const healthPct   = total > 0 ? Math.round((healthy / total) * 100) : 0

  const statCards = [
    { label: 'Total',        value: total,        icon: Server,       color: 'text-blue-600',   bg: 'bg-blue-50'   },
    { label: 'Healthy',      value: healthy,       icon: CheckCircle2, color: 'text-emerald-600',bg: 'bg-emerald-50'},
    { label: 'Provisioning', value: provisioning,  icon: Clock,        color: 'text-blue-500',   bg: 'bg-blue-50'   },
    { label: 'Failed',       value: failed,        icon: AlertCircle,  color: 'text-rose-600',   bg: 'bg-rose-50'   },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitoring Overview</h1>
          <p className="text-slate-500 mt-1">Real-time health status of all workload clusters.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${sseOk ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-slate-400 border-slate-200 bg-slate-50'}`}>
            {sseOk ? <Wifi size={12} /> : <WifiOff size={12} />}
            {sseOk ? 'Live' : 'Connecting...'}
          </span>
          <button onClick={fetchClusters} className="p-2 text-slate-500 hover:bg-white border rounded-lg transition-colors">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link href="/clusters/create"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all">
            <Plus size={16} /> New Cluster
          </Link>
        </div>
      </div>

      {/* Stat cards + health bar */}
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
            <span className="text-sm font-medium text-slate-600">Overall Cluster Health</span>
            <span className={`text-sm font-bold ${healthPct === 100 ? 'text-emerald-600' : healthPct > 50 ? 'text-amber-600' : 'text-rose-600'}`}>{healthPct}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${healthPct === 100 ? 'bg-emerald-500' : healthPct > 50 ? 'bg-amber-400' : 'bg-rose-500'}`}
              style={{ width: `${healthPct}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">{healthy}/{total} clusters healthy</p>
        </div>
      )}

      {/* Main content: cluster cards + event feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Cluster cards — chiếm 2/3 */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-slate-700 flex items-center gap-2">
            <Server size={16} /> Clusters
          </h2>
          {loading && clusters.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <RefreshCw size={28} className="animate-spin mr-3" /> Loading clusters...
            </div>
          ) : clusters.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 py-16 text-center text-slate-400">
              <Server size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No clusters found</p>
              <Link href="/clusters/create" className="mt-3 inline-flex items-center gap-1 text-blue-600 text-sm hover:underline">
                <Plus size={14} /> Create your first cluster
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {clusters.map(c => <ClusterCard key={`${c.namespace}/${c.name}`} cluster={c} />)}
            </div>
          )}
        </div>

        {/* Event feed — chiếm 1/3 */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-700 flex items-center gap-2">
            <Activity size={16} /> Live Events
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div ref={eventsRef} className="divide-y divide-slate-50 max-h-[520px] overflow-y-auto">
              {events.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <Activity size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Waiting for events...</p>
                </div>
              ) : events.map((ev, i) => (
                <div key={i} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-slate-800 truncate">{ev.clusterName}</span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                      ev.eventType === 'ADDED'    ? 'bg-blue-100 text-blue-700'    :
                      ev.eventType === 'DELETED'  ? 'bg-rose-100 text-rose-700'   :
                      'bg-amber-100 text-amber-700'
                    }`}>{ev.eventType}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-slate-500 font-mono">{ev.namespace}</span>
                    <span className="text-xs text-slate-400">{ev.time}</span>
                  </div>
                  {ev.phase && (
                    <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <AlertTriangle size={10} /> {ev.phase}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
