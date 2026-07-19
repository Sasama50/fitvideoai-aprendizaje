"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Paso = 1 | 2 | 3 | 4;
type AvatarStatus = "processing" | "ready" | "failed" | null;

export default function OnboardingPage() {
  const [paso, setPaso] = useState<Paso>(1);
  const [plan, setPlan] = useState<string | null>(null);

  // Paso 1 — marca
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [colorPrincipal, setColorPrincipal] = useState("#E8463A");
  const [cargandoMarca, setCargandoMarca] = useState(false);
  const [errorMarca, setErrorMarca] = useState("");

  // Paso 2 — voz
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [clonandoVoz, setClonandoVoz] = useState(false);
  const [errorVoz, setErrorVoz] = useState("");

  // Paso 3 — avatar (solo plan Studio)
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [creandoAvatar, setCreandoAvatar] = useState(false);
  const [comprobandoAvatar, setComprobandoAvatar] = useState(false);
  const [errorAvatar, setErrorAvatar] = useState("");
  const [avatarStatus, setAvatarStatus] = useState<AvatarStatus>(null);
  const [consentUrl, setConsentUrl] = useState<string | null>(null);
  const [errorDetalleAvatar, setErrorDetalleAvatar] = useState<string | null>(null);

  const esStudio = plan === "studio";
  const totalPasos = esStudio ? 3 : 2;

  useEffect(() => {
    const cargarPerfil = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profesional } = await supabase
        .from("profesionales")
        .select("plan, heygen_avatar_status")
        .eq("user_id", user.id)
        .maybeSingle();

      setPlan(profesional?.plan ?? "pro");
      setAvatarStatus((profesional?.heygen_avatar_status as AvatarStatus) ?? null);
    };

    cargarPerfil();
  }, []);

  useEffect(() => {
    if (paso !== 3 || avatarStatus !== "processing") return;
    const interval = setInterval(() => comprobarEstadoAvatar(), 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso, avatarStatus]);

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

      setPaso(esStudio ? 3 : 4);
    } catch (err) {
      setErrorVoz(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setClonandoVoz(false);
    }
  };

  const comprobarEstadoAvatar = async (refrescarConsentimiento = false) => {
    setComprobandoAvatar(true);
    try {
      const res = await fetch(
        `/api/onboarding/avatar-status${refrescarConsentimiento ? "?refrescar_consentimiento=1" : ""}`
      );
      const json = await res.json();

      if (res.ok) {
        setAvatarStatus((json.heygen_avatar_status as AvatarStatus) ?? null);
        if (json.consent_url) setConsentUrl(json.consent_url);
        setErrorDetalleAvatar(json.error_detalle ?? null);
      }
    } finally {
      setComprobandoAvatar(false);
    }
  };

  const handleCrearAvatar = async () => {
    setErrorAvatar("");

    if (!videoFile) {
      setErrorAvatar("Selecciona un vídeo primero.");
      return;
    }

    setCreandoAvatar(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorAvatar("No hay sesión activa. Inicia sesión de nuevo.");
        return;
      }

      const path = `${user.id}-${Date.now()}-${videoFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("avatares")
        .upload(path, videoFile, {
          contentType: videoFile.type,
          upsert: true,
        });

      if (uploadError) {
        setErrorAvatar(`Error al subir el vídeo: ${uploadError.message}`);
        return;
      }

      const { data: urlData } = supabase.storage.from("avatares").getPublicUrl(path);

      const res = await fetch("/api/onboarding/crear-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_url: urlData.publicUrl }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorAvatar(json.error || "No se pudo crear el avatar.");
        return;
      }

      setErrorDetalleAvatar(null);
      setAvatarStatus("processing");
      setConsentUrl(json.consent_url ?? null);
    } catch (err) {
      setErrorAvatar(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setCreandoAvatar(false);
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
          <p className="text-gray-400 text-sm">
            Paso {Math.min(paso, totalPasos)} de {totalPasos}
          </p>
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
            <>
              <h2 className="text-xl font-semibold text-white mb-2">Tu avatar</h2>
              <p className="text-gray-400 text-sm mb-6">
                Graba (o sube ya grabado) un vídeo de unos 2 minutos hablando a cámara: busca buena
                luz, mira al objetivo y habla con naturalidad. Con esto creamos tu avatar clonado
                para los vídeos semanales de tus clientes.
              </p>

              <div className="space-y-5">
                {(avatarStatus === null || avatarStatus === "failed") && (
                  <>
                    {avatarStatus === "failed" && (
                      <p className="text-sm text-red-400">
                        No se pudo generar tu avatar
                        {errorDetalleAvatar ? `: ${errorDetalleAvatar}` : "."} Puedes volver a
                        subir el vídeo para reintentarlo.
                      </p>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Vídeo de entrenamiento
                      </label>
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime,video/webm"
                        onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                        className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:text-white file:cursor-pointer"
                        style={{ backgroundColor: "#0f3460" }}
                      />
                    </div>

                    {errorAvatar && <p className="text-sm text-red-400">{errorAvatar}</p>}

                    <button
                      type="button"
                      onClick={handleCrearAvatar}
                      disabled={creandoAvatar}
                      className="w-full py-3 rounded-lg font-semibold text-white text-sm tracking-wide transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-50"
                      style={{ backgroundColor: "#e94560" }}
                    >
                      {creandoAvatar
                        ? "Subiendo y creando avatar..."
                        : avatarStatus === "failed"
                        ? "Reintentar"
                        : "Crear mi avatar"}
                    </button>
                  </>
                )}

                {avatarStatus === "processing" && (
                  <>
                    <p className="text-sm text-indigo-300">
                      Tu avatar se está generando — puede tardar hasta 2 horas. Puedes volver a
                      esta pantalla más tarde para comprobar el estado.
                    </p>

                    {consentUrl ? (
                      <a
                        href={consentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center py-3 rounded-lg font-semibold text-white text-sm tracking-wide transition-all duration-200 hover:opacity-90 active:scale-95"
                        style={{ backgroundColor: "#6366f1" }}
                      >
                        Completa tu consentimiento en HeyGen →
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => comprobarEstadoAvatar(true)}
                        disabled={comprobandoAvatar}
                        className="w-full py-3 rounded-lg font-semibold text-white text-sm tracking-wide transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-50"
                        style={{ backgroundColor: "#6366f1" }}
                      >
                        Obtener enlace de consentimiento
                      </button>
                    )}
                    <p className="text-xs text-gray-500">
                      HeyGen necesita que grabes una breve declaración de consentimiento por
                      webcam antes de poder entrenar tu avatar.
                    </p>

                    <button
                      type="button"
                      onClick={() => comprobarEstadoAvatar()}
                      disabled={comprobandoAvatar}
                      className="w-full py-3 rounded-lg font-semibold text-white text-sm tracking-wide transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-50"
                      style={{ backgroundColor: "#0f3460" }}
                    >
                      {comprobandoAvatar ? "Comprobando..." : "Comprobar estado ahora"}
                    </button>
                  </>
                )}

                {avatarStatus === "ready" && (
                  <p className="text-sm text-green-400">
                    ✓ Tu avatar está listo. Ya puedes generar vídeos semanales con tu propio avatar
                    clonado.
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => setPaso(4)}
                  className="w-full py-3 rounded-lg font-semibold text-sm tracking-wide transition-all duration-200 hover:opacity-90 active:scale-95 text-gray-300"
                  style={{ backgroundColor: "transparent", border: "1px solid #2a2a4a" }}
                >
                  {avatarStatus === "ready" ? "Continuar" : "Continuar más tarde →"}
                </button>
              </div>
            </>
          )}

          {paso === 4 && (
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
