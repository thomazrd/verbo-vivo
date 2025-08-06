
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check, User, Heart, BookOpen, Users } from "lucide-react";

export interface Goal {
    id: string;
    text: string;
    icon: React.ElementType;
}

const goals: Goal[] = [
    { id: 'grow_relationship', text: "Crescer em meu relacionamento com Deus", icon: User },
    { id: 'build_prayer_habit', text: "Construir um hábito de oração consistente", icon: Heart },
    { id: 'understand_bible', text: "Entender melhor a Bíblia", icon: BookOpen },
    { id: 'connect_christians', text: "Conectar-me com outros cristãos", icon: Users },
];

interface GoalSelectionStepProps {
    onNext: (goals: Goal[]) => void;
}

export function GoalSelectionStep({ onNext }: GoalSelectionStepProps) {
    const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

    const toggleGoal = (goalId: string) => {
        setSelectedGoals(prev => 
            prev.includes(goalId) ? prev.filter(id => id !== goalId) : [...prev, goalId]
        );
    }
    
    const handleSubmit = () => {
        const selected = goals.filter(g => selectedGoals.includes(g.id));
        onNext(selected);
    }

    return (
        <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Qual o seu principal objetivo?</h1>
            <p className="mt-2 text-lg text-muted-foreground max-w-xl mx-auto">
                Saber o seu "porquê" nos ajuda a personalizar sua jornada. Você pode escolher mais de um.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                {goals.map(goal => (
                    <Card 
                        key={goal.id} 
                        onClick={() => toggleGoal(goal.id)}
                        className={cn(
                            "cursor-pointer transition-all duration-200",
                            selectedGoals.includes(goal.id) ? "border-primary ring-2 ring-primary/50" : "hover:border-muted-foreground/50"
                        )}
                    >
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className={cn(
                                "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                                selectedGoals.includes(goal.id) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}>
                                <goal.icon className="h-6 w-6" />
                            </div>
                            <span className="font-semibold text-left flex-1">{goal.text}</span>
                             {selectedGoals.includes(goal.id) && <Check className="h-5 w-5 text-primary" />}
                        </CardContent>
                    </Card>
                ))}
            </div>
             <Button size="lg" className="mt-8" onClick={handleSubmit} disabled={selectedGoals.length === 0}>
                Continuar
            </Button>
        </div>
    );
}

