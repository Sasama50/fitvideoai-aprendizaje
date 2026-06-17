"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type TipoPlan = "perdida-peso" | "ganancia-muscular" | "mantenimiento" | "";

interface FormData {
  nombre: string;
  objetivo: string;
  restricciones: string;
  tipoPlan: TipoPlan;
}

export default function Home() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    objetivo: "",
    restricciones: "",
    tipoPlan: "",
  });
  const [planConfirmado, setPlanConfirmado] = useState<FormData | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [cargandoPago, setCargandoPago] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlanConfirmado({ ...formData });
    setGuardado(false);

    const supabase = createClient();
    await supabase.from("clientes").insert({
      nombre: formData.nombre,
      objetivo: formData.objetivo,
      restricciones: formData.restricciones,
      tipo_plan: formData.tipoPlan,
    });

    setGuardado(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const etiquetasPlan: Record<TipoPlan, string> = {
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
            Datos del cliente
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nombre */}
            <div>
              <label
                htmlFor="nombre"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Nombre del cliente
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                required
                placeholder="Ej: María García"
                value={formData.nombre}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition"
                style={{ backgroundColor: "#0f3460" }}
              />
            </div>

            {/* Objetivo */}
            <div>
              <label
                htmlFor="objetivo"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Objetivo
              </label>
              <textarea
                id="objetivo"
                name="objetivo"
                required
                rows={3}
                placeholder="Ej: Quiero bajar 5 kg en 3 meses y mejorar mi energía diaria"
                value={formData.objetivo}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
                style={{ backgroundColor: "#0f3460" }}
              />
            </div>

            {/* Restricciones alimentarias */}
            <div>
              <label
                htmlFor="restricciones"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Restricciones alimentarias
              </label>
              <textarea
                id="restricciones"
                name="restricciones"
                rows={3}
                placeholder="Ej: Intolerante a la lactosa, alergia a los frutos secos, vegetariano…"
                value={formData.restricciones}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
                style={{ backgroundColor: "#0f3460" }}
              />
            </div>

            {/* Tipo de plan */}
            <div>
              <label
                htmlFor="tipoPlan"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Tipo de plan
              </label>
              <select
                id="tipoPlan"
                name="tipoPlan"
                required
                value={formData.tipoPlan}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none cursor-pointer"
                style={{ backgroundColor: "#0f3460" }}
              >
                <option value="" disabled style={{ color: "#6b7280" }}>
                  Selecciona un tipo de plan
                </option>
                <option value="perdida-peso">Pérdida de peso</option>
                <option value="ganancia-muscular">Ganancia muscular</option>
                <option value="mantenimiento">Mantenimiento</option>
              </select>
            </div>

            {/* Botón */}
            <button
              type="submit"
              className="w-full py-3 rounded-lg font-semibold text-white text-sm tracking-wide transition-all duration-200 hover:opacity-90 active:scale-95 mt-2"
              style={{ backgroundColor: "#e94560" }}
            >
              Generar plan
            </button>
          </form>
        </div>

        {/* Botón de suscripción */}
        <div className="mt-4">
          <button
            onClick={async () => {
              setCargandoPago(true);
              try {
                const res = await fetch("/api/checkout", { method: "POST" });
                const { url } = await res.json();
                window.location.href = url;
              } finally {
                setCargandoPago(false);
              }
            }}
            disabled={cargandoPago}
            className="w-full py-3 rounded-lg font-semibold text-white text-sm tracking-wide transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#e94560" }}
          >
            {cargandoPago ? "Redirigiendo…" : "Suscribirse — €49/mes"}
          </button>
        </div>

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
