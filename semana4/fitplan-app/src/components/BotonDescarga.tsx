'use client'

interface BotonDescargaProps {
  listaCompra: string[]
  linkToken: string
  color?: string
}

export default function BotonDescarga({
  listaCompra,
  linkToken,
  color = '#E8463A',
}: BotonDescargaProps) {
  const handleDescarga = async () => {
    await fetch('/api/tracking/descarga', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link_token: linkToken }),
    })

    const contenido = [
      'LISTA DE LA COMPRA',
      '==================',
      '',
      ...listaCompra.map((item, i) => `${i + 1}. ${item}`),
      '',
      'Generado con FitVideoAI',
    ].join('\n')

    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lista_compra.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!listaCompra || listaCompra.length === 0) return null

  return (
    <button
      onClick={handleDescarga}
      className="mt-5 w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
      style={{ backgroundColor: color }}
    >
      📥 Descargar lista de la compra ({listaCompra.length} productos)
    </button>
  )
}
