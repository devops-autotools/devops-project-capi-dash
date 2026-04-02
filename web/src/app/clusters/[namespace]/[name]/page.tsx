"use client"

import { useEffect, useState, use, useCallback } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import {
  ArrowLeft, RefreshCw, CheckCircle2, Clock, AlertCircle,
  Activity, Code, Info, Server, Cpu, AlertTriangle, XCircle, Terminal,
} from "lucide-react"

const NodeTerminal = dynamic(() => import("@/components/ui/NodeTerminal"), { ssr: false })

interface Condition { type: string; status: string; reason?: string; message?: string; lastTransitionTime: string }
interface ClusterDetail {
  name: string; namespace: string; phase: string; status: string
  infrastructure: string; controlPlaneReady: boolean; infrastructureReady: boolean
  createdAt: string; conditions: Condition[]; raw: any
}
interface Machine {
  name: string; namespace: string; clusterName: string; phase: string
  version: string; nodeName: string; infrastructure: string
  bootstrapReady: boolean; infrastructureReady: boolean
  failureReason: string; failureMessage: string; createdAt: string
}

function PhaseBadge({ phase }: { phase: string }) {
  const cfg: Record<string, string> = {
    Running: "bg-emerald-100 text-emerald-800", Provisioned: "bg-emerald-100 text-emerald-800",
    Provisioning: "bg-blue-100 text-blue-800", Deleting: "bg-amber-100 text-amber-800",
    Failed: "bg-rose-100 text-rose-800",
  }
  const icon = phase === "Running" || phase === "Provisioned" ? <CheckCircle2 size={11}/>
    : phase === "Failed" ? <XCircle size={11}/>
    : <Clock size={11} className={phase === "Provisioning" ? "animate-spin" : ""}/>
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg[phase] ?? "bg-slate-100 text-slate-600"}`}>
      {icon} {phase || "Unknown"}
    </span>
  )
}

function ConditionBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
      status === "True" ? "bg-emerald-100 text-emerald-700"
      : status === "False" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"}`}>
      {status === "True" ? <CheckCircle2 size={10}/> : status === "False" ? <XCircle size={10}/> : <Clock size={10}/>}
      {status}
    </span>
  )
}

export default function ClusterDetailPage({ params }: { params: Promise<{ namespace: string; name: string }> }) {
  const { namespace, name } = use(params)
  const [cluster,   setCluster]  = useState<ClusterDetail | null>(null)
  const [machines,  setMachines] = useState<Machine[]>([])
  const [loading,   setLoading]  = useState(true)
  const [activeTab, setActiveTab]= useState<'overview'|'machines'|'conditions'|'yaml'>('overview')
  const [shellNode, setShellNode]= useState<Machine | null>(null)

  const fetchDetail = useCallback(async () => {
    setLoading(true)
    try {
      const [cRes, mRes] = await Promise.all([
        fetch(`/api/v1/clusters/${namespace}/${name}`),
        fetch(`/api/v1/clusters/${namespace}/${name}/machines`),
      ])
      if (cRes.ok) setCluster(await cRes.json())
      if (mRes.ok) setMachines(await mRes.json())
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }, [namespace, name])

  useEffect(() => { fetchDetail() }, [fetchDetail])
  useEffect(() => {
    if (machines.length > 0 && machines.every(m => m.phase === "Running"))
      console.log(`✅ Cluster "${name}" — All ${machines.length} machine(s) Provisioned`)
  }, [machines, name])

  if (loading && !cluster) return <div className="flex items-center justify-center min-h-[400px]"><RefreshCw className="animate-spin text-blue-600" size={32}/></div>
  if (!cluster) return <div className="text-center py-20"><h2 className="text-2xl font-bold">Cluster Not Found</h2><Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">Back</Link></div>

  const runningMachines = machines.filter(m => m.phase === "Running").length
  const failedMachines  = machines.filter(m => m.phase === "Failed").length
  const tabs = [
    { key: 'overview',   label: 'Overview',   icon: Info },
    { key: 'machines',   label: 'Machines',   icon: Cpu,     badge: machines.length },
    { key: 'conditions', label: 'Conditions', icon: Activity },
    { key: 'yaml',       label: 'YAML',       icon: Code },
  ] as const

  return (
    <div className="space-y-6">
      {/* Node Terminal Modal */}
      {shellNode && (
        <NodeTerminal
          namespace={namespace}
          clusterName={name}
          nodeName={shellNode.nodeName || shellNode.name}
          onClose={() => setShellNode(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-white rounded-full border transition-colors"><ArrowLeft size={20}/></Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{cluster.name}</h1>
              <PhaseBadge phase={cluster.phase}/>
            </div>
            <p className="text-slate-500 text-sm">ns: {cluster.namespace} • {new Date(cluster.createdAt).toLocaleString()}</p>
          </div>
        </div>
        <button onClick={fetchDetail} className="p-2 text-slate-500 hover:bg-white border rounded-lg transition-colors">
          <RefreshCw size={20} className={loading ? "animate-spin" : ""}/>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-3 font-medium text-sm border-b-2 -mb-px flex items-center gap-2 transition-colors ${
              activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <tab.icon size={16}/>{tab.label}
            {'badge' in tab && tab.badge > 0 && <span className="ml-1 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-bold">{tab.badge}</span>}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-lg">Cluster Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[{ label: "Control Plane", ready: cluster.controlPlaneReady },{ label: "Infrastructure", ready: cluster.infrastructureReady }].map(s => (
                    <div key={s.label} className="p-4 bg-slate-50 rounded-lg flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">{s.label}</span>
                      {s.ready
                        ? <span className="flex items-center gap-1 text-emerald-600 text-sm font-bold"><CheckCircle2 size={16}/> Ready</span>
                        : <span className="flex items-center gap-1 text-amber-600 text-sm font-bold"><Clock size={16} className="animate-spin"/> Pending</span>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="font-bold text-lg">Infrastructure Details</h3>
                <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Provider</span><span className="font-medium">{cluster.infrastructure || "OpenStack"}</span></div>
                <div className="flex justify-between border-b pb-2"><span className="text-slate-500">API Server</span><span className="font-medium font-mono text-xs">{cluster.raw?.spec?.controlPlaneEndpoint?.host || "N/A"}</span></div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-lg">Node Summary</h3>
              {[
                { label: "Total",   value: machines.length, color: "text-blue-600",    bg: "bg-blue-50",    icon: Cpu },
                { label: "Running", value: runningMachines, color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle2 },
                { label: "Failed",  value: failedMachines,  color: "text-rose-600",    bg: "bg-rose-50",    icon: AlertCircle },
              ].map(s => (
                <div key={s.label} className={`flex items-center justify-between p-3 ${s.bg} rounded-lg`}>
                  <span className={`text-sm font-medium flex items-center gap-2 ${s.color}`}><s.icon size={14}/>{s.label}</span>
                  <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Machines */}
        {activeTab === 'machines' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-slate-50 grid grid-cols-4 gap-4 text-sm">
              {[
                { label: "Total",        value: machines.length,  color: "text-blue-700" },
                { label: "Running",      value: runningMachines,  color: "text-emerald-700" },
                { label: "Provisioning", value: machines.filter(m => m.phase === "Provisioning").length, color: "text-indigo-600" },
                { label: "Failed",       value: failedMachines,   color: "text-rose-700" },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-slate-400 text-xs">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-slate-500 font-medium border-b">
                <tr>
                  <th className="px-6 py-3">Machine</th>
                  <th className="px-6 py-3">Phase</th>
                  <th className="px-6 py-3">Node Name</th>
                  <th className="px-6 py-3">Version</th>
                  <th className="px-6 py-3 text-center">Bootstrap</th>
                  <th className="px-6 py-3 text-center">Infra</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3 text-center">Shell</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {machines.length === 0
                  ? <tr><td colSpan={8} className="px-6 py-10 text-center text-slate-400">No machines found.</td></tr>
                  : machines.map(m => (
                    <tr key={m.name} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{m.name}</p>
                        {m.failureReason && <p className="text-xs text-rose-500 mt-0.5 flex items-center gap-1"><AlertTriangle size={10}/>{m.failureReason}</p>}
                      </td>
                      <td className="px-6 py-4"><PhaseBadge phase={m.phase}/></td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">{m.nodeName || <span className="text-slate-300">—</span>}</td>
                      <td className="px-6 py-4 font-mono text-xs">{m.version || "—"}</td>
                      <td className="px-6 py-4 text-center">{m.bootstrapReady ? <CheckCircle2 size={16} className="text-emerald-500 mx-auto"/> : <XCircle size={16} className="text-slate-300 mx-auto"/>}</td>
                      <td className="px-6 py-4 text-center">{m.infrastructureReady ? <CheckCircle2 size={16} className="text-emerald-500 mx-auto"/> : <XCircle size={16} className="text-slate-300 mx-auto"/>}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">{new Date(m.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setShellNode(m)}
                          disabled={m.phase !== "Running"}
                          title={m.phase !== "Running" ? "Machine chưa Running" : `Open shell on ${m.nodeName || m.name}`}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            m.phase === "Running"
                              ? "bg-slate-900 text-emerald-400 hover:bg-slate-700 cursor-pointer"
                              : "bg-slate-100 text-slate-400 cursor-not-allowed"
                          }`}>
                          <Terminal size={13}/>SSH
                        </button>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Conditions */}
        {activeTab === 'conditions' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                <tr><th className="px-6 py-3">Type</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Reason</th><th className="px-6 py-3">Last Transition</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cluster.conditions?.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold">{c.type}</td>
                    <td className="px-6 py-4"><ConditionBadge status={c.status}/></td>
                    <td className="px-6 py-4"><p className="font-medium text-slate-700">{c.reason || "N/A"}</p><p className="text-slate-500 text-xs mt-1">{c.message}</p></td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap text-xs">{new Date(c.lastTransitionTime).toLocaleString()}</td>
                  </tr>
                ))}
                {!cluster.conditions?.length && <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400">No conditions reported yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* YAML */}
        {activeTab === 'yaml' && (
          <div className="bg-slate-900 rounded-xl p-6 text-slate-300 font-mono text-xs overflow-auto max-h-[600px]">
            <pre>{JSON.stringify(cluster.raw, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
