import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL!

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { clienteId, emailDestino } = await req.json()

    const { data: cliente, error: errCliente } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', clienteId)
      .single()

    if (errCliente || !cliente || !cliente.link_cliente) {
      return NextResponse.json({ error: 'Cliente sin plan enviado todavía' }, { status: 400 })
    }

    const url = `${process.env.NEXT_PUBLIC_APP_URL}/plan/${cliente.link_cliente}`

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: emailDestino,
      subject: `¿Ya viste tu plan de esta semana?`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <p style="font-size: 16px; color: #1a1a2e;">Hola ${cliente.nombre},</p>
          <p style="font-size: 16px; color: #1a1a2e; line-height: 1.5;">
            Vi que aún no has abierto tu plan de esta semana — te dejo el link otra vez por si se perdió entre los mensajes.
          </p>
          <a href="${url}"
             style="display: inline-block; background: #E8463A; color: white; text-decoration: none;
                    padding: 12px 24px; border-radius: 6px; font-weight: bold; margin: 16px 0;">
            Ver mi plan
          </a>
        </div>
      `,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, emailId: data?.id })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
