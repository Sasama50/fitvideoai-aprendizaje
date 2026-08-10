"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import FormularioIntakeCliente, {
  type ClienteIntakeValues,
} from "@/components/FormularioIntakeCliente";
import type { PlanNutricion } from "@/lib/supabase-types";

export default function Home() {
  const router = useRouter();
  const [planConfirmado, setPlanConfirmado] = useState<ClienteIntakeValues | null>(null);
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [generandoPlan, setGenerandoPlan] = useState(false);
  const [planGenerado, setPlanGenerado] = useState<PlanNutricion | null>(null);
  const [errorGeneracion, setErrorGeneracion] = useState("");
  const [cargandoPago, setCargandoPago] = useState(false);
  const [errorCliente, setErrorCliente] = useState("");
  const [limiteAlcanzado, setLimiteAlcanzado] = useState<{
    plan: string;
    limite: number;
  } | null>(null);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleCheckout = async (plan: "pro" | "studio", conHeygen: boolean) => {
    setCargandoPago(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, heygen_addon: conHeygen }),
      });
      const { url } = await res.json();
      window.location.href = url;
    } finally {
      setCargandoPago(false);
    }
  };

  const handleSubmit = async (valores: ClienteIntakeValues) => {
    setErrorCliente("");
    setLimiteAlcanzado(null);
    setPlanGenerado(null);
    setErrorGeneracion("");

    const res = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: valores.nombre,
        email: valores.email || null,
        objetivo: valores.objetivo,
        restricciones: valores.restricciones,
        restricciones_dieta: valores.restriccionesDieta,
        ingredientes_no_deseados: valores.ingredientesNoDeseados,
        tipo_plan: valores.tipoPlan,
        preferencias_alimentarias: valores.preferenciasAlimentarias,
        nivel_experiencia: valores.nivelExperiencia,
        equipamiento_disponible: valores.equipamientoDisponible,
        historial_lesiones: valores.historialLesiones,
        edad: valores.edad ? Number(valores.edad) : null,
        peso_kg: valores.pesoKg ? Number(valores.pesoKg) : null,
        altura_cm: valores.alturaCm ? Number(valores.alturaCm) : null,
        sexo_biologico: valores.sexoBiologico || null,
        nivel_actividad: valores.nivelActividad || null,
        metodo_calculo: valores.metodoCalculo,
        objetivo_calorico_manual: valores.objetivoCaloricoManual
          ? Number(valores.objetivoCaloricoManual)
          : null,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      if (json.error === "limite_alcanzado") {
        setLimiteAlcanzado({ plan: json.plan, limite: json.limite });
      } else if (json.error === "sin_plan_activo") {
        router.push("/pricing");
      } else {
        setErrorCliente(json.error || "No se pudo guardar el cliente.");
      }
      return;
    }

    setPlanConfirmado(valores);
    setClienteId(json.cliente.id);

    setGenerandoPlan(true);
    try {
      const resPlan = await fetch("/api/generar-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: json.cliente.id }),
      });

      let jsonPlan: { error?: string; plan_nutricion?: PlanNutricion } | null = null;
      try {
        jsonPlan = await resPlan.json();
      } catch (parseErr) {
        console.error("Respuesta no válida al generar el plan desde el alta:", parseErr);
      }

      if (!resPlan.ok || !jsonPlan) {
        setErrorGeneracion(jsonPlan?.error || `error de servidor (${resPlan.status})`);
      } else {
        setPlanGenerado(jsonPlan.plan_nutricion ?? null);
      }
    } catch (err) {
      console.error("Error de red generando el plan desde el alta:", err);
      setErrorGeneracion(err instanceof Error ? err.message : "error de red");
    } finally {
      setGenerandoPlan(false);
    }
  };

  const etiquetasPlan: Record<ClienteIntakeValues["tipoPlan"], string> = {
    "perdida-peso": "Pérdida de peso",
    "ganancia-muscular": "Ganancia muscular",
    "mantenimiento": "Mantenimiento",
    "": "",
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: "#1a1a2e" }}
    >
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10 relative">
          <Link
            href="/clientes"
            className="absolute top-0 left-0 text-xs text-gray-400 hover:text-white transition"
          >
            Ver clientes →
          </Link>
          <h1 className="text-4xl font-bold text-white mb-3">FitPlan AI</h1>
          <p className="text-gray-400 text-sm">
            Genera tu plan nutricional personalizado con inteligencia artificial
          </p>
          <button
            onClick={handleSignOut}
            className="absolute top-0 right-0 text-xs text-gray-400 hover:text-white transition px-3 py-1 rounded-lg border border-gray-600 hover:border-gray-400"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Card del formulario */}
        <div
          className="rounded-2xl p-8 shadow-2xl"
          style={{ backgroundColor: "#16213e" }}
        >
          <h2 className="text-xl font-semibold text-white mb-6">
            Perfil del cliente
          </h2>

          <FormularioIntakeCliente onSubmit={handleSubmit} error={errorCliente} />
        </div>

        {/* Modal de límite de plan alcanzado */}
        {limiteAlcanzado && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div
              className="w-full max-w-sm rounded-2xl p-6 shadow-2xl"
              style={{ backgroundColor: "#16213e" }}
            >
              <h3 className="text-lg font-semibold text-white mb-2">
                Límite de tu plan alcanzado
              </h3>
              <p className="text-gray-300 text-sm mb-6">
                Has llegado al límite de tu plan ({limiteAlcanzado.limite}{" "}
                clientes). Actualiza a Studio para seguir añadiendo clientes.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setLimiteAlcanzado(null)}
                  className="flex-1 py-2.5 rounded-lg font-medium text-sm text-gray-300 border border-gray-600 hover:border-gray-400 transition"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => handleCheckout("studio", false)}
                  disabled={cargandoPago}
                  className="flex-1 py-2.5 rounded-lg font-semibold text-white text-sm tracking-wide transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#e94560" }}
                >
                  {cargandoPago ? "Redirigiendo…" : "Actualizar a Studio — €129"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmación */}
        {planConfirmado && (
          <div
            className="rounded-2xl p-8 shadow-2xl mt-6"
            style={{ backgroundColor: "#14532d" }}
          >
            <h2 className="text-xl font-semibold text-white mb-4">
              Cliente {planConfirmado.nombre} creado ✓
            </h2>
            <ul className="space-y-3 text-sm text-green-100">
              <li>
                <span className="font-medium text-green-300">Objetivo:</span>{" "}
                {planConfirmado.objetivo}
              </li>
              <li>
                <span className="font-medium text-green-300">
                  Restricciones:
                </span>{" "}
                {planConfirmado.restricciones || "Ninguna"}
              </li>
              <li>
                <span className="font-medium text-green-300">
                  Tipo de plan:
                </span>{" "}
                {etiquetasPlan[planConfirmado.tipoPlan]}
              </li>
            </ul>

            {generandoPlan && (
              <p className="mt-4 text-sm text-green-200">
                Generando el plan con IA…
              </p>
            )}

            {!generandoPlan && planGenerado && (
              <p className="mt-4 text-sm font-medium text-green-300">
                Plan generado con IA ✓ — objetivo calórico:{" "}
                {planGenerado.calorias_objetivo} kcal/día
              </p>
            )}

            {!generandoPlan && errorGeneracion && (
              <p className="mt-4 text-sm text-amber-300">
                El cliente se creó pero el plan no se pudo generar automáticamente (
                {errorGeneracion}). Ábrelo en &quot;Editar plan&quot; y pulsa &quot;✨ Generar
                borrador con IA&quot; para reintentarlo.
              </p>
            )}

            {clienteId && (
              <Link
                href={`/clientes/${clienteId}/editar`}
                className="inline-block mt-4 text-sm font-medium text-green-300 hover:underline"
              >
                Ver ficha del cliente →
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
