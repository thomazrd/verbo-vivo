
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BibleVersion } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";
import { BookMarked } from 'lucide-react';

interface BibleVersionSelectorProps {
  mobile?: boolean;
}

export function BibleVersionSelector({ mobile = false }: BibleVersionSelectorProps) {
  const { user, userProfile } = useAuth();
  const { i18n, t } = useTranslation();
  const { toast } = useToast();

  const [bibleVersions, setBibleVersions] = useState<BibleVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const lang = i18n.language.split('-')[0];
  const preferredVersion = userProfile?.preferredBibleVersion;

  useEffect(() => {
    const fetchVersions = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`/api/bible/versions?lang=${lang}`);
        setBibleVersions(response.data);
      } catch (error) {
        console.error("Failed to fetch bible versions", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVersions();
  }, [lang]);

  const handlePreferenceChange = async (versionId: string) => {
    if (!user) return;

    const selectedVersion = bibleVersions.find(v => v.id === versionId);
    if (!selectedVersion) return;

    try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { preferredBibleVersion: selectedVersion });
        toast({
            title: t('toast_bible_version_updated_title'),
            description: t('toast_bible_version_updated_desc', { version: selectedVersion.name }),
        });
    } catch (error) {
        console.error(`Error changing preferredBibleVersion:`, error);
        toast({
            variant: "destructive",
            title: 'Erro',
            description: 'Não foi possível salvar sua preferência.',
        });
    }
  };

  if (mobile) {
    return (
        <div className="space-y-2 px-3">
            <Label>{t('bible_version_label')}</Label>
            <Select
                value={preferredVersion?.id}
                onValueChange={handlePreferenceChange}
                disabled={isLoading || bibleVersions.length === 0}
            >
                <SelectTrigger>
                    <SelectValue placeholder={t('select_bible_version_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                    {isLoading ? (
                        <div className="p-2">Carregando...</div>
                    ) : (
                        bibleVersions.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                                {v.name}
                            </SelectItem>
                        ))
                    )}
                </SelectContent>
            </Select>
        </div>
    )
  }

  return (
        <Select
            value={preferredVersion?.id}
            onValueChange={handlePreferenceChange}
            disabled={isLoading || bibleVersions.length === 0}
        >
            <SelectTrigger className="w-auto h-9 gap-2 border-none bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-0">
                <BookMarked className="h-4 w-4" />
                <SelectValue placeholder={t('version_placeholder')} />
            </SelectTrigger>
            <SelectContent>
                {isLoading ? (
                    <div className="p-2">Carregando...</div>
                ) : (
                    bibleVersions.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                            {v.name}
                        </SelectItem>
                    ))
                )}
            </SelectContent>
        </Select>
  );
}
