
import { type ReactNode } from 'react';
import { BookHeart } from 'lucide-react';
import { Manrope } from "next/font/google";
import { cn } from '@/lib/utils';

const fontSerif = Manrope({
  subsets: ["latin"],
  variable: "--font-serif",
});


export default function PonteLayout({ children }: { children: ReactNode }) {
  return (
    <div className={cn("min-h-screen", fontSerif.variable)}>
      <header className="py-4 border-b bg-background">
        <div className="container mx-auto flex items-center gap-2">
            <BookHeart className="h-6 w-6 text-primary" />
            <span className="font-semibold">Verbo Vivo</span>
        </div>
      </header>
      <main className="bg-slate-50 font-serif">
        {children}
      </main>
      <footer className="py-8 bg-slate-100 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Verbo Vivo. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
