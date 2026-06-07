import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FitPlan AI - Generador de planes nutricionales",
  description: "Genera tu plan nutricional personalizado con inteligencia artificial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
