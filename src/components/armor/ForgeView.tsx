
// This component will be implemented in a future step.
// For now, it serves as a placeholder for the "Forge Armor" page.
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ForgeView({ armorId }: { armorId?: string }) {
    return (
        <div className="container mx-auto max-w-4xl py-8 px-4">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Forjar Armadura</h1>
            <p className="text-muted-foreground mb-8">
                {armorId ? "Editando sua armadura espiritual." : "Crie uma nova armadura para suas batalhas."}
            </p>
            <Card>
                <CardHeader>
                    <CardTitle>Em Breve</CardTitle>
                    <CardDescription>
                        A funcionalidade de criação e edição de armaduras está em desenvolvimento e será disponibilizada em breve.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div>
                        <Label htmlFor="name">Nome da Armadura</Label>
                        <Input id="name" placeholder="Ex: Armadura contra o Medo" disabled />
                    </div>
                     <div>
                        <Label htmlFor="description">Descrição (Missão)</Label>
                        <Textarea id="description" placeholder="Ex: Para momentos de aflição e preocupação" disabled/>
                    </div>
                    <Button disabled>Salvar Armadura</Button>
                </CardContent>
            </Card>
        </div>
    );
}
