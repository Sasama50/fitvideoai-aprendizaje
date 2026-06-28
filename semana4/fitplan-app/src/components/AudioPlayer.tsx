'use client'

import { useRef, useState } from 'react'

interface AudioPlayerProps {
  audioUrl: string
  linkToken: string
}

export default function AudioPlayer({ audioUrl, linkToken }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [tracked, setTracked] = useState(false)

  const handlePlay = async () => {
    setPlaying(true)
    if (!tracked) {
      setTracked(true)
      await fetch('/api/tracking/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link_token: linkToken }),
      })
    }
  }

  const handlePause = () => setPlaying(false)
  const handleEnded = () => setPlaying(false)

  const togglePlay = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <audio
        ref={audioRef}
        src={audioUrl}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        preload="metadata"
      />

      <button
        onClick={togglePlay}
        className="flex items-center gap-3 w-full bg-gray-900 text-white rounded-xl px-5 py-4 text-left hover:bg-gray-800 transition-colors"
      >
        <span className="text-2xl">{playing ? '⏸' : '▶️'}</span>
        <div>
          <p className="font-semibold text-sm">
            {playing ? 'Reproduciendo...' : 'Escuchar mi plan'}
          </p>
          <p className="text-xs text-gray-400">Mensaje personalizado de tu profesional</p>
        </div>
      </button>

      <audio
        src={audioUrl}
        controls
        className="w-full h-8 opacity-40 hover:opacity-80 transition-opacity"
        style={{ accentColor: '#E8463A' }}
        preload="none"
      />
    </div>
  )
}
