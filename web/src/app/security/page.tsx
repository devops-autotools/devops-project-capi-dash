"use client"

import { useEffect, useState } from "react"
import { 
  ShieldCheck, 
  RefreshCw, 
  Search,
  Lock,
  Unlock,
  Eye
} from "lucide-react"

interface SecGroup {
  id: string
  name: string
  description: string
  tenant_id: string
  security_group_rules: any[]
}

export default function SecurityPage() {
  const [groups, setGroups] = useState<SecGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/os/security-groups')
      if (res.ok) setGroups(await res.json())
    } catch (err) {
      console.error("Failed to fetch security groups", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredGroups = groups.filter(g => 
    (g.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Groups</h1>
          <p className="text-slate-500 mt-1">Manage firewall rules for your OpenStack infrastructure.</p>
        </div>
        <button 
          onClick={fetchData}
          className="p-2 text-slate-500 hover:bg-white border rounded-lg transition-colors"
        >
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search security groups..." 
            className="w-full pl-9 pr-4 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold flex items-center gap-1">
            <Lock size={12} /> {groups.length} Groups
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Rules Count</th>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                    Loading security groups...
                  </td>
                </tr>
              ) : filteredGroups.map((group) => (
                <tr key={group.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="text-blue-600" size={16} />
                      <span className="font-semibold text-slate-900">{group.name || 'default'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 truncate max-w-xs">{group.description || 'No description'}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs font-bold">
                      {group.security_group_rules?.length || 0} Rules
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-[10px] text-slate-400">{group.id}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filteredGroups.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">No security groups found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
