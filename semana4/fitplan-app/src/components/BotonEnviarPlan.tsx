'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function BotonEnviarPlan({
  clienteId,
  nombreCliente,
  email,
  bloqueado = false,
  motivoBloqueo,
  yaEnviadoAntes = false,
}: {
  clienteId: string
  nombreCliente: string
  email?: string | null
  bloqueado?: boolean
  motivoBloqueo?: string
  yaEnviadoAntes?: boolean
}) {
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [notificarCambio, setNotificarCambio] = useState(false)

  const sinEmail = !email

  async function enviarPlan() {
    setEnviando(true)
    try {
      const res = await fetch('/api/enviar-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId,
          notificarCambio: yaEnviadoAntes ? notificarCambio : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setEnviado(true)
      setTimeout(() => setEnviado(false), 4000)
    } catch (err) {
      alert('Error al enviar: ' + (err as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  if (bloqueado) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button
          disabled
          style={{
            background: '#E8463A',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            padding: '8px 14px',
            fontSize: 13,
            opacity: 0.4,
            cursor: 'not-allowed',
          }}
        >
          {yaEnviadoAntes ? `Reenviar a ${nombreCliente}` : `Enviar a ${nombreCliente}`}
        </button>
        <p style={{ fontSize: 12, color: '#f5a623' }}>
          {motivoBloqueo ||
            'Aprueba el plan y regenera el guión y el audio antes de enviar.'}
        </p>
      </div>
    )
  }

  if (sinEmail) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button
          disabled
          style={{
            background: '#E8463A',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            padding: '8px 14px',
            fontSize: 13,
            opacity: 0.4,
            cursor: 'not-allowed',
          }}
        >
          {yaEnviadoAntes ? `Reenviar a ${nombreCliente}` : `Enviar a ${nombreCliente}`}
        </button>
        <p style={{ fontSize: 12, color: '#f5a623' }}>
          Este cliente no tiene email guardado.{' '}
          <Link href={`/clientes/${clienteId}/editar`} style={{ textDecoration: 'underline' }}>
            Añádelo en su perfil
          </Link>{' '}
          antes de enviar.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <p style={{ fontSize: 12, color: '#9ca3af' }}>Se enviará a: {email}</p>
      {yaEnviadoAntes && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9ca3af' }}>
          <input
            type="checkbox"
            checked={notificarCambio}
            onChange={(e) => setNotificarCambio(e.target.checked)}
          />
          Notificar al cliente por email de que hubo un cambio
        </label>
      )}
      <button
        onClick={enviarPlan}
        disabled={enviando}
        style={{
          background: enviado ? '#3ecf8e' : '#E8463A',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          padding: '8px 14px',
          fontSize: 13,
          cursor: enviando ? 'default' : 'pointer',
        }}
      >
        {enviando
          ? 'Enviando…'
          : enviado
          ? '✓ Enviado'
          : yaEnviadoAntes
          ? `Reenviar a ${nombreCliente}`
          : `Enviar a ${nombreCliente}`}
      </button>
    </div>
  )
}
