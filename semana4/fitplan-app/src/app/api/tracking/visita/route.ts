import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  const { link_token } = await req.json()

  if (!link_token) {
    return NextResponse.json({ error: 'link_token requerido' }, { status: 400 })
  }

  const { error } = await supabase.rpc('incrementar_visita', {
    p_link_token: link_token,
  })

  if (error) {
    const { data: cliente } = await supabase
      .from('clientes')
      .select('link_visto_count')
      .eq('link_cliente', link_token)
      .single()

    await supabase
      .from('clientes')
      .update({
        link_visto_count: (cliente?.link_visto_count || 0) + 1,
        link_visto_at: new Date().toISOString(),
      })
      .eq('link_cliente', link_token)
  }

  return NextResponse.json({ ok: true })
}
