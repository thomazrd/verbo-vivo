'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Opcionalmente, registre o erro em um serviço de relatório de erros
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <Card className="w-full max-w-lg text-center">
                 <CardHeader>
                    <div className="flex justify-center mb-4">
                        <AlertTriangle className="h-12 w-12 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Ocorreu um Erro</CardTitle>
                    <CardDescription>
                        Desculpe, algo deu errado ao carregar a aplicação.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Você pode tentar recarregar a página ou clicar no botão abaixo.
                    </p>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button onClick={() => reset()}>Tentar Novamente</Button>
                </CardFooter>
            </Card>
        </main>
      </body>
    </html>
  );
}
