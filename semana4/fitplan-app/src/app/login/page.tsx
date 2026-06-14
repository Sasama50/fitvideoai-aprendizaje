"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#1a1a2e" }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">FitPlan AI</h1>
          <p className="text-gray-400 text-sm">Inicia sesión para continuar</p>
        </div>

        <div className="rounded-2xl p-8 shadow-2xl" style={{ backgroundColor: "#16213e" }}>
          <h2 className="text-lg font-semibold text-white mb-6">Iniciar sesión</h2>

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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
              {loading ? "Entrando..." : "Iniciar sesión"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-400">
            ¿No tienes cuenta?{" "}
            <a href="/registro" className="text-indigo-400 hover:underline">
              Regístrate
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
