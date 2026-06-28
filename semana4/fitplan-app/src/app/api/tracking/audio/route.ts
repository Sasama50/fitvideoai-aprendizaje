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

  await supabase
    .from('clientes')
    .update({
      audio_status: 'reproducido',
    })
    .eq('link_cliente', link_token)
    .eq('audio_status', 'completado')

  return NextResponse.json({ ok: true })
}
