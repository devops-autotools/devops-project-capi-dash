"use client"

import { useEffect, useState, useRef } from "react"
import { Terminal, RefreshCw, Search, ChevronRight, Trash2, Activity } from "lucide-react"

interface Pod {
  name: string
  namespace: string
  status: string
  node: string
}

export default function LogsPage() {
  const [pods,         setPods]         = useState<Pod[]>([])
  const [selectedPod,  setSelectedPod]  = useState<Pod | null>(null)
  const [logs,         setLogs]         = useState("")
  const [loadingPods,  setLoadingPods]  = useState(true)
  const [loadingLogs,  setLoadingLogs]  = useState(false)
  const [keyword,      setKeyword]      = useState("")
  const [autoRefresh,  setAutoRefresh]  = useState(false)
  const scrollRef = useRef<HTMLPreElement>(null)

  const fetchPods = async () => {
    setLoadingPods(true)
    try {
      const res = await fetch('/api/v1/logs/pods')
      if (res.ok) setPods(await res.json())
    } finally { setLoadingPods(false) }
  }

  const fetchLogs = async (pod: Pod) => {
    setLoadingLogs(true)
    try {
      const res = await fetch(`/api/v1/logs/${pod.namespace}/${pod.name}?tail=500`)
      if (res.ok) setLogs(await res.text())
    } finally { setLoadingLogs(false) }
  }

  useEffect(() => { fetchPods() }, [])

  // Auto-select pod đầu tiên thuộc capi-system khi pods load xong
  useEffect(() => {
    if (pods.length > 0 && !selectedPod) {
      const capiPod = pods.find(p => p.namespace === "capi-system") ?? pods[0]
      setSelectedPod(capiPod)
    }
  }, [pods])
  useEffect(() => { if (selectedPod) fetchLogs(selectedPod) }, [selectedPod])
  useEffect(() => {
    if (autoRefresh && selectedPod) {
      const t = setInterval(() => fetchLogs(selectedPod), 5000)
      return () => clearInterval(t)
    }
  }, [autoRefresh, selectedPod])
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [logs])

  // Filter log lines by keyword
  const filteredLogs = keyword.trim()
    ? logs.split("\n").filter(line => line.toLowerCase().includes(keyword.toLowerCase())).join("\n")
    : logs

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
          <p className="text-slate-500 mt-1">Monitor Cluster API controller logs in real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white border px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-50">
            <input type="checkbox" checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500" />
            Auto-refresh (5s)
          </label>
          <button onClick={fetchPods}
            className="p-2 text-slate-500 hover:bg-white border rounded-lg transition-colors">
            <RefreshCw size={20} className={loadingPods ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Pod list — no search, just click to select */}
        <div className="w-72 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center gap-2">
            <Activity size={14} className="text-blue-600" />
            <span className="text-sm font-bold text-slate-700">Controller Pods</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {loadingPods ? (
              <div className="flex justify-center py-10"><RefreshCw className="animate-spin text-slate-300" size={24} /></div>
            ) : pods.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No pods found.</div>
            ) : pods.map(pod => (
              <button key={`${pod.namespace}/${pod.name}`}
                onClick={() => setSelectedPod(pod)}
                className={`w-full text-left p-3 hover:bg-slate-50 transition-colors flex items-center justify-between group ${selectedPod?.name === pod.name ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-bold truncate ${selectedPod?.name === pod.name ? 'text-blue-700' : 'text-slate-900'}`}>{pod.name}</p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{pod.namespace}</p>
                  <span className={`inline-block mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${pod.status === 'Running' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {pod.status}
                  </span>
                </div>
                <ChevronRight size={14} className={`flex-shrink-0 text-slate-300 group-hover:text-blue-500 ${selectedPod?.name === pod.name ? 'text-blue-500' : ''}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Log viewer */}
        <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 shadow-xl flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="bg-slate-800/60 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Terminal className="text-emerald-500 flex-shrink-0" size={16} />
              <span className="text-xs font-mono text-slate-300 truncate">
                {selectedPod ? `${selectedPod.namespace}/${selectedPod.name}` : 'Select a pod'}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Keyword search */}
              {selectedPod && (
                <div className="relative">
                  <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Filter logs..."
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    className="bg-slate-700 border border-slate-600 text-slate-200 text-xs pl-6 pr-3 py-1 rounded outline-none focus:border-blue-500 w-44 placeholder:text-slate-500"
                  />
                  {keyword && (
                    <button onClick={() => setKeyword("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs">✕</button>
                  )}
                </div>
              )}
              {loadingLogs && <RefreshCw className="animate-spin text-slate-500" size={13} />}
              {selectedPod && <>
                <button onClick={() => fetchLogs(selectedPod)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded" title="Reload">
                  <RefreshCw size={14} />
                </button>
                <button onClick={() => setLogs("")}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded" title="Clear">
                  <Trash2 size={14} />
                </button>
              </>}
            </div>
          </div>

          {/* Log output */}
          <pre ref={scrollRef}
            className="flex-1 p-5 text-emerald-400 font-mono text-xs overflow-auto whitespace-pre-wrap leading-relaxed">
            {keyword && filteredLogs === ""
              ? <span className="text-slate-500">No lines matching "{keyword}"</span>
              : filteredLogs || (selectedPod ? 'Fetching logs...' : 'Loading...')}
          </pre>
        </div>
      </div>
    </div>
  )
}
