
"use client";

import { Inter as FontSans, JetBrains_Mono as FontMono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";
import I18nInitializer from "@/components/layout/I18nInitializer";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

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
  const { i18n } = useTranslation();

  useEffect(() => {
    if (document.documentElement.lang !== i18n.language) {
      document.documentElement.lang = i18n.language;
    }
  }, [i18n.language]);


  return (
    // O atributo `lang` será definido dinamicamente pelo useEffect para evitar erros de hidratação.
    <html suppressHydrationWarning>
      <head>
        <title>Verbo Vivo</title>
        <meta name="description" content="Seu assistente de discipulado digital." />
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
