"use client"

import { useEffect, useRef, useCallback } from "react"

interface NodeTerminalProps {
  namespace: string
  clusterName: string
  nodeName: string
  onClose: () => void
}

export default function NodeTerminal({ namespace, clusterName, nodeName, onClose }: NodeTerminalProps) {
  const termRef   = useRef<HTMLDivElement>(null)
  const xtermRef  = useRef<any>(null)
  const wsRef     = useRef<WebSocket | null>(null)
  const fitRef    = useRef<any>(null)

  const initTerminal = useCallback(async () => {
    if (!termRef.current) return

    // Dynamic import để tránh SSR issues
    const { Terminal } = await import("xterm")
    const { FitAddon }  = await import("xterm-addon-fit")
    await import("xterm/css/xterm.css")

    const term = new Terminal({
      cursorBlink:  true,
      fontSize:     13,
      fontFamily:   "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      theme: {
        background:  "#0f172a",
        foreground:  "#e2e8f0",
        cursor:      "#38bdf8",
        selectionBackground: "#1e40af55",
        black:   "#1e293b", red:     "#ef4444", green:  "#22c55e", yellow: "#eab308",
        blue:    "#3b82f6", magenta: "#a855f7", cyan:   "#06b6d4", white:  "#f1f5f9",
        brightBlack:  "#475569", brightRed:  "#f87171", brightGreen: "#4ade80",
        brightYellow: "#facc15", brightBlue: "#60a5fa", brightMagenta: "#c084fc",
        brightCyan:   "#22d3ee", brightWhite:"#ffffff",
      },
      scrollback:    5000,
      convertEol:    true,
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(termRef.current)
    fitAddon.fit()
    term.focus()

    xtermRef.current = term
    fitRef.current   = fitAddon

    // WebSocket đi qua cùng host:port với browser
    // Không hardcode port — dùng window.location.port để tương thích cả local và K8s
    const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:"
    const wsHost  = window.location.host   // host:port hoặc chỉ host nếu dùng 80/443
    const wsUrl   = `${wsProto}//${wsHost}/api/v1/clusters/${namespace}/${clusterName}/machines/${encodeURIComponent(nodeName)}/shell`

    term.write(`\x1b[36mConnecting to \x1b[1m${nodeName}\x1b[0m\x1b[36m...\x1b[0m\r\n`)

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws
    ws.binaryType = "arraybuffer"

    ws.onopen = () => {
      term.write(`\x1b[32m✓ Connected\x1b[0m\r\n\r\n`)
    }

    ws.onmessage = (e) => {
      const data = e.data instanceof ArrayBuffer
        ? new Uint8Array(e.data)
        : e.data
      term.write(data)
    }

    ws.onerror = () => {
      term.write(`\r\n\x1b[31m✗ Connection error\x1b[0m\r\n`)
    }

    ws.onclose = (e) => {
      term.write(`\r\n\x1b[33m[Disconnected: ${e.reason || "session closed"}]\x1b[0m\r\n`)
    }

    // Terminal input → WebSocket
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(data)
    })

    // Resize handler
    const handleResize = () => {
      fitAddon.fit()
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }))
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [namespace, clusterName, nodeName])

  useEffect(() => {
    const cleanup = initTerminal()
    return () => {
      cleanup.then(fn => fn?.())
      wsRef.current?.close()
      xtermRef.current?.dispose()
    }
  }, [initTerminal])

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden"
        style={{ height: "70vh" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-slate-800 px-5 py-3 flex items-center justify-between flex-shrink-0 border-b border-slate-700">
          <div className="flex items-center gap-3">
            {/* Traffic lights */}
            <div className="flex gap-1.5">
              <button onClick={onClose} className="w-3 h-3 rounded-full bg-rose-500 hover:bg-rose-400 transition-colors" title="Close"/>
              <div className="w-3 h-3 rounded-full bg-amber-400"/>
              <div className="w-3 h-3 rounded-full bg-emerald-500"/>
            </div>
            <span className="text-slate-300 text-sm font-mono">
              kubectl node-shell <span className="text-emerald-400 font-semibold">{nodeName}</span>
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono">{clusterName} / {namespace}</span>
        </div>
        {/* Terminal */}
        <div ref={termRef} className="flex-1 p-2 overflow-hidden" />
      </div>
    </div>
  )
}
