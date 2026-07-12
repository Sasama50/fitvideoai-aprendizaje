"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import FormularioIntakeCliente, {
  type ClienteIntakeValues,
} from "@/components/FormularioIntakeCliente";

export default function Home() {
  const router = useRouter();
  const [planConfirmado, setPlanConfirmado] = useState<ClienteIntakeValues | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [cargandoPago, setCargandoPago] = useState(false);
  const [errorCliente, setErrorCliente] = useState("");
  const [limiteAlcanzado, setLimiteAlcanzado] = useState<{
    plan: string;
    limite: number;
  } | null>(null);
  const [planSeleccionado, setPlanSeleccionado] = useState<"pro" | "studio">("pro");
  const [heygenAddon, setHeygenAddon] = useState(false);

  const PRECIOS: Record<"pro" | "studio", { base: number; conHeygen: number }> = {
    pro: { base: 69, conHeygen: 104 },
    studio: { base: 129, conHeygen: 188 },
  };

  const precioActual = heygenAddon
    ? PRECIOS[planSeleccionado].conHeygen
    : PRECIOS[planSeleccionado].base;

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

    const res = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: valores.nombre,
        objetivo: valores.objetivo,
        restricciones: valores.restricciones,
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
      } else {
        setErrorCliente(json.error || "No se pudo guardar el cliente.");
      }
      return;
    }

    setPlanConfirmado(valores);
    setGuardado(true);
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

        {/* Selector de suscripción */}
        <div
          className="mt-4 rounded-2xl p-6 shadow-2xl"
          style={{ backgroundColor: "#16213e" }}
        >
          <h3 className="text-sm font-semibold text-white mb-4">Suscripción</h3>

          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setPlanSeleccionado("pro")}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition border"
              style={
                planSeleccionado === "pro"
                  ? { backgroundColor: "#e94560", borderColor: "#e94560", color: "#fff" }
                  : { backgroundColor: "transparent", borderColor: "#374151", color: "#d1d5db" }
              }
            >
              Pro — €69
            </button>
            <button
              type="button"
              onClick={() => setPlanSeleccionado("studio")}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition border"
              style={
                planSeleccionado === "studio"
                  ? { backgroundColor: "#e94560", borderColor: "#e94560", color: "#fff" }
                  : { backgroundColor: "transparent", borderColor: "#374151", color: "#d1d5db" }
              }
            >
              Studio — €129
            </button>
          </div>

          <label className="flex items-start gap-2 text-sm text-gray-300 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={heygenAddon}
              onChange={(e) => setHeygenAddon(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Añadir HeyGen — vídeo de bienvenida + vídeo de progreso mensual
              con tu cara (+€35/mes en Pro, +€59/mes en Studio)
            </span>
          </label>

          <button
            onClick={() => handleCheckout(planSeleccionado, heygenAddon)}
            disabled={cargandoPago}
            className="w-full py-3 rounded-lg font-semibold text-white text-sm tracking-wide transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#e94560" }}
          >
            {cargandoPago ? "Redirigiendo…" : `Suscribirse — €${precioActual}/mes`}
          </button>
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
              Plan generado para {planConfirmado.nombre}
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
            {guardado && (
              <p className="mt-4 text-sm font-medium text-green-300">
                Guardado en la base de datos ✓
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
