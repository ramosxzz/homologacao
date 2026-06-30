import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

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
    <html lang="pt-BR" className={`${inter.variable} ${jetbrains.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
