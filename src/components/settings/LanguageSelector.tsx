'use client';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Language {
  code: string;
  name: string;
  nativeName?: string;
}

interface LanguageSelectorProps {
  onLanguageSave?: (newLangCode: string) => Promise<void>;
}

const supportedLanguages: Language[] = [
  { code: 'pt', name: 'Português', nativeName: 'Português (Brasil)' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'zh', name: 'Chinese', nativeName: '中文 (Simplificado)' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
];

export function LanguageSelector({ onLanguageSave }: LanguageSelectorProps) {
  const { i18n, t } = useTranslation();
  const [isSaving, setIsSaving] = React.useState(false);
  const currentLanguage = i18n.language;

  const handleLanguageChange = async (newLangCode: string) => {
    if (newLangCode === currentLanguage) return;

    i18n.changeLanguage(newLangCode);
    if (onLanguageSave) {
      setIsSaving(true);
      try {
        await onLanguageSave(newLangCode);
      } catch (error) {
        console.error("Failed to save language preference:", error);
        // Optionally, revert i18n.changeLanguage or show a toast error
        // For now, we assume i18n change is fine, but save might fail
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Ensure currentLanguage is a valid supported language code, or fallback to 'pt'
  const displayedLanguage = supportedLanguages.some(lang => lang.code === currentLanguage)
    ? currentLanguage
    : 'pt';

  return (
    <div className="space-y-2">
      <Label htmlFor="language-select">{t('language_setting_label') || 'Idioma'}</Label>
      <Select value={displayedLanguage} onValueChange={handleLanguageChange}>
        <SelectTrigger id="language-select" className="w-[280px]">
          <SelectValue placeholder={t('select_language_placeholder') || 'Selecione um idioma'} />
        </SelectTrigger>
        <SelectContent>
          {supportedLanguages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.nativeName || lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {t('language_setting_description') || 'Escolha o idioma de exibição da interface.'}
      </p>
    </div>
  );
}
