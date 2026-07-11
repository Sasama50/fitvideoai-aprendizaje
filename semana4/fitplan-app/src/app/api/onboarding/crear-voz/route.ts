import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audio = formData.get('audio')
    const userId = formData.get('user_id')

    if (!(audio instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'El archivo de audio es requerido' },
        { status: 400 }
      )
    }

    if (typeof userId !== 'string' || !userId) {
      return NextResponse.json(
        { success: false, error: 'user_id es requerido' },
        { status: 400 }
      )
    }

    // 1. Subir la muestra de voz al bucket "audios" (bypass RLS con service key)
    const extension = audio.name.split('.').pop() || 'mp3'
    const storagePath = `voice-samples/${userId}-${Date.now()}.${extension}`
    const audioBuffer = await audio.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from('audios')
      .upload(storagePath, new Uint8Array(audioBuffer), {
        contentType: audio.type || 'audio/mpeg',
        upsert: true,
      })

    if (uploadError) {
      console.error('Error al subir la muestra de voz a Supabase Storage:', uploadError)
      return NextResponse.json(
        { success: false, error: `Error al subir el audio: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // 2. Identificador para ElevenLabs: usamos el email del profesional si existe, si no el user_id
    const { data: profesional } = await supabase
      .from('profesionales')
      .select('email')
      .eq('user_id', userId)
      .single()

    const voiceName = profesional?.email || userId

    // 3. Clonar la voz en ElevenLabs
    const elevenFormData = new FormData()
    elevenFormData.append('name', voiceName)
    elevenFormData.append(
      'files',
      new Blob([audioBuffer], { type: audio.type || 'audio/mpeg' }),
      audio.name || 'voice-sample'
    )

    const elevenRes = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
      body: elevenFormData,
    })

    if (!elevenRes.ok) {
      const errText = await elevenRes.text()
      console.error('Error de ElevenLabs:', errText)
      return NextResponse.json(
        { success: false, error: `Error de ElevenLabs (${elevenRes.status}): ${errText}` },
        { status: 502 }
      )
    }

    const elevenData = await elevenRes.json()
    const voiceId = elevenData.voice_id

    if (!voiceId) {
      console.error('Respuesta inesperada de ElevenLabs:', elevenData)
      return NextResponse.json(
        { success: false, error: 'ElevenLabs no devolvió un voice_id' },
        { status: 502 }
      )
    }

    // 4. Guardar el voice_id en el profesional
    const { error: upsertError } = await supabase
      .from('profesionales')
      .upsert({ user_id: userId, elevenlabs_voice_id: voiceId }, { onConflict: 'user_id' })

    if (upsertError) {
      console.error('Error al guardar elevenlabs_voice_id en profesionales:', upsertError)
      return NextResponse.json(
        { success: false, error: `Error al guardar la voz: ${upsertError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, voice_id: voiceId })
  } catch (err) {
    console.error('Error inesperado en /api/onboarding/crear-voz:', err)
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
