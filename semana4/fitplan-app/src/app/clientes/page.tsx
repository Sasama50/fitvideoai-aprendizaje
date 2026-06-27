import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import GenerarGuionButton from "@/components/GenerarGuionButton";
import GenerarVideoButton from "@/components/GenerarVideoButton";

const etiquetasPlan: Record<string, string> = {
  "perdida-peso": "Pérdida de peso",
  "ganancia-muscular": "Ganancia muscular",
  "mantenimiento": "Mantenimiento",
};

function formatearFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function Clientes() {
  const supabase = await createClient();
  const { data: clientes } = await supabase
    .from("clientes")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main
      className="min-h-screen flex flex-col items-center px-4 py-12"
      style={{ backgroundColor: "#1a1a2e" }}
    >
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10 relative">
          <h1 className="text-4xl font-bold text-white mb-3">FitPlan AI</h1>
          <p className="text-gray-400 text-sm">
            Genera tu plan nutricional personalizado con inteligencia artificial
          </p>
          <Link
            href="/"
            className="absolute top-0 left-0 text-xs text-gray-400 hover:text-white transition"
          >
            ← Añadir cliente
          </Link>
        </div>

        {/* Título sección */}
        <h2 className="text-xl font-semibold text-white mb-6">
          Clientes registrados
        </h2>

        {/* Lista */}
        {!clientes || clientes.length === 0 ? (
          <div
            className="rounded-2xl p-8 shadow-2xl text-center"
            style={{ backgroundColor: "#16213e" }}
          >
            <p className="text-gray-400 text-sm">
              Todavía no hay clientes registrados
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {clientes.map((cliente) => (
              <div
                key={cliente.id}
                className="rounded-2xl p-6 shadow-2xl"
                style={{ backgroundColor: "#16213e" }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {cliente.nombre}
                    </h3>
                    <p className="text-gray-300 text-sm mt-1 line-clamp-2">
                      {cliente.objetivo}
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-xs font-medium px-3 py-1 rounded-full"
                    style={{ backgroundColor: "#0f3460", color: "#a5b4fc" }}
                  >
                    {etiquetasPlan[cliente.tipo_plan] ?? cliente.tipo_plan}
                  </span>
                </div>
                <p className="text-gray-500 text-xs mt-4">
                  {formatearFecha(cliente.created_at)}
                </p>
                <GenerarGuionButton
                  clienteId={cliente.id}
                  nombre={cliente.nombre}
                  objetivo={cliente.objetivo}
                  restricciones={cliente.restricciones ?? null}
                  tipoPlan={cliente.tipo_plan}
                  guionInicial={cliente.guion ?? null}
                />
                {cliente.guion && (
                  <GenerarVideoButton
                    clienteId={cliente.id}
                    guion={cliente.guion}
                    videoIdInicial={cliente.video_id ?? null}
                    videoUrlInicial={cliente.video_url ?? null}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
