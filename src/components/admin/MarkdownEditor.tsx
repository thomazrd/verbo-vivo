
"use client";

import { Eye, FileText } from "lucide-react";
import { marked } from "marked";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Textarea } from "../ui/textarea";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  minHeight?: string;
}

export function MarkdownEditor({ value, onChange, minHeight = "400px" }: MarkdownEditorProps) {
  return (
    <Tabs defaultValue="edit" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="edit"><FileText className="mr-2 h-4 w-4" /> Escrever</TabsTrigger>
        <TabsTrigger value="preview"><Eye className="mr-2 h-4 w-4" /> Visualizar</TabsTrigger>
      </TabsList>
      <TabsContent value="edit">
        <Textarea
          placeholder="Escreva seu estudo aqui. Você pode usar Markdown para formatação."
          style={{ minHeight }}
          className="resize-y font-mono"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </TabsContent>
      <TabsContent value="preview">
        <div
          className="prose max-w-none rounded-md border p-4 bg-background"
          style={{ minHeight }}
          dangerouslySetInnerHTML={{ __html: marked.parse(value || 'Comece a escrever para ver a pré-visualização.') as string }}
        />
      </TabsContent>
    </Tabs>
  );
}

    