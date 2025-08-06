
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Calendar, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "../ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface HabitSetupStepProps {
    onBack: () => void;
    onFinish: () => void;
}

export function HabitSetupStep({ onBack, onFinish }: HabitSetupStepProps) {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleFinishClick = async () => {
        setIsLoading(true);
        // Em uma aplicação real, aqui salvaríamos a preferência do hábito.
        // Por agora, apenas finalizamos o onboarding.
        await onFinish();
        setIsLoading(false);
    }
    
    return (
         <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Vamos construir um hábito</h1>
            <p className="mt-2 text-lg text-muted-foreground max-w-xl mx-auto">
                Começar pequeno é o segredo. Configure sua primeira prática diária para fortalecer sua fé.
            </p>
            
             <div className="mt-8 max-w-md mx-auto">
                 <Card className="border-primary ring-2 ring-primary/50">
                    <CardContent className="p-4 flex items-center gap-4">
                         <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-primary text-primary-foreground">
                            <Calendar className="h-6 w-6"/>
                        </div>
                        <div className="text-left">
                            <p className="font-semibold">Ler o Versículo do Dia</p>
                            <p className="text-sm text-muted-foreground">Receba uma pílula de sabedoria todo dia.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
             <div className="mt-8 flex justify-center gap-4">
                <Button variant="outline" size="lg" onClick={onBack}>Voltar</Button>
                <Button size="lg" onClick={handleFinishClick} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4" />}
                    Concluir
                </Button>
             </div>
        </div>
    );
}
