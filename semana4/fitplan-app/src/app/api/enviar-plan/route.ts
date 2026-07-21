import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL!

const supabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { clienteId, notificarCambio } = await req.json()

    const supabaseAuth = createServerClient()
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'no_autenticado' }, { status: 401 })
    }

    const { data: profesional, error: profesionalError } = await supabase
      .from('profesionales')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profesionalError || !profesional) {
      return NextResponse.json({ error: 'profesional_no_encontrado' }, { status: 400 })
    }

    // 1. Leer el cliente
    const { data: cliente, error: errCliente } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', clienteId)
      .eq('profesional_id', profesional.id)
      .single()

    if (errCliente || !cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    if (!cliente.activo) {
      return NextResponse.json(
        { error: 'Este cliente está archivado. Reactívalo antes de enviarle un plan.' },
        { status: 400 }
      )
    }

    if (!cliente.email) {
      return NextResponse.json(
        { error: 'El cliente no tiene email guardado. Añádelo en su perfil antes de enviar.' },
        { status: 400 }
      )
    }

    // 2. Generar link_token si no existe todavía
    let linkToken = cliente.link_cliente
    if (!linkToken) {
      linkToken = crypto.randomUUID()
      await supabase
        .from('clientes')
        .update({ link_cliente: linkToken })
        .eq('id', clienteId)
        .eq('profesional_id', profesional.id)
    }

    const url = `${process.env.NEXT_PUBLIC_APP_URL}/plan/${linkToken}`

    // 3. Enviar email con Resend
    const asunto = notificarCambio
      ? `Se ha actualizado tu plan de ${cliente.nombre_profesional || 'tu entrenador'}`
      : `Tu plan de esta semana de ${cliente.nombre_profesional || 'tu entrenador'}`

    const tieneVideo = cliente.video_status === 'completado' && !!cliente.video_url

    const mensaje = notificarCambio
      ? tieneVideo
        ? 'Tu profesional ha actualizado tu plan de esta semana, con vídeo y audio personalizados incluidos.'
        : 'Tu profesional ha actualizado tu plan de esta semana, con audio personalizado incluido.'
      : tieneVideo
        ? 'Tu plan de esta semana ya está listo, con vídeo y audio personalizados incluidos.'
        : 'Tu plan de esta semana ya está listo, con audio personalizado incluido.'

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: cliente.email,
      subject: asunto,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <p style="font-size: 16px; color: #1a1a2e;">Hola ${cliente.nombre},</p>
          <p style="font-size: 16px; color: #1a1a2e; line-height: 1.5;">
            ${mensaje}
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
      .eq('profesional_id', profesional.id)

    return NextResponse.json({ success: true, emailId: data?.id, link: url })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
