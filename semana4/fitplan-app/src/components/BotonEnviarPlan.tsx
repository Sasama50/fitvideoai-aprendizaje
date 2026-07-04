'use client'
import { useState } from 'react'

export default function BotonEnviarPlan({
  clienteId,
  nombreCliente,
  email,
}: {
  clienteId: string
  nombreCliente: string
  email?: string
}) {
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [emailInput, setEmailInput] = useState(email || '')
  const [mostrarInput, setMostrarInput] = useState(!email)

  async function enviarPlan() {
    if (!emailInput) {
      setMostrarInput(true)
      return
    }
    setEnviando(true)
    try {
      const res = await fetch('/api/enviar-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId, emailDestino: emailInput }),
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {mostrarInput && (
        <input
          type="email"
          placeholder="email del cliente"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #2a2a3a', fontSize: 13 }}
        />
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
        {enviando ? 'Enviando…' : enviado ? '✓ Enviado' : `Enviar a ${nombreCliente}`}
      </button>
    </div>
  )
}
