
"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { marked } from "marked";
import { BookText, Target } from "lucide-react";

interface StudyContentAccordionProps {
  markdownContent: string;
  practicalChallenge?: string | null;
}

export function StudyContentAccordion({ markdownContent, practicalChallenge }: StudyContentAccordionProps) {
  const htmlContent = marked.parse(markdownContent) as string;

  return (
    <Accordion type="multiple" className="w-full space-y-4">
      <AccordionItem value="item-1" className="border rounded-lg bg-card overflow-hidden">
        <AccordionTrigger className="p-4 hover:no-underline text-lg">
            <div className="flex items-center gap-3">
                <BookText className="h-5 w-5 text-primary" />
                Ler o Artigo Completo
            </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="px-4 pb-4 border-t pt-4">
             <div
                className="prose max-w-none text-card-foreground"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
      
      {practicalChallenge && (
        <AccordionItem value="item-2" className="border rounded-lg bg-card overflow-hidden">
             <AccordionTrigger className="p-4 hover:no-underline text-lg">
                <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-primary" />
                    Aplicação Prática
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <div className="px-4 pb-4 border-t pt-4">
                    <p className="text-card-foreground leading-relaxed">{practicalChallenge}</p>
                </div>
            </AccordionContent>
        </AccordionItem>
      )}

    </Accordion>
  );
}
