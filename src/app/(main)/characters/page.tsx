"use client";

import { useState } from 'react';
import Link from 'next/link';
import { bibleCharacters } from '@/lib/bible-characters';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowRight, Users, Search } from 'lucide-react';

export default function CharactersListPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCharacters = bibleCharacters.filter((character) =>
    character.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Personagens Bíblicos</h1>
        <p className="mt-1 text-muted-foreground">
          Explore as histórias e lições de figuras importantes da Bíblia.
        </p>
        <div className="mt-4 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Pesquisar por personagem..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {bibleCharacters.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50 p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-xl font-semibold">Nenhum personagem encontrado</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            O conteúdo sobre personagens bíblicos está sendo preparado.
          </p>
        </div>
      ) : filteredCharacters.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50 p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">Nenhum personagem encontrado</h3>
            <p className="mt-2 text-sm text-muted-foreground">
                Tente uma pesquisa diferente.
            </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCharacters.map((character) => (
            <Link href={`/characters/${character.id}`} key={character.id} className="group block">
              <Card className="flex h-full flex-col overflow-hidden transition-all group-hover:shadow-md group-hover:border-primary/50">
                <CardHeader>
                  <CardTitle>{character.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {character.summary}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-end p-4 pt-0">
                    <div className="flex items-center text-sm font-semibold text-primary">
                        Ver Perfil
                        <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
