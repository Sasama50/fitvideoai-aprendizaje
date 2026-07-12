import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  const { clienteId } = await req.json()

  if (!clienteId) {
    return NextResponse.json({ error: 'clienteId requerido' }, { status: 400 })
  }

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

  // 1. Obtener datos del cliente
  const { data: cliente, error: fetchError } = await supabase
    .from('clientes')
    .select('guion, semana_numero, link_cliente')
    .eq('id', clienteId)
    .eq('profesional_id', profesional.id)
    .single()

  if (fetchError || !cliente) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  if (!cliente.guion) {
    return NextResponse.json(
      { error: 'Genera el guión primero antes de crear el audio' },
      { status: 400 }
    )
  }

  // 2. Generar link_cliente si no existe (UUID único de la página del cliente)
  const linkToken = cliente.link_cliente || crypto.randomUUID()

  // 3. Obtener voice_id
  const voiceId = process.env.ELEVENLABS_VOICE_ID
  if (!voiceId) {
    return NextResponse.json(
      { error: 'ELEVENLABS_VOICE_ID no configurado en .env.local' },
      { status: 500 }
    )
  }

  // 4. Llamar a ElevenLabs TTS
  const elevenRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: cliente.guion,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  )

  if (!elevenRes.ok) {
    const errText = await elevenRes.text()
    console.error('ElevenLabs error:', errText)
    return NextResponse.json(
      { error: `Error de ElevenLabs (${elevenRes.status}): ${errText}` },
      { status: 500 }
    )
  }

  // 5. Subir audio a Supabase Storage (bucket "audios", debe ser público)
  const audioBuffer = await elevenRes.arrayBuffer()
  const semana = cliente.semana_numero || 1
  const storagePath = `${clienteId}/semana_${semana}.mp3`

  const { error: uploadError } = await supabase.storage
    .from('audios')
    .upload(storagePath, new Uint8Array(audioBuffer), {
      contentType: 'audio/mpeg',
      upsert: true,
    })

  if (uploadError) {
    console.error('Supabase Storage error:', uploadError)
    return NextResponse.json(
      { error: `Error al subir audio: ${uploadError.message}` },
      { status: 500 }
    )
  }

  // 6. Obtener URL pública del audio
  const { data: urlData } = supabase.storage
    .from('audios')
    .getPublicUrl(storagePath)

  // 7. Actualizar cliente con audio_url, audio_status y link_cliente
  await supabase
    .from('clientes')
    .update({
      audio_url: urlData.publicUrl,
      audio_status: 'completado',
      link_cliente: linkToken,
    })
    .eq('id', clienteId)
    .eq('profesional_id', profesional.id)

  return NextResponse.json({
    audio_url: urlData.publicUrl,
    link_token: linkToken,
  })
}
