"use client";

import { useState } from "react";

export default function PricingPage() {
  const [cargandoPago, setCargandoPago] = useState(false);
  const [planSeleccionado, setPlanSeleccionado] = useState<"pro" | "studio">("pro");
  const [heygenAddon, setHeygenAddon] = useState(false);

  const PRECIOS: Record<"pro" | "studio", { base: number; conHeygen: number }> = {
    pro: { base: 69, conHeygen: 104 },
    studio: { base: 129, conHeygen: 188 },
  };

  const precioActual = heygenAddon
    ? PRECIOS[planSeleccionado].conHeygen
    : PRECIOS[planSeleccionado].base;

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

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: "#1a1a2e" }}
    >
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Elige tu plan</h1>
          <p className="text-gray-400 text-sm">
            Necesitas una suscripción activa para empezar a generar clientes.
          </p>
        </div>

        <div className="rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: "#16213e" }}>
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
      </div>
    </main>
  );
}
