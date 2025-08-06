
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";

export interface Topic {
    id: string;
    text: string;
}

const topics: Topic[] = [
    { id: 'anxiety', text: 'Ansiedade' },
    { id: 'faith_work', text: 'Fé e Trabalho' },
    { id: 'parenting', text: 'Criação de Filhos' },
    { id: 'leadership', text: 'Liderança' },
    { id: 'finances', text: 'Finanças' },
    { id: 'forgiveness', text: 'Perdão' },
    { id: 'purpose', text: 'Propósito' },
    { id: 'relationships', text: 'Relacionamentos' },
    { id: 'grief', text: 'Luto' },
    { id: 'evangelism', text: 'Evangelismo' },
    { id: 'marriage', text: 'Casamento' },
    { id: 'addiction', text: 'Vícios' },
];

interface TopicSelectionStepProps {
    onBack: () => void;
    onNext: (topics: Topic[]) => void;
}

export function TopicSelectionStep({ onBack, onNext }: TopicSelectionStepProps) {
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

    const toggleTopic = (topicId: string) => {
        setSelectedTopics(prev => 
            prev.includes(topicId) ? prev.filter(id => id !== topicId) : [...prev, topicId]
        );
    }

    const handleSubmit = () => {
        const selected = topics.filter(t => selectedTopics.includes(t.id));
        onNext(selected);
    }

    return (
        <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Quais tópicos te interessam?</h1>
            <p className="mt-2 text-lg text-muted-foreground max-w-xl mx-auto">
                Isso nos ajudará a recomendar estudos e conteúdos relevantes para você.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
                {topics.map(topic => (
                     <Badge 
                        key={topic.id}
                        variant={selectedTopics.includes(topic.id) ? 'default' : 'outline'}
                        onClick={() => toggleTopic(topic.id)}
                        className="text-base py-2 px-4 cursor-pointer transition-all duration-200"
                    >
                        {topic.text}
                    </Badge>
                ))}
            </div>
             <div className="mt-8 flex justify-center gap-4">
                 <Button variant="outline" size="lg" onClick={onBack}>Voltar</Button>
                <Button size="lg" onClick={handleSubmit} disabled={selectedTopics.length === 0}>
                    Continuar
                </Button>
             </div>
        </div>
    );
}
