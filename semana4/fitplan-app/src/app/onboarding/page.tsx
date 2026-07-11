"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Paso = 1 | 2 | 3;

export default function OnboardingPage() {
  const [paso, setPaso] = useState<Paso>(1);

  // Paso 1 — marca
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [colorPrincipal, setColorPrincipal] = useState("#E8463A");
  const [cargandoMarca, setCargandoMarca] = useState(false);
  const [errorMarca, setErrorMarca] = useState("");

  // Paso 2 — voz
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [clonandoVoz, setClonandoVoz] = useState(false);
  const [errorVoz, setErrorVoz] = useState("");

  const handleContinuarMarca = async () => {
    setErrorMarca("");
    setCargandoMarca(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMarca("No hay sesión activa. Inicia sesión de nuevo.");
        return;
      }

      let logoUrl: string | undefined;

      if (logoFile) {
        const path = `${user.id}-${Date.now()}-${logoFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("logos")
          .upload(path, logoFile, {
            contentType: logoFile.type,
            upsert: true,
          });

        if (uploadError) {
          setErrorMarca(`Error al subir el logo: ${uploadError.message}`);
          return;
        }

        const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
        logoUrl = urlData.publicUrl;
      }

      const { error: upsertError } = await supabase.from("profesionales").upsert(
        {
          user_id: user.id,
          email: user.email,
          color_principal: colorPrincipal,
          ...(logoUrl ? { logo_url: logoUrl } : {}),
        },
        { onConflict: "user_id" }
      );

      if (upsertError) {
        setErrorMarca(`Error al guardar tu marca: ${upsertError.message}`);
        return;
      }

      setPaso(2);
    } catch (err) {
      setErrorMarca(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setCargandoMarca(false);
    }
  };

  const handleClonarVoz = async () => {
    setErrorVoz("");

    if (!audioFile) {
      setErrorVoz("Selecciona un archivo de audio primero.");
      return;
    }

    setClonandoVoz(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorVoz("No hay sesión activa. Inicia sesión de nuevo.");
        return;
      }

      const formData = new FormData();
      formData.append("audio", audioFile);
      formData.append("user_id", user.id);

      const res = await fetch("/api/onboarding/crear-voz", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorVoz(json.error || "No se pudo clonar la voz.");
        return;
      }

      setPaso(3);
    } catch (err) {
      setErrorVoz(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setClonandoVoz(false);
    }
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: "#1a1a2e" }}
    >
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Configura tu cuenta</h1>
          <p className="text-gray-400 text-sm">Paso {Math.min(paso, 2)} de 2</p>
        </div>

        <div className="rounded-2xl p-8 shadow-2xl" style={{ backgroundColor: "#16213e" }}>
          {paso === 1 && (
            <>
              <h2 className="text-xl font-semibold text-white mb-2">Tu marca</h2>
              <p className="text-gray-400 text-sm mb-6">
                Sube tu logo y elige el color principal que verán tus clientes en sus planes.
              </p>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Logo</label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                    className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:text-white file:cursor-pointer"
                    style={{ backgroundColor: "#0f3460" }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Color principal
                  </label>
                  <input
                    type="color"
                    value={colorPrincipal}
                    onChange={(e) => setColorPrincipal(e.target.value)}
                    className="h-10 w-20 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                </div>

                {errorMarca && <p className="text-sm text-red-400">{errorMarca}</p>}

                <button
                  type="button"
                  onClick={handleContinuarMarca}
                  disabled={cargandoMarca}
                  className="w-full py-3 rounded-lg font-semibold text-white text-sm tracking-wide transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: "#e94560" }}
                >
                  {cargandoMarca ? "Guardando..." : "Continuar"}
                </button>
              </div>
            </>
          )}

          {paso === 2 && (
            <>
              <h2 className="text-xl font-semibold text-white mb-2">Tu voz</h2>
              <p className="text-gray-400 text-sm mb-6">
                Graba o sube 1 minuto de tu voz hablando con naturalidad (puedes usar la app de
                notas de voz del móvil). Esto nos permite clonar tu voz para narrar los planes de
                tus clientes.
              </p>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Archivo de audio
                  </label>
                  <input
                    type="file"
                    accept="audio/mpeg,audio/wav,audio/mp4,audio/x-m4a"
                    onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                    className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:text-white file:cursor-pointer"
                    style={{ backgroundColor: "#0f3460" }}
                  />
                </div>

                {clonandoVoz && (
                  <p className="text-sm text-indigo-300">
                    Clonando tu voz, esto puede tardar unos segundos...
                  </p>
                )}

                {errorVoz && <p className="text-sm text-red-400">{errorVoz}</p>}

                <button
                  type="button"
                  onClick={handleClonarVoz}
                  disabled={clonandoVoz}
                  className="w-full py-3 rounded-lg font-semibold text-white text-sm tracking-wide transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: "#e94560" }}
                >
                  {clonandoVoz ? "Clonando..." : "Clonar mi voz"}
                </button>
              </div>
            </>
          )}

          {paso === 3 && (
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white mb-3">
                ¡Todo listo! Tu marca y tu voz están configuradas.
              </h2>
              <Link
                href="/"
                className="inline-block mt-4 py-3 px-6 rounded-lg font-semibold text-white text-sm tracking-wide transition-all duration-200 hover:opacity-90 active:scale-95"
                style={{ backgroundColor: "#e94560" }}
              >
                Ir al dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
