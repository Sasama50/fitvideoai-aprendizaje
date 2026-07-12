"use client";

import { useState } from "react";

interface Props {
  clienteId: number;
  guionInicial: string | null;
  bloqueado?: boolean;
  motivoBloqueo?: string;
  onGuionGenerado?: (guion: string) => void;
}

export default function GenerarGuionButton({
  clienteId,
  guionInicial,
  bloqueado = false,
  motivoBloqueo,
  onGuionGenerado,
}: Props) {
  const [estado, setEstado] = useState<"idle" | "loading" | "done" | "error">(
    guionInicial ? "done" : "idle"
  );
  const [guion, setGuion] = useState<string>(guionInicial ?? "");
  const [error, setError] = useState<string>("");

  async function generarGuion() {
    setEstado("loading");
    setError("");
    try {
      const res = await fetch("/api/generar-guion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error en la respuesta");

      setGuion(data.guion);
      setEstado("done");
      onGuionGenerado?.(data.guion);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error desconocido");
      setEstado("error");
    }
  }

  if (bloqueado) {
    return (
      <div className="mt-4">
        <button
          disabled
          className="text-xs font-medium px-4 py-2 rounded-full opacity-40 cursor-not-allowed"
          style={{ backgroundColor: "#e94560", color: "#fff" }}
        >
          Generar guión
        </button>
        <p className="text-amber-400 text-xs mt-2">
          {motivoBloqueo || "Aprueba el plan antes de generar el guión."}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {estado !== "done" && (
        <button
          onClick={generarGuion}
          disabled={estado === "loading"}
          className="text-xs font-medium px-4 py-2 rounded-full transition disabled:opacity-50"
          style={{ backgroundColor: "#e94560", color: "#fff" }}
        >
          {estado === "loading" ? "Generando…" : "Generar guión"}
        </button>
      )}

      {estado === "error" && (
        <p className="text-red-400 text-xs mt-2">
          {error || "Error al generar el guión. Inténtalo de nuevo."}
        </p>
      )}

      {estado === "done" && guion && (
        <div
          className="mt-3 rounded-xl p-4 text-sm text-gray-200 leading-relaxed"
          style={{ backgroundColor: "#0f3460" }}
        >
          <p className="text-xs font-semibold text-indigo-300 mb-2">
            🎬 Guión generado
          </p>
          <p>{guion}</p>
          <button
            onClick={generarGuion}
            className="mt-3 text-xs text-gray-400 hover:text-white transition"
          >
            Regenerar
          </button>
        </div>
      )}
    </div>
  );
}
