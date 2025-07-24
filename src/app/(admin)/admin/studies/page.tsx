
// This page is a placeholder for the full implementation of the studies list.
// For now, it will just show a title and a link back to the dashboard.
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function StudiesListPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Estudos</h1>
        <Button asChild>
            <Link href="/admin/studies/create">
                <Plus />
                Criar Novo Estudo
            </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Arsenal de Sabedoria</CardTitle>
            <CardDescription>Gerencie todos os seus estudos, rascunhos e publicações.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">A lista de estudos será implementada aqui.</p>
        </CardContent>
      </Card>
    </div>
  );
}

    