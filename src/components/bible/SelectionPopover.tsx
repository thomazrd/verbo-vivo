

"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Book, Sparkles, Loader2 } from 'lucide-react';
import axios from 'axios';
import { explainPassage } from '@/ai/flows/explain-passage-flow';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { ExplanationCard } from './ExplanationCard';
import { useAiCreditManager } from '@/hooks/use-ai-credit-manager';

interface SelectionPopoverProps {
  children: React.ReactNode;
  containerRef: React.RefObject<HTMLElement>;
}

export function SelectionPopover({ children, containerRef }: SelectionPopoverProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const { withCreditCheck, CreditModal } = useAiCreditManager();

  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [isSingleWord, setIsSingleWord] = useState(false);

  const [definition, setDefinition] = useState<any[] | null>(null);
  const [isDefining, setIsDefining] = useState(false);
  const [definitionError, setDefinitionError] = useState<string | null>(null);

  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanationError, setExplanationError] = useState<string | null>(null);

  const clearState = () => {
    setDefinition(null);
    setDefinitionError(null);
    setExplanation(null);
    setExplanationError(null);
  }

  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setIsOpen(false);
      clearState();
      return;
    }

    const text = selection.toString().trim();
    if (text.length > 0 && containerRef.current?.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      setSelectedText(text);
      setIsSingleWord(!/\\s/.test(text)); // Check if there's any whitespace
      setPosition({
        top: rect.top - containerRect.top - 10,
        left: rect.left - containerRect.left + rect.width / 2,
      });
      setIsOpen(true);
      clearState();
    } else {
        setIsOpen(false);
        clearState();
    }
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mouseup', handleSelection);
      document.addEventListener('selectionchange', handleSelection);
      return () => {
        container.removeEventListener('mouseup', handleSelection);
        document.removeEventListener('selectionchange', handleSelection);
      };
    }
  }, [handleSelection, containerRef]);

  const handleDefine = async () => {
    setIsDefining(true);
    setDefinitionError(null);
    const lang = i18n.language.split('-')[0]; // Pega 'pt' de 'pt-BR'
    const wordToDefine = selectedText.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");

    if (!wordToDefine) {
        setDefinitionError("Por favor, selecione uma palavra válida.");
        setIsDefining(false);
        return;
    }

    try {
      const response = await axios.get(`/api/dictionary/${wordToDefine}?lang=${lang}`);
      setDefinition(response.data);
    } catch (error: any) {
      console.error("Error fetching definition:", error);
      const errorMessage = error.response?.data?.message || 'Não foi possível buscar a definição.';
      setDefinitionError(errorMessage);
    } finally {
      setIsDefining(false);
    }
  };

  const handleExplain = async () => {
    setIsExplaining(true);
    setExplanationError(null);
    try {
      const executeExplain = await withCreditCheck(explainPassage);
      const result = await executeExplain({
        model: userProfile?.preferredModel,
        passage: selectedText
      });
      if(result) {
        setExplanation(result.explanation);
      }
    } catch (error: any) {
      console.error("Error fetching explanation:", error);
      setExplanationError(error.message || 'Não foi possível gerar a explicação.');
      toast({ variant: 'destructive', title: 'Erro de IA', description: error.message });
    } finally {
      setIsExplaining(false);
    }
  };
  
  const renderDictionaryResult = () => {
    if (!definition) return null;
    // A API pode retornar um array de entradas para uma palavra
    return (
        <div className="space-y-4">
            {definition.map((entry, entryIndex) => (
                <div key={entryIndex}>
                    {entry.phonetic && <p className="text-muted-foreground mb-2 font-mono">{entry.phonetic}</p>}
                    {entry.meanings?.map((meaning: any, mIndex: number) => (
                        <div key={mIndex} className="mb-3">
                            <p className="font-semibold text-sm capitalize text-primary">{meaning.partOfSpeech}</p>
                            <ul className="list-disc pl-5 mt-1 space-y-1">
                                {meaning.definitions.map((def: any, dIndex: number) => (
                                    <li key={dIndex} className="text-sm text-card-foreground">
                                        {def.definition}
                                        {def.example && <p className="text-xs italic text-muted-foreground mt-1">Ex: "{def.example}"</p>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    )
  }

  return (
    <>
      <CreditModal />
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverAnchor style={{ top: position.top, left: position.left, position: 'absolute' }} />
        {children}
        <PopoverContent className="w-auto p-1" onOpenAutoFocus={(e) => e.preventDefault()}>
          <div className="flex items-center gap-1">
            {isSingleWord && (
              <Button variant="ghost" size="sm" onClick={handleDefine}>
                {isDefining ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Book className="mr-2 h-4 w-4" />}
                Dicionário
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleExplain}>
               {isExplaining ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                Explicar com IA
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {(isDefining || definition || definitionError) && (
        <ExplanationCard 
            title={definitionError ? 'Erro' : `Definição de "${selectedText}"`}
            isLoading={isDefining}
            content={definitionError || (definition ? renderDictionaryResult() : 'Buscando...')}
            onClose={() => { setDefinition(null); setDefinitionError(null); }}
            className="fixed bottom-4 right-4 w-96 z-50 shadow-lg animate-in slide-in-from-bottom-5"
        />
      )}
      {(isExplaining || explanation || explanationError) && (
         <ExplanationCard 
            title={explanationError ? 'Erro' : `Explicação do Trecho`}
            isLoading={isExplaining}
            content={explanationError || explanation || 'Buscando...'}
            onClose={() => { setExplanation(null); setExplanationError(null); }}
            className="fixed bottom-4 right-4 w-80 z-50 shadow-lg animate-in slide-in-from-bottom-5"
        />
      )}

    </>
  );
}
