import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// El enlace de confirmación por defecto de Supabase (implicit flow) deja la
// sesión en un fragmento #access_token de la URL, que nunca llega al
// servidor: el middleware ve la primera petición a "/" sin cookie de sesión
// y, al no ser ruta pública, redirige a /login perdiendo esos tokens.
// Esta ruta intercambia el token_hash del email por una sesión real
// server-side (cookies ya establecidas) antes de redirigir al destino, para
// que el middleware SÍ vea al usuario autenticado en la siguiente petición.
//
// Requiere que la plantilla "Confirm signup" en Supabase Dashboard →
// Authentication → Email Templates use:
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirmacion_invalida`);
}
