"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormularioIntakeCliente, {
  type ClienteIntakeValues,
  type NivelExperiencia,
  type TipoPlan,
  type SexoBiologico,
  type NivelActividad,
} from "@/components/FormularioIntakeCliente";
import type { Cliente } from "@/lib/supabase-types";

export default function EditarClienteForm({ cliente }: { cliente: Cliente }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const valoresIniciales: Partial<ClienteIntakeValues> = {
    nombre: cliente.nombre ?? "",
    objetivo: cliente.objetivo ?? "",
    restricciones: cliente.restricciones ?? "",
    restriccionesDieta: cliente.restricciones_dieta ?? [],
    tipoPlan: (cliente.tipo_plan ?? "") as TipoPlan,
    preferenciasAlimentarias: cliente.preferencias_alimentarias ?? "",
    nivelExperiencia: (cliente.nivel_experiencia ?? "") as NivelExperiencia,
    equipamientoDisponible: cliente.equipamiento_disponible ?? "",
    historialLesiones: cliente.historial_lesiones ?? "",
    edad: cliente.edad != null ? String(cliente.edad) : "",
    pesoKg: cliente.peso_kg != null ? String(cliente.peso_kg) : "",
    alturaCm: cliente.altura_cm != null ? String(cliente.altura_cm) : "",
    sexoBiologico: (cliente.sexo_biologico ?? "") as SexoBiologico,
    nivelActividad: (cliente.nivel_actividad ?? "") as NivelActividad,
    metodoCalculo: cliente.metodo_calculo ?? "mifflin_st_jeor",
    objetivoCaloricoManual:
      cliente.objetivo_calorico_manual != null ? String(cliente.objetivo_calorico_manual) : "",
  };

  const handleSubmit = async (valores: ClienteIntakeValues) => {
    setError("");
    setEnviando(true);
    try {
      const res = await fetch(`/api/clientes/${cliente.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: valores.nombre,
          objetivo: valores.objetivo,
          restricciones: valores.restricciones,
          restricciones_dieta: valores.restriccionesDieta,
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
        setError(json.error || "No se pudo guardar el perfil.");
        return;
      }

      router.push("/clientes");
      router.refresh();
    } finally {
      setEnviando(false);
    }
  };

  return (
    <FormularioIntakeCliente
      valoresIniciales={valoresIniciales}
      modo="editar"
      enviando={enviando}
      error={error}
      onSubmit={handleSubmit}
    />
  );
}
