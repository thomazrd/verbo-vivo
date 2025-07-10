import { type ReactNode } from 'react';

export default function FullPageLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-muted/30 p-4">
      {children}
    </main>
  );
}
