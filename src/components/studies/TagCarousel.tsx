
"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface TagCarouselProps {
  tags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export function TagCarousel({ tags, selectedTag, onSelectTag }: TagCarouselProps) {
  if (tags.length === 0) {
    return null;
  }
  
  return (
    <div className="relative">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-max space-x-2 pb-2">
          <Button
            variant={!selectedTag ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectTag(null)}
            className="rounded-full"
          >
            Todos
          </Button>
          {tags.map((tag) => (
            <Button
              key={tag}
              variant={selectedTag === tag ? "default" : "outline"}
              size="sm"
              onClick={() => onSelectTag(tag)}
              className="rounded-full capitalize"
            >
              {tag}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
