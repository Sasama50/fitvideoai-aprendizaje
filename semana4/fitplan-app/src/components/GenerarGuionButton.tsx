"use client";

import { useState } from "react";

interface Props {
  clienteId: string;
  nombre: string;
  objetivo: string;
  restricciones: string | null;
  tipoPlan: string;
  guionInicial: string | null;
}

export default function GenerarGuionButton({
  clienteId,
  nombre,
  objetivo,
  restricciones,
  tipoPlan,
  guionInicial,
}: Props) {
  const [estado, setEstado] = useState<"idle" | "loading" | "done" | "error">(
    guionInicial ? "done" : "idle"
  );
  const [guion, setGuion] = useState<string>(guionInicial ?? "");

  async function generarGuion() {
    setEstado("loading");
    try {
      const res = await fetch("/api/generar-guion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: clienteId,
          nombre,
          objetivo,
          restricciones,
          tipo_plan: tipoPlan,
        }),
      });

      if (!res.ok) throw new Error("Error en la respuesta");

      const data = await res.json();
      setGuion(data.guion);
      setEstado("done");
    } catch {
      setEstado("error");
    }
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
          Error al generar el guión. Inténtalo de nuevo.
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
