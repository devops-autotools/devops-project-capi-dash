"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Server, 
  Settings, 
  ShieldCheck, 
  Activity,
  Layers
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Workload Clusters', href: '/clusters', icon: Server },
  { name: 'Infrastructure', href: '/infrastructure', icon: Layers },
  { name: 'Security Groups', href: '/security', icon: ShieldCheck },
  { name: 'System Logs', href: '/logs', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 border-r bg-slate-900 text-slate-300 min-h-screen">
      <div className="flex items-center h-16 px-6 border-b border-slate-800">
        <div className="font-bold text-white text-xl flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">C</div>
          CAPI Dash
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                isActive 
                  ? "bg-blue-600 text-white" 
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon size={20} />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800 rounded-lg p-3 text-xs">
          <p className="text-slate-400">Environment</p>
          <p className="text-white font-mono mt-1 uppercase">Management Cluster</p>
        </div>
      </div>
    </div>
  )
}
