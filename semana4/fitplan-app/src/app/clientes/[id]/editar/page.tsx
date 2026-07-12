import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Cliente } from "@/lib/supabase-types";
import EditarClienteForm from "./EditarClienteForm";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditarClientePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", Number(id))
    .single();

  if (!cliente) notFound();

  const c = cliente as Cliente;

  return (
    <main
      className="min-h-screen flex flex-col items-center px-4 py-12"
      style={{ backgroundColor: "#1a1a2e" }}
    >
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <Link
            href="/clientes"
            className="text-xs text-gray-400 hover:text-white transition"
          >
            ← Volver a clientes
          </Link>
          <h1 className="text-2xl font-bold text-white mt-4">
            Editar perfil de {c.nombre}
          </h1>
        </div>

        <div
          className="rounded-2xl p-8 shadow-2xl"
          style={{ backgroundColor: "#16213e" }}
        >
          <EditarClienteForm cliente={c} />
        </div>
      </div>
    </main>
  );
}
