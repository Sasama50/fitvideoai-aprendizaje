"use client";

import { useState } from "react";

interface Props {
  clienteId: number;
  guion: string;
  videoIdInicial: string | null;
  videoUrlInicial: string | null;
}

export default function GenerarVideoButton({
  clienteId,
  guion,
  videoIdInicial,
  videoUrlInicial,
}: Props) {
  const initialEstado = videoUrlInicial
    ? "completado"
    : videoIdInicial
    ? "done"
    : "idle";

  const [estado, setEstado] = useState<
    "idle" | "loading" | "done" | "completado" | "error"
  >(initialEstado);
  const [videoId, setVideoId] = useState<string>(videoIdInicial ?? "");
  const [videoUrl, setVideoUrl] = useState<string>(videoUrlInicial ?? "");
  const [checkingStatus, setCheckingStatus] = useState(false);

  async function generarVideo() {
    setEstado("loading");
    try {
      const res = await fetch("/api/generar-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: clienteId, guion }),
      });

      if (!res.ok) throw new Error("Error en la respuesta");

      const data = await res.json();
      setVideoId(data.video_id);
      setEstado("done");
    } catch {
      setEstado("error");
    }
  }

  async function actualizarEstado() {
    setCheckingStatus(true);
    try {
      const res = await fetch(`/api/video-status?cliente_id=${clienteId}`);
      if (!res.ok) throw new Error("Error en la respuesta");

      const data = await res.json();
      if (data.video_status === "completado" && data.video_url) {
        setVideoUrl(data.video_url);
        setEstado("completado");
      }
    } catch {
      // silently ignore — user can retry
    } finally {
      setCheckingStatus(false);
    }
  }

  return (
    <div className="mt-3">
      {estado === "idle" && (
        <button
          onClick={generarVideo}
          className="text-xs font-medium px-4 py-2 rounded-full transition"
          style={{ backgroundColor: "#16a34a", color: "#fff" }}
        >
          🎬 Generar vídeo
        </button>
      )}

      {estado === "loading" && (
        <button
          disabled
          className="text-xs font-medium px-4 py-2 rounded-full opacity-50"
          style={{ backgroundColor: "#16a34a", color: "#fff" }}
        >
          Enviando a HeyGen…
        </button>
      )}

      {estado === "error" && (
        <>
          <button
            onClick={generarVideo}
            className="text-xs font-medium px-4 py-2 rounded-full transition"
            style={{ backgroundColor: "#16a34a", color: "#fff" }}
          >
            🎬 Generar vídeo
          </button>
          <p className="text-red-400 text-xs mt-2">
            Error al generar el vídeo. Inténtalo de nuevo.
          </p>
        </>
      )}

      {estado === "done" && videoId && (
        <div
          className="mt-2 rounded-xl px-4 py-3 text-xs"
          style={{ backgroundColor: "#0f3460" }}
        >
          <p className="text-green-400 font-semibold mb-1">✅ Vídeo en proceso</p>
          <p className="text-gray-400 mb-3">
            ID:{" "}
            <span className="text-gray-200 font-mono break-all">{videoId}</span>
          </p>
          <button
            onClick={actualizarEstado}
            disabled={checkingStatus}
            className="text-xs font-medium px-4 py-2 rounded-full transition disabled:opacity-50"
            style={{ backgroundColor: "#1e40af", color: "#fff" }}
          >
            {checkingStatus ? "Consultando…" : "🔄 Actualizar estado"}
          </button>
        </div>
      )}

      {estado === "completado" && videoUrl && (
        <div
          className="mt-2 rounded-xl px-4 py-3 text-xs"
          style={{ backgroundColor: "#0f3460" }}
        >
          <p className="text-green-400 font-semibold mb-3">🎉 Vídeo listo</p>
          <video
            src={videoUrl}
            controls
            className="w-full rounded-lg"
            style={{ maxHeight: "240px" }}
          />
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-indigo-300 hover:text-indigo-100 transition underline"
          >
            Abrir en nueva pestaña ↗
          </a>
        </div>
      )}
    </div>
  );
}
