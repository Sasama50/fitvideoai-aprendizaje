"use client";

import { useState } from "react";
import type { PlanEstado, PlanNutricion, PlanEntrenamiento } from "@/lib/supabase-types";

interface Props {
  clienteId: number;
  planEstado: PlanEstado;
  bloqueado?: boolean;
  motivoBloqueo?: string;
  onGenerado: (data: {
    plan_nutricion: PlanNutricion;
    plan_entrenamiento: PlanEntrenamiento;
    plan_estado: PlanEstado;
  }) => void;
}

export default function GenerarPlanIAButton({
  clienteId,
  planEstado,
  bloqueado = false,
  motivoBloqueo,
  onGenerado,
}: Props) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function generar() {
    if (planEstado !== "sin_generar") {
      const confirmado = window.confirm(
        "Ya existe un plan para este cliente. Generar un borrador nuevo con IA sobrescribirá el plan actual (y invalidará el guión/audio ya generados). ¿Continuar?"
      );
      if (!confirmado) return;
    }

    setCargando(true);
    setError("");
    try {
      const res = await fetch("/api/generar-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clienteId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al generar el plan");

      onGenerado({
        plan_nutricion: data.plan_nutricion,
        plan_entrenamiento: data.plan_entrenamiento,
        plan_estado: data.plan_estado,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  }

  if (bloqueado) {
    return (
      <div className="mb-4">
        <button
          disabled
          className="text-xs font-medium px-4 py-2 rounded-full opacity-40 cursor-not-allowed"
          style={{ backgroundColor: "#6366f1", color: "#fff" }}
        >
          ✨ Generar borrador con IA
        </button>
        <p className="text-amber-400 text-xs mt-2">
          {motivoBloqueo || "Esta acción no está disponible ahora mismo."}
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <button
        onClick={generar}
        disabled={cargando}
        className="text-xs font-medium px-4 py-2 rounded-full transition disabled:opacity-50"
        style={{ backgroundColor: "#6366f1", color: "#fff" }}
      >
        {cargando
          ? "Generando borrador…"
          : planEstado === "sin_generar"
          ? "✨ Generar borrador con IA"
          : "✨ Regenerar borrador con IA"}
      </button>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
}
