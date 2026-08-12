"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RegistroPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registrado, setRegistrado] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setRegistrado(true);
  };

  if (registrado) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ backgroundColor: "#1a1a2e" }}
      >
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">FitPlan AI</h1>
          </div>

          <div
            className="rounded-2xl p-8 shadow-2xl text-center"
            style={{ backgroundColor: "#14532d" }}
          >
            <h2 className="text-lg font-semibold text-white mb-3">
              Usuario registrado ✓
            </h2>
            <p className="text-sm text-green-100 mb-6">
              Confirma el email que te hemos enviado a{" "}
              <span className="font-medium">{email}</span> para poder iniciar
              sesión.
            </p>
            <a
              href="/login"
              className="inline-block py-2.5 px-6 rounded-lg font-semibold text-white text-sm tracking-wide transition-all duration-200 hover:opacity-90 active:scale-95"
              style={{ backgroundColor: "#e94560" }}
            >
              Ir a iniciar sesión
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#1a1a2e" }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">FitPlan AI</h1>
          <p className="text-gray-400 text-sm">Crea tu cuenta para empezar</p>
        </div>

        <div className="rounded-2xl p-8 shadow-2xl" style={{ backgroundColor: "#16213e" }}>
          <h2 className="text-lg font-semibold text-white mb-6">Crear cuenta</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 py-2.5 rounded-lg text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition"
                style={{ backgroundColor: "#0f3460" }}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-2.5 rounded-lg text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition"
                style={{ backgroundColor: "#0f3460" }}
              />
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-white text-sm tracking-wide transition-all duration-200 hover:opacity-90 active:scale-95 mt-2 disabled:opacity-50"
              style={{ backgroundColor: "#e94560" }}
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-400">
            ¿Ya tienes cuenta?{" "}
            <a href="/login" className="text-indigo-400 hover:underline">
              Inicia sesión
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
