
"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import type { BibleVersion } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';

interface VersionSelectorProps {
  selectedVersion: BibleVersion;
  onVersionChange: (version: BibleVersion) => void;
}

export function VersionSelector({ selectedVersion, onVersionChange }: VersionSelectorProps) {
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const { i18n } = useTranslation();

  const lang = i18n.language.split('-')[0];

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        setLoading(true);
        const response = await axios.get<BibleVersion[]>(`/api/bible/versions?lang=${lang}`);
        setVersions(response.data);
        if (response.data.length > 0 && selectedVersion.language !== lang) {
            onVersionChange(response.data[0]);
        }
      } catch (error) {
        console.error("Erro ao buscar versões:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVersions();
  }, [lang]);

  const handleValueChange = (versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (version) {
        onVersionChange(version);
    }
  }

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
      <Select value={selectedVersion.id} onValueChange={handleValueChange}>
        <SelectTrigger id="version-select">
          <SelectValue placeholder="Selecione uma versão" />
        </SelectTrigger>
        <SelectContent>
          {versions.map((v) => (
            <SelectItem key={v.id} value={v.id}>
              {v.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
