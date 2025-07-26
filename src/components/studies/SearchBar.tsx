
"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchBarProps {
  onSearchChange: (term: string) => void;
  placeholder: string;
}

export function SearchBar({ onSearchChange, placeholder }: SearchBarProps) {
  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        className="pl-10 h-12 text-base"
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
}
