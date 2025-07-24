
// This page is a placeholder for the full implementation of the suggestions management.
// For now, it will just show a title and a link back to the dashboard.
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function SuggestionsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <h1 className="text-3xl font-bold">Sugestões dos Usuários</h1>
       <Card>
        <CardHeader>
            <CardTitle>Voz da Comunidade</CardTitle>
            <CardDescription>Analise e transforme as sugestões da comunidade em novos estudos.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">A gestão de sugestões será implementada aqui.</p>
        </CardContent>
      </Card>
    </div>
  );
}

    