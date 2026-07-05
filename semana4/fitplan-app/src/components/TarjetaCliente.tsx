export type ClienteEstado = {
  link_cliente: string | null
  link_visto_count: number
  link_visto_at: string | null
  created_at: string
}

export function calcularEstado(cliente: ClienteEstado) {
  if (!cliente.link_cliente) {
    return { color: '#e74c3c', bg: '#3a1414', texto: 'Sin plan enviado esta semana' }
  }
  if (cliente.link_visto_count > 0) {
    const fecha = new Date(cliente.link_visto_at!).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
    return {
      color: '#3ecf8e',
      bg: '#0f2a1f',
      texto: `Vio el ${fecha} · ${cliente.link_visto_count} vez${cliente.link_visto_count === 1 ? '' : 'es'}`,
    }
  }
  const dias = Math.floor((Date.now() - new Date(cliente.created_at).getTime()) / 86400000)
  return {
    color: '#f5a623',
    bg: '#2a2214',
    texto: `No ha abierto (hace ${dias} día${dias === 1 ? '' : 's'})`,
  }
}

export function necesitaRecordatorio(cliente: ClienteEstado) {
  return Boolean(cliente.link_cliente) && !(cliente.link_visto_count > 0)
}

export default function TarjetaCliente({ cliente }: { cliente: ClienteEstado }) {
  const estado = calcularEstado(cliente)
  return (
    <span
      className="text-xs font-semibold px-3 py-1 rounded-full"
      style={{ backgroundColor: estado.bg, color: estado.color }}
    >
      {estado.texto}
    </span>
  )
}
