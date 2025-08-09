
import { BookOpen, Youtube, HeartHandshake, Smile, LockKeyhole, NotebookText, HandHeart } from "lucide-react";
import type { MissionType } from "./types";

export const MissionTypeDetails: Record<MissionType, { icon: React.ElementType, label: string, path: string, completionQueryParam?: string, requiresVerse?: boolean, verseLabel?: string, versePlaceholder?: string }> = {
    BIBLE_READING: { icon: BookOpen, label: "Leitura Bíblica", path: '/bible', requiresVerse: true, verseLabel: "Referência Bíblica" },
    YOUTUBE_VIDEO: { icon: Youtube, label: "Vídeo do YouTube", path: '/battle-plans/mission-video', requiresVerse: true, verseLabel: "Link do Vídeo", versePlaceholder: "https://www.youtube.com/watch?v=..." },
    PRAYER_SANCTUARY: { icon: HeartHandshake, label: "Santuário de Oração", path: '/prayer-sanctuary', completionQueryParam: 'mission' },
    FEELING_JOURNEY: { icon: Smile, label: "Jornada de Sentimentos", path: '/feeling-journey', completionQueryParam: 'mission' },
    CONFESSION: { icon: LockKeyhole, label: "Confessionário", path: '/confession', completionQueryParam: 'mission' },
    JOURNAL_ENTRY: { icon: NotebookText, label: "Anotação no Diário", path: '/journal', completionQueryParam: 'mission' },
    FAITH_CONFESSION: { icon: HandHeart, label: "Confissão de Fé", path: '/faith-confession', completionQueryParam: 'mission' },
};
