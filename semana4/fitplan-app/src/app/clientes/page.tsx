export default function Clientes() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: "#1a1a2e" }}
    >
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">FitPlan AI</h1>
          <p className="text-gray-400 text-sm">
            Genera tu plan nutricional personalizado con inteligencia artificial
          </p>
        </div>

        <div
          className="rounded-2xl p-8 shadow-2xl"
          style={{ backgroundColor: "#16213e" }}
        >
          <h2 className="text-xl font-semibold text-white">
            Lista de clientes — próximamente
          </h2>
        </div>
      </div>
    </main>
  );
}
