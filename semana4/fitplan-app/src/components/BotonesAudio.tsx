'use client'

import { useState } from 'react'

interface BotonesAudioProps {
  clienteId: number
  audioStatus: string | null
  audioUrl: string | null
  linkCliente: string | null
  onAudioGenerado?: (audioUrl: string, linkToken: string) => void
}

export default function BotonesAudio({
  clienteId,
  audioStatus,
  audioUrl,
  linkCliente,
  onAudioGenerado,
}: BotonesAudioProps) {
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [audioLocal, setAudioLocal] = useState(audioUrl)
  const [linkLocal, setLinkLocal] = useState(linkCliente)
  const [linkCopiado, setLinkCopiado] = useState(false)

  const generarAudio = async () => {
    setCargando(true)
    setError('')
    try {
      const res = await fetch('/api/generar-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAudioLocal(data.audio_url)
      setLinkLocal(data.link_token)
      onAudioGenerado?.(data.audio_url, data.link_token)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setCargando(false)
    }
  }

  const copiarLink = () => {
    if (!linkLocal) return
    const url = `${window.location.origin}/plan/${linkLocal}`
    navigator.clipboard.writeText(url)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 2000)
  }

  const estadoLabel: Record<string, string> = {
    pendiente: '⏳ Pendiente',
    completado: '✅ Audio listo',
    reproducido: '👂 Reproducido por el cliente',
  }

  return (
    <div className="mt-3 space-y-2">
      {audioStatus && (
        <p className="text-xs text-gray-500">
          Audio: {estadoLabel[audioStatus] || audioStatus}
        </p>
      )}

      {audioLocal && (
        <audio controls src={audioLocal} className="w-full h-8" preload="none" />
      )}

      <button
        onClick={generarAudio}
        disabled={cargando}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition"
      >
        {cargando
          ? '⏳ Generando audio...'
          : audioLocal
          ? '🔄 Regenerar audio'
          : '🎙 Generar audio'}
      </button>

      {linkLocal && (
        <div className="flex items-center gap-2">
          <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded truncate flex-1">
            {typeof window !== 'undefined'
              ? `${window.location.origin}/plan/${linkLocal}`
              : `/plan/${linkLocal}`}
          </code>
          <button
            onClick={copiarLink}
            className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 transition whitespace-nowrap"
          >
            {linkCopiado ? '✅ Copiado' : '📋 Copiar'}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}