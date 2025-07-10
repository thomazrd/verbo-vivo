import { SignUpForm } from "@/components/auth/SignUpForm";
import { BookHeart } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";


export default function SignUpPage() {
  return (
    <Card className="w-full max-w-md border">
      <CardHeader className="items-center text-center space-y-3">
        <BookHeart className="h-10 w-10 text-primary" />
        <CardTitle className="text-2xl font-bold tracking-tight">
          Crie sua Conta
        </CardTitle>
        <CardDescription>
          Comece sua jornada de discipulado digital.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <SignUpForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Faça login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
