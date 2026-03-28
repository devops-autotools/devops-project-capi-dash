"use client"

import { useEffect, useState } from "react"
import { 
  Layers, 
  Cpu, 
  HardDrive, 
  Network as NetworkIcon, 
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle
} from "lucide-react"

export default function InfrastructurePage() {
  const [flavors, setFlavors] = useState<any[]>([])
  const [images, setImages] = useState<any[]>([])
  const [networks, setNetworks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'flavors' | 'images' | 'networks'>('flavors')
  const [searchTerm, setSearchTerm] = useState("")

  const fetchData = async () => {
    setLoading(true)
    try {
      const [fRes, iRes, nRes] = await Promise.all([
        fetch('/api/v1/os/flavors'),
        fetch('/api/v1/os/images'),
        fetch('/api/v1/os/networks')
      ])
      if (fRes.ok) setFlavors(await fRes.json())
      if (iRes.ok) setImages(await iRes.json())
      if (nRes.ok) setNetworks(await nRes.json())
    } catch (err) {
      console.error("Failed to fetch infrastructure metadata", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredData = () => {
    let data = []
    if (activeTab === 'flavors') data = flavors
    else if (activeTab === 'images') data = images
    else data = networks

    if (!searchTerm) return data
    return data.filter((item: any) => 
      (item.name || item.id).toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Infrastructure Resources</h1>
          <p className="text-slate-500 mt-1">Available OpenStack resources for your workload clusters.</p>
        </div>
        <button 
          onClick={fetchData}
          className="p-2 text-slate-500 hover:bg-white border rounded-lg transition-colors"
        >
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex">
          <button 
            onClick={() => setActiveTab('flavors')}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${activeTab === 'flavors' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <div className="flex items-center gap-2">
              <Cpu size={16} /> Flavors
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('images')}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${activeTab === 'images' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <div className="flex items-center gap-2">
              <HardDrive size={16} /> Images
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('networks')}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${activeTab === 'networks' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <div className="flex items-center gap-2">
              <NetworkIcon size={16} /> Networks
            </div>
          </button>
        </div>

        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search resources..." 
            className="pl-9 pr-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 outline-none w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <RefreshCw size={32} className="animate-spin mb-4" />
            <p>Loading infrastructure resources...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                {activeTab === 'flavors' && (
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">VCPUs</th>
                    <th className="px-6 py-3">RAM (GB)</th>
                    <th className="px-6 py-3">Disk (GB)</th>
                    <th className="px-6 py-3">ID</th>
                  </tr>
                )}
                {activeTab === 'images' && (
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Min RAM</th>
                    <th className="px-6 py-3">Min Disk</th>
                    <th className="px-6 py-3">Created</th>
                  </tr>
                )}
                {activeTab === 'networks' && (
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">External</th>
                    <th className="px-6 py-3">Shared</th>
                    <th className="px-6 py-3">ID</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData().map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    {activeTab === 'flavors' && (
                      <>
                        <td className="px-6 py-4 font-semibold text-slate-900">{item.name}</td>
                        <td className="px-6 py-4">{item.vcpus}</td>
                        <td className="px-6 py-4">{item.ram / 1024} GB</td>
                        <td className="px-6 py-4">{item.disk} GB</td>
                        <td className="px-6 py-4 font-mono text-[10px] text-slate-400">{item.id}</td>
                      </>
                    )}
                    {activeTab === 'images' && (
                      <>
                        <td className="px-6 py-4 font-semibold text-slate-900">{item.name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">{item.minRam} MB</td>
                        <td className="px-6 py-4">{item.minDisk} GB</td>
                        <td className="px-6 py-4 text-slate-500">{new Date(item.created).toLocaleDateString()}</td>
                      </>
                    )}
                    {activeTab === 'networks' && (
                      <>
                        <td className="px-6 py-4 font-semibold text-slate-900">{item.name || 'Unnamed'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {item['router:external'] ? <CheckCircle2 className="text-emerald-500" size={18} /> : <XCircle className="text-slate-300" size={18} />}
                        </td>
                        <td className="px-6 py-4">
                          {item.shared ? <CheckCircle2 className="text-emerald-500" size={18} /> : <XCircle className="text-slate-300" size={18} />}
                        </td>
                        <td className="px-6 py-4 font-mono text-[10px] text-slate-400">{item.id}</td>
                      </>
                    )}
                  </tr>
                ))}
                {filteredData().length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400">No resources found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
