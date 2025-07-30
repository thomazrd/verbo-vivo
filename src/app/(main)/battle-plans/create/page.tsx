
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreateBattlePlanPage() {
    const router = useRouter();

    // Esta página será implementada na Fase 2.
    // Por enquanto, exibe uma mensagem de "Em breve".
    return (
        <div className="container mx-auto max-w-4xl py-8 px-4">
             <div className="flex items-center gap-4 mb-8">
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Criar Novo Plano de Batalha</h1>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Em Breve</CardTitle>
                    <CardDescription>
                        A ferramenta de criação de Planos de Batalha para líderes está em desenvolvimento.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Em breve, você poderá criar e compartilhar suas próprias jornadas de discipulado com a comunidade. Agradecemos sua paciência!
                    </p>
                    <Button asChild variant="link" className="px-0">
                        <Link href="/battle-plans">Voltar para o Centro de Treinamento</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
