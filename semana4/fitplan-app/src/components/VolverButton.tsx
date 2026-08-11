'use client'

import { useRouter } from 'next/navigation'

export default function VolverButton() {
  const router = useRouter()

  const volver = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/clientes')
    }
  }

  return (
    <button
      onClick={volver}
      className="text-xs text-gray-400 hover:text-white transition"
    >
      ← Volver a clientes
    </button>
  )
}
