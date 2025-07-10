"use client"

import * as React from "react"

// This component is temporarily modified to work around a package incompatibility.
// The original `next-themes` functionality is disabled.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
