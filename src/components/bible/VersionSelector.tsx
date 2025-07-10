
"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import type { BibleVersion } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';

interface VersionSelectorProps {
  selectedVersion: string;
  onVersionChange: (version: string) => void;
}

const versionNames: { [key: string]: string } = {
  nvi: "Nova Versão Internacional",
  ra: "Almeida Revista e Atualizada",
  acf: "Almeida Corrigida Fiel",
  aa: "Almeida Atualizada",
  bbe: "Basic English",
  kjv: "King James Version",
  rvr: "Reina Valera",
};


export function VersionSelector({ selectedVersion, onVersionChange }: VersionSelectorProps) {
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        setLoading(true);
        const response = await axios.get<BibleVersion[]>('/api/bible/versions');
        setVersions(response.data);
      } catch (error) {
        console.error("Erro ao buscar versões:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVersions();
  }, []);

  const getDisplayName = (versionKey: string) => {
    const fullName = versionNames[versionKey];
    const abbreviation = versionKey.toUpperCase();
    return fullName ? `${fullName} (${abbreviation})` : abbreviation;
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>Versão</Label>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="version-select">Versão</Label>
      <Select value={selectedVersion} onValueChange={onVersionChange}>
        <SelectTrigger id="version-select">
          <SelectValue placeholder="Selecione uma versão" />
        </SelectTrigger>
        <SelectContent>
          {versions.map((v) => (
            <SelectItem key={v.version} value={v.version}>
              {getDisplayName(v.version)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
