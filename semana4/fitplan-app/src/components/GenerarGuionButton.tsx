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
  const [editando, setEditando] = useState(false);
  const [guionEditado, setGuionEditado] = useState<string>("");
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string>("");

  function iniciarEdicion() {
    setGuionEditado(guion);
    setErrorGuardar("");
    setEditando(true);
  }

  function cancelarEdicion() {
    setEditando(false);
    setErrorGuardar("");
  }

  async function guardarEdicion() {
    setGuardando(true);
    setErrorGuardar("");
    try {
      const res = await fetch("/api/actualizar-guion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId, guion: guionEditado }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar el guión");

      setGuion(guionEditado);
      setEditando(false);
      onGuionGenerado?.(guionEditado);
    } catch (e: unknown) {
      setErrorGuardar(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setGuardando(false);
    }
  }

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

          {editando ? (
            <>
              <textarea
                value={guionEditado}
                onChange={(e) => setGuionEditado(e.target.value)}
                rows={5}
                className="w-full rounded-lg p-3 text-sm text-gray-200 outline-none border border-gray-600 focus:border-indigo-500 transition resize-y"
                style={{ backgroundColor: "#16213e" }}
              />
              {errorGuardar && (
                <p className="text-red-400 text-xs mt-2">{errorGuardar}</p>
              )}
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={guardarEdicion}
                  disabled={guardando}
                  className="text-xs font-medium px-4 py-2 rounded-full transition disabled:opacity-50"
                  style={{ backgroundColor: "#6366f1", color: "#fff" }}
                >
                  {guardando ? "Guardando…" : "Guardar"}
                </button>
                <button
                  onClick={cancelarEdicion}
                  disabled={guardando}
                  className="text-xs text-gray-400 hover:text-white transition disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <>
              <p>{guion}</p>
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={iniciarEdicion}
                  className="text-xs text-gray-400 hover:text-white transition"
                >
                  Editar
                </button>
                <button
                  onClick={generarGuion}
                  className="text-xs text-gray-400 hover:text-white transition"
                >
                  Regenerar
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
