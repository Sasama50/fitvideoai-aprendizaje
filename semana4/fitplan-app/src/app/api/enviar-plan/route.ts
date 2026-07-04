import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { clienteId, emailDestino } = await req.json()

    // 1. Leer el cliente
    const { data: cliente, error: errCliente } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', clienteId)
      .single()

    if (errCliente || !cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    // 2. Generar link_token si no existe todavía
    let linkToken = cliente.link_cliente
    if (!linkToken) {
      linkToken = crypto.randomUUID()
      await supabase
        .from('clientes')
        .update({ link_cliente: linkToken })
        .eq('id', clienteId)
    }

    const url = `${process.env.NEXT_PUBLIC_APP_URL}/plan/${linkToken}`

    // 3. Enviar email con Resend
    const { data, error } = await resend.emails.send({
      from: 'FitVideoAI <onboarding@resend.dev>',
      to: emailDestino,
      subject: `Tu plan de esta semana de ${cliente.nombre_profesional || 'tu entrenador'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <p style="font-size: 16px; color: #1a1a2e;">Hola ${cliente.nombre},</p>
          <p style="font-size: 16px; color: #1a1a2e; line-height: 1.5;">
            Tu plan de esta semana ya está listo, con audio personalizado incluido.
          </p>
          <a href="${url}"
             style="display: inline-block; background: #E8463A; color: white; text-decoration: none;
                    padding: 12px 24px; border-radius: 6px; font-weight: bold; margin: 16px 0;">
            Ver mi plan de esta semana
          </a>
          <p style="font-size: 13px; color: #6b6b80;">
            Este plan estará disponible hasta el próximo lunes. Cualquier duda, escríbeme directamente.
          </p>
        </div>
      `,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 4. Marcar como enviado
    await supabase
      .from('clientes')
      .update({ ultimo_envio_at: new Date().toISOString() })
      .eq('id', clienteId)

    return NextResponse.json({ success: true, emailId: data?.id, link: url })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
