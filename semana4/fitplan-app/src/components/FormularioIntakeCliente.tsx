"use client";

import { useState } from "react";
import type {
  SexoBiologico as SexoBiologicoDB,
  NivelActividad as NivelActividadDB,
  MetodoCalculo,
} from "@/lib/tdee";
import type { RestriccionDieta } from "@/lib/supabase-types";

export type TipoPlan = "perdida-peso" | "ganancia-muscular" | "mantenimiento" | "";
export type NivelExperiencia = "principiante" | "intermedio" | "avanzado" | "";
export type SexoBiologico = SexoBiologicoDB | "";
export type NivelActividad = NivelActividadDB | "";
export type { MetodoCalculo };

export type ClienteIntakeValues = {
  nombre: string;
  objetivo: string;
  restricciones: string;
  restriccionesDieta: RestriccionDieta[];
  tipoPlan: TipoPlan;
  preferenciasAlimentarias: string;
  nivelExperiencia: NivelExperiencia;
  equipamientoDisponible: string;
  historialLesiones: string;
  edad: string;
  pesoKg: string;
  alturaCm: string;
  sexoBiologico: SexoBiologico;
  nivelActividad: NivelActividad;
  metodoCalculo: MetodoCalculo;
  objetivoCaloricoManual: string;
};

const OPCIONES_RESTRICCION_DIETA: { value: RestriccionDieta; label: string }[] = [
  { value: "vegetariano", label: "Vegetariano" },
  { value: "vegano", label: "Vegano" },
  { value: "sin_gluten", label: "Sin gluten" },
  { value: "sin_lactosa", label: "Sin lactosa" },
];

const VALORES_VACIOS: ClienteIntakeValues = {
  nombre: "",
  objetivo: "",
  restricciones: "",
  restriccionesDieta: [],
  tipoPlan: "",
  preferenciasAlimentarias: "",
  nivelExperiencia: "",
  equipamientoDisponible: "",
  historialLesiones: "",
  edad: "",
  pesoKg: "",
  alturaCm: "",
  sexoBiologico: "",
  nivelActividad: "",
  metodoCalculo: "mifflin_st_jeor",
  objetivoCaloricoManual: "",
};

type Props = {
  valoresIniciales?: Partial<ClienteIntakeValues>;
  modo?: "crear" | "editar";
  enviando?: boolean;
  error?: string;
  textoBoton?: string;
  onSubmit: (valores: ClienteIntakeValues) => void | Promise<void>;
};

const inputClass =
  "w-full px-4 py-2.5 rounded-lg text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none";
const inputStyle = { backgroundColor: "#0f3460" };
const labelClass = "block text-sm font-medium text-gray-300 mb-1";

export default function FormularioIntakeCliente({
  valoresIniciales,
  modo = "crear",
  enviando = false,
  error,
  textoBoton,
  onSubmit,
}: Props) {
  const [valores, setValores] = useState<ClienteIntakeValues>({
    ...VALORES_VACIOS,
    ...valoresIniciales,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setValores((prev) => ({ ...prev, [name]: value }));
  };

  const toggleRestriccionDieta = (valor: RestriccionDieta) => {
    setValores((prev) => ({
      ...prev,
      restriccionesDieta: prev.restriccionesDieta.includes(valor)
        ? prev.restriccionesDieta.filter((v) => v !== valor)
        : [...prev.restriccionesDieta, valor],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(valores);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Nombre */}
      <div>
        <label htmlFor="nombre" className={labelClass}>
          Nombre del cliente
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          required
          placeholder="Ej: María García"
          value={valores.nombre}
          onChange={handleChange}
          className="w-full px-4 py-2.5 rounded-lg text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition"
          style={inputStyle}
        />
      </div>

      {/* Objetivo */}
      <div>
        <label htmlFor="objetivo" className={labelClass}>
          Objetivo
        </label>
        <textarea
          id="objetivo"
          name="objetivo"
          required
          rows={3}
          placeholder="Ej: Quiero bajar 5 kg en 3 meses y mejorar mi energía diaria"
          value={valores.objetivo}
          onChange={handleChange}
          className={inputClass}
          style={inputStyle}
        />
      </div>

      {/* Restricciones alimentarias */}
      <div>
        <label htmlFor="restricciones" className={labelClass}>
          Restricciones alimentarias / alergias
        </label>
        <textarea
          id="restricciones"
          name="restricciones"
          rows={3}
          placeholder="Ej: Intolerante a la lactosa, alergia a los frutos secos, vegetariano…"
          value={valores.restricciones}
          onChange={handleChange}
          className={inputClass}
          style={inputStyle}
        />
      </div>

      {/* Restricciones dietéticas (para la selección de comidas del catálogo) */}
      <div>
        <label className={labelClass}>Restricciones dietéticas</label>
        <div className="flex flex-wrap gap-3">
          {OPCIONES_RESTRICCION_DIETA.map((opcion) => (
            <label
              key={opcion.value}
              className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={valores.restriccionesDieta.includes(opcion.value)}
                onChange={() => toggleRestriccionDieta(opcion.value)}
              />
              {opcion.label}
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Se usan para filtrar las comidas del plan nutricional. Ninguna comida seleccionada
          incumplirá estas restricciones.
        </p>
      </div>

      {/* Preferencias alimentarias */}
      <div>
        <label htmlFor="preferenciasAlimentarias" className={labelClass}>
          Preferencias alimentarias
        </label>
        <textarea
          id="preferenciasAlimentarias"
          name="preferenciasAlimentarias"
          rows={3}
          placeholder="Ej: Le encanta el pollo y el arroz, evita el pescado aunque no es alérgico…"
          value={valores.preferenciasAlimentarias}
          onChange={handleChange}
          className={inputClass}
          style={inputStyle}
        />
      </div>

      {/* Nivel de experiencia */}
      <div>
        <label htmlFor="nivelExperiencia" className={labelClass}>
          Nivel de experiencia de entrenamiento
        </label>
        <select
          id="nivelExperiencia"
          name="nivelExperiencia"
          value={valores.nivelExperiencia}
          onChange={handleChange}
          className="w-full px-4 py-2.5 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none cursor-pointer"
          style={inputStyle}
        >
          <option value="" style={{ color: "#6b7280" }}>
            Sin especificar
          </option>
          <option value="principiante">Principiante</option>
          <option value="intermedio">Intermedio</option>
          <option value="avanzado">Avanzado</option>
        </select>
      </div>

      {/* Equipamiento disponible */}
      <div>
        <label htmlFor="equipamientoDisponible" className={labelClass}>
          Equipamiento disponible
        </label>
        <textarea
          id="equipamientoDisponible"
          name="equipamientoDisponible"
          rows={2}
          placeholder="Ej: Gimnasio completo, casa con mancuernas, sin material, otro…"
          value={valores.equipamientoDisponible}
          onChange={handleChange}
          className={inputClass}
          style={inputStyle}
        />
      </div>

      {/* Historial de lesiones */}
      <div>
        <label htmlFor="historialLesiones" className={labelClass}>
          Historial de lesiones o limitaciones físicas
        </label>
        <textarea
          id="historialLesiones"
          name="historialLesiones"
          rows={3}
          placeholder="Ej: Molestias lumbares, cirugía de rodilla en 2022…"
          value={valores.historialLesiones}
          onChange={handleChange}
          className={inputClass}
          style={inputStyle}
        />
      </div>

      {/* Datos físicos para el cálculo calórico */}
      <div className="pt-2 border-t border-white/10">
        <p className="text-sm font-semibold text-gray-200 mb-3">
          Datos físicos (para calcular el objetivo calórico)
        </p>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label htmlFor="edad" className={labelClass}>
              Edad
            </label>
            <input
              id="edad"
              name="edad"
              type="number"
              step="1"
              min="0"
              placeholder="35"
              value={valores.edad}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-lg text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition"
              style={inputStyle}
            />
          </div>
          <div>
            <label htmlFor="pesoKg" className={labelClass}>
              Peso (kg)
            </label>
            <input
              id="pesoKg"
              name="pesoKg"
              type="number"
              step="0.1"
              min="0"
              placeholder="70"
              value={valores.pesoKg}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-lg text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition"
              style={inputStyle}
            />
          </div>
          <div>
            <label htmlFor="alturaCm" className={labelClass}>
              Altura (cm)
            </label>
            <input
              id="alturaCm"
              name="alturaCm"
              type="number"
              step="0.1"
              min="0"
              placeholder="175"
              value={valores.alturaCm}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-lg text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Sexo biológico */}
        <div className="mb-4">
          <label htmlFor="sexoBiologico" className={labelClass}>
            Sexo biológico
          </label>
          <select
            id="sexoBiologico"
            name="sexoBiologico"
            value={valores.sexoBiologico}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none cursor-pointer"
            style={inputStyle}
          >
            <option value="" style={{ color: "#6b7280" }}>
              Sin especificar
            </option>
            <option value="hombre">Hombre</option>
            <option value="mujer">Mujer</option>
          </select>
        </div>

        {/* Nivel de actividad diaria */}
        <div className="mb-4">
          <label htmlFor="nivelActividad" className={labelClass}>
            Nivel de actividad diaria
          </label>
          <select
            id="nivelActividad"
            name="nivelActividad"
            value={valores.nivelActividad}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none cursor-pointer"
            style={inputStyle}
          >
            <option value="" style={{ color: "#6b7280" }}>
              Sin especificar
            </option>
            <option value="sedentario">Sedentario</option>
            <option value="ligero">Ligero</option>
            <option value="moderado">Moderado</option>
            <option value="activo">Activo</option>
            <option value="muy_activo">Muy activo</option>
          </select>
        </div>

        {/* Método de cálculo */}
        <div>
          <label htmlFor="metodoCalculo" className={labelClass}>
            Método de cálculo
          </label>
          <select
            id="metodoCalculo"
            name="metodoCalculo"
            value={valores.metodoCalculo}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none cursor-pointer"
            style={inputStyle}
          >
            <option value="mifflin_st_jeor">Mifflin-St Jeor (recomendado)</option>
            <option value="harris_benedict">Harris-Benedict</option>
            <option value="manual">Manual</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Cómo calculamos el objetivo calórico — puedes cambiarlo si prefieres otro método
          </p>
        </div>

        {/* Objetivo calórico manual */}
        {valores.metodoCalculo === "manual" && (
          <div className="mt-4">
            <label htmlFor="objetivoCaloricoManual" className={labelClass}>
              Objetivo calórico (kcal/día)
            </label>
            <input
              id="objetivoCaloricoManual"
              name="objetivoCaloricoManual"
              type="number"
              step="1"
              min="0"
              required
              placeholder="2000"
              value={valores.objetivoCaloricoManual}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition"
              style={inputStyle}
            />
          </div>
        )}
      </div>

      {/* Tipo de plan */}
      <div>
        <label htmlFor="tipoPlan" className={labelClass}>
          Tipo de plan
        </label>
        <select
          id="tipoPlan"
          name="tipoPlan"
          required
          value={valores.tipoPlan}
          onChange={handleChange}
          className="w-full px-4 py-2.5 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none cursor-pointer"
          style={inputStyle}
        >
          <option value="" disabled style={{ color: "#6b7280" }}>
            Selecciona un tipo de plan
          </option>
          <option value="perdida-peso">Pérdida de peso</option>
          <option value="ganancia-muscular">Ganancia muscular</option>
          <option value="mantenimiento">Mantenimiento</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="w-full py-3 rounded-lg font-semibold text-white text-sm tracking-wide transition-all duration-200 hover:opacity-90 active:scale-95 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ backgroundColor: "#e94560" }}
      >
        {enviando
          ? "Guardando…"
          : textoBoton ?? (modo === "editar" ? "Guardar cambios" : "Generar plan")}
      </button>
    </form>
  );
}
