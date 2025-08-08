
"use client";

import { Montserrat, Noto_Serif, Noto_Sans_JP, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import "@/i18n"; // Import to initialize i18next
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";
import I18nInitializer from "@/components/layout/I18nInitializer";
import { useEffect } from "react";

const fontSans = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = Noto_Serif({
  subsets: ["latin"],
  variable: "--font-serif",
});

const fontJp = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-jp",
});

const fontSc = Noto_Sans_SC({
  subsets: ["latin"],
  variable: "--font-sc",
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('SW registered: ', registration);
        }).catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
      });
    }
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1F61E2" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png"></link>
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
          fontSerif.variable,
          fontJp.variable,
          fontSc.variable
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
