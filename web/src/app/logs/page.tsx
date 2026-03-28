"use client"

import { useEffect, useState, useRef } from "react"
import { 
  Activity, 
  Terminal, 
  RefreshCw, 
  Search,
  ChevronRight,
  Download,
  Trash2
} from "lucide-react"

interface Pod {
  name: string
  namespace: string
  status: string
  node: string
}

export default function LogsPage() {
  const [pods, setPods] = useState<Pod[]>([])
  const [selectedPod, setSelectedPod] = useState<Pod | null>(null)
  const [logs, setLogs] = useState("")
  const [loadingPods, setLoadingPods] = useState(true)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [autoRefresh, setAutoRefresh] = useState(false)
  const scrollRef = useRef<HTMLPreElement>(null)

  const fetchPods = async () => {
    setLoadingPods(true)
    try {
      const res = await fetch('/api/v1/logs/pods')
      if (res.ok) setPods(await res.json())
    } catch (err) {
      console.error("Failed to fetch pods", err)
    } finally {
      setLoadingPods(false)
    }
  }

  const fetchLogs = async (pod: Pod) => {
    setLoadingLogs(true)
    try {
      const res = await fetch(`/api/v1/logs/${pod.namespace}/${pod.name}?tail=500`)
      if (res.ok) {
        const text = await res.text()
        setLogs(text)
      }
    } catch (err) {
      console.error("Failed to fetch logs", err)
    } finally {
      setLoadingLogs(false)
    }
  }

  useEffect(() => {
    fetchPods()
  }, [])

  useEffect(() => {
    if (selectedPod) {
      fetchLogs(selectedPod)
    }
  }, [selectedPod])

  useEffect(() => {
    if (autoRefresh && selectedPod) {
      const interval = setInterval(() => fetchLogs(selectedPod), 5000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, selectedPod])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  const filteredPods = pods.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.namespace.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
          <p className="text-slate-500 mt-1">Monitor Cluster API controller logs in real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white border px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-50">
            <input 
              type="checkbox" 
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            Auto-refresh (5s)
          </label>
          <button 
            onClick={fetchPods}
            className="p-2 text-slate-500 hover:bg-white border rounded-lg transition-colors"
            title="Refresh pods list"
          >
            <RefreshCw size={20} className={loadingPods ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Pods List */}
        <div className="w-80 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search pods..." 
                className="w-full pl-9 pr-4 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingPods ? (
              <div className="flex justify-center py-10">
                <RefreshCw className="animate-spin text-slate-300" size={24} />
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filteredPods.map((pod) => (
                  <button
                    key={`${pod.namespace}/${pod.name}`}
                    onClick={() => setSelectedPod(pod)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group ${selectedPod?.name === pod.name ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-bold truncate ${selectedPod?.name === pod.name ? 'text-blue-700' : 'text-slate-900'}`}>{pod.name}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{pod.namespace}</p>
                      <span className={`inline-block mt-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${pod.status === 'Running' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {pod.status}
                      </span>
                    </div>
                    <ChevronRight size={16} className={`text-slate-300 group-hover:text-blue-500 transition-colors ${selectedPod?.name === pod.name ? 'text-blue-500' : ''}`} />
                  </button>
                ))}
                {filteredPods.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-sm">No pods found.</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Logs Viewer */}
        <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 shadow-xl flex flex-col overflow-hidden relative group">
          <div className="bg-slate-800/50 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal className="text-emerald-500" size={18} />
              <h2 className="text-sm font-mono text-slate-300">
                {selectedPod ? `${selectedPod.namespace}/${selectedPod.name}` : 'Select a pod to view logs'}
              </h2>
            </div>
            {selectedPod && (
              <div className="flex items-center gap-2">
                {loadingLogs && <RefreshCw className="animate-spin text-slate-500" size={14} />}
                <button 
                  onClick={() => fetchLogs(selectedPod)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                  title="Reload logs"
                >
                  <RefreshCw size={16} />
                </button>
                <button 
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                  title="Download logs"
                >
                  <Download size={16} />
                </button>
                <button 
                  onClick={() => setLogs("")}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded transition-colors"
                  title="Clear console"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
          
          <pre 
            ref={scrollRef}
            className="flex-1 p-6 text-emerald-400 font-mono text-xs overflow-auto selection:bg-emerald-500/30 whitespace-pre-wrap"
          >
            {logs || (selectedPod ? 'Fetching logs...' : 'Waiting for selection...')}
          </pre>

          {!selectedPod && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 bg-slate-900/50 backdrop-blur-[1px]">
              <Activity size={48} className="mb-4 opacity-20" />
              <p className="font-medium text-lg">System Logs Terminal</p>
              <p className="text-sm opacity-60">Select a controller pod from the sidebar to start monitoring.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
