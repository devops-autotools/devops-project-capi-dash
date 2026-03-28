"use client"

import { Settings, User, Bell, Shield, Database, Save } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-1">Configure your dashboard preferences and system connection.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-1">
          {[
            { name: 'General', icon: Settings, active: true },
            { name: 'Profile', icon: User, active: false },
            { name: 'Notifications', icon: Bell, active: false },
            { name: 'Security', icon: Shield, active: false },
            { name: 'System', icon: Database, active: false },
          ].map((item) => (
            <button
              key={item.name}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${item.active ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <item.icon size={18} />
              {item.name}
            </button>
          ))}
        </div>

        <div className="md:col-span-3 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold">General Configuration</h2>
              <p className="text-sm text-slate-500">Manage basic dashboard settings.</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Dashboard Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500/20" 
                  defaultValue="VNPAY CAPI Dashboard"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Management Cluster URL</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500/20" 
                  defaultValue="https://kubernetes.default.svc"
                  disabled
                />
                <p className="text-[10px] text-slate-400">Detected automatically from environment.</p>
              </div>
              <div className="flex items-center gap-4 py-2">
                <div className="flex items-center h-5">
                  <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" defaultChecked />
                </div>
                <div className="text-sm">
                  <label className="font-medium text-slate-700">Enable Dark Mode (Beta)</label>
                  <p className="text-slate-500">Switch between light and dark interface.</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t flex justify-end">
              <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all">
                <Save size={18} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
