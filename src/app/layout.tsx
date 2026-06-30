import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "Solaire Solar — Homologação de Projetos Fotovoltaicos",
  description:
    "Sistema de homologação de projetos de energia solar para CEEE e RGE. Gere documentos automaticamente e agilize seu processo de homologação.",
  keywords: [
    "energia solar",
    "homologação",
    "CEEE",
    "RGE",
    "fotovoltaico",
    "projeto solar",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

