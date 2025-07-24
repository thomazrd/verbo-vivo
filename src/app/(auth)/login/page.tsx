
"use client"
import { LoginForm } from "@/components/auth/LoginForm";
import { BookHeart } from "lucide-react";
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from 'react';

function LoginPageContent() {
  return (
    <Card className="w-full max-w-md border">
      <CardHeader className="items-center text-center space-y-3">
        <BookHeart className="h-10 w-10 text-primary" />
        <CardTitle className="text-2xl font-bold tracking-tight">
          Bem-vindo de volta
        </CardTitle>
        <CardDescription>
          Faça login para continuar sua jornada de discipulado digital.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <LoginForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Não tem uma conta?{" "}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Cadastre-se
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <LoginPageContent />
    </Suspense>
  )
}
