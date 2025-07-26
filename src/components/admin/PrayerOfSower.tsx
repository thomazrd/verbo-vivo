
"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HandHelping } from "lucide-react";

export function PrayerOfSower() {
    return (
        <Accordion type="single" collapsible className="w-full bg-primary/5 rounded-lg px-4 border">
            <AccordionItem value="item-1" className="border-none">
                <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2 text-primary/80 font-semibold">
                        <HandHelping className="h-5 w-5"/>
                        Oração do Semeador
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <p className="text-muted-foreground italic">
                        "Senhor, guia minhas mãos e minha mente para que este estudo seja um reflexo da Tua verdade e um instrumento de paz para quem o receber. Que não sejam as minhas palavras, mas as Tuas. Amém."
                    </p>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )
}

    