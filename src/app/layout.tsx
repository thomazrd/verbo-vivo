
"use client";

import { Inter as FontSans, JetBrains_Mono as FontMono } from "next/font/google";
import "./globals.css";
import "@/i18n"; // Import to initialize i18next
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";
import I18nInitializer from "@/components/layout/I18nInitializer";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  // Este componente não tem mais a responsabilidade de gerar meta tags dinâmicas.
  // A função `generateMetadata` foi movida para as páginas específicas que precisam dela,
  // como a página de detalhes do estudo.

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* As meta tags dinâmicas serão injetadas pelo Next.js aqui */}
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
          fontMono.variable
        )}
      >
        <I18nInitializer />
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
