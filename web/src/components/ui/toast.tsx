"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, XCircle, X } from "lucide-react"

export type ToastType = "success" | "error"

export interface Toast {
  id: number
  type: ToastType
  message: string
}

interface ToastProps {
  toasts: Toast[]
  onRemove: (id: number) => void
}

export function ToastContainer({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onRemove])

  return (
    <div className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium min-w-72 max-w-sm animate-in slide-in-from-bottom-2 ${
      toast.type === "success"
        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
        : "bg-rose-50 border-rose-200 text-rose-800"
    }`}>
      {toast.type === "success"
        ? <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
        : <XCircle size={18} className="text-rose-600 flex-shrink-0" />}
      <span className="flex-1">{toast.message}</span>
      <button onClick={() => onRemove(toast.id)}
        className="opacity-60 hover:opacity-100 transition-opacity flex-shrink-0">
        <X size={15} />
      </button>
    </div>
  )
}

// Hook để dùng toast dễ dàng
let toastId = 0
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (message: string, type: ToastType = "success") => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, type, message }])
  }

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return { toasts, addToast, removeToast }
}
