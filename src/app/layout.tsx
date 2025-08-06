
"use client";

import { Montserrat, Noto_Serif, Noto_Sans_JP, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import "@/i18n"; // Import to initialize i18next
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";
import I18nInitializer from "@/components/layout/I18nInitializer";

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

  // This component no longer has the responsibility of generating dynamic meta tags.
  // The `generateMetadata` function has been moved to the specific pages that need it,
  // such as the study detail page.

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Dynamic meta tags will be injected by Next.js here */}
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
