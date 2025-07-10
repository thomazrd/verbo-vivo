import { type ReactNode } from 'react';
import { BookHeart } from 'lucide-react';

export default function PonteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="py-4 border-b">
        <div className="container mx-auto flex items-center gap-2">
            <BookHeart className="h-6 w-6 text-primary" />
            <span className="font-semibold">Verbo Vivo</span>
        </div>
      </header>
      <main className="bg-slate-50 min-h-screen">
        {children}
      </main>
      <footer className="py-8 bg-slate-100 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Verbo Vivo. Todos os direitos reservados.</p>
        </div>
      </footer>
    </>
  );
}
