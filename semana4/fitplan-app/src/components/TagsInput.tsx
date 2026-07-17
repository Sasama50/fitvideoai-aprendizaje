"use client";

import { useState } from "react";

type Props = {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
};

const inputStyle = { backgroundColor: "#0f3460" };

export default function TagsInput({ values, onChange, placeholder }: Props) {
  const [texto, setTexto] = useState("");

  const añadir = () => {
    const valor = texto.trim();
    if (!valor) return;
    if (!values.some((v) => v.toLowerCase() === valor.toLowerCase())) {
      onChange([...values, valor]);
    }
    setTexto("");
  };

  const quitar = (valor: string) => {
    onChange(values.filter((v) => v !== valor));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      añadir();
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-4 py-2.5 rounded-lg text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition"
          style={inputStyle}
        />
        <button
          type="button"
          onClick={añadir}
          className="px-4 py-2.5 rounded-lg text-sm font-medium text-white transition hover:opacity-90"
          style={{ backgroundColor: "#0f3460" }}
        >
          Añadir
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {values.map((valor) => (
            <span
              key={valor}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-indigo-200"
              style={{ backgroundColor: "#1f2a4d" }}
            >
              {valor}
              <button
                type="button"
                onClick={() => quitar(valor)}
                aria-label={`Quitar ${valor}`}
                className="text-indigo-300 hover:text-white transition"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
