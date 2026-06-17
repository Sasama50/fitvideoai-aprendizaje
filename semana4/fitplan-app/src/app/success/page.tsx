import Link from "next/link";

export default function SuccessPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#1a1a2e" }}
    >
      <div
        className="rounded-2xl p-12 shadow-2xl text-center max-w-md w-full"
        style={{ backgroundColor: "#16213e" }}
      >
        <h1 className="text-4xl font-bold text-white mb-4">
          ¡Pago completado! 🎉
        </h1>
        <p className="text-gray-400 mb-8">
          Ya tienes acceso al Plan Pro FitVideoAI. ¡Empieza a generar planes
          personalizados para tus clientes!
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-lg font-semibold text-white text-sm tracking-wide transition-all duration-200 hover:opacity-90 active:scale-95"
          style={{ backgroundColor: "#e94560" }}
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
