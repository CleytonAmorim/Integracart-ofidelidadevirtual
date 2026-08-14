import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cartão Fidelidade Digital",
  description: "Fidelidade e CRM para pequenos negócios locais",
};

// viewportFit: "cover" — sem isso, env(safe-area-inset-bottom) (usado nas
// abas fixas do rodapé do painel, ver components/layout/nav-links.tsx) fica
// travado em 0 no Safari/iOS, e o conteúdo por trás do indicador de início
// do iPhone fica sem a folga extra que deveria ter.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
