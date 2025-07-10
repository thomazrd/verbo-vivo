import type { Timestamp, FieldValue } from "firebase/firestore";
import { z } from "zod";

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  createdAt: Timestamp | FieldValue;
  hasPlanButton?: boolean;
  topic?: string;
}

export interface Task {
  day: number;
  verseReference: string;
  description: string;
  completed?: boolean;
}

export interface Plan {
  id: string;
  title: string;
  tasks: Task[];
  createdAt: Timestamp;
}

export interface JournalEntry {
  id: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  title?: string;
  content: string;
  category: 'Pedido' | 'Agradecimento' | 'Reflexão';
}

export interface Verse {
  reference: string;
  text: string;
  theme: string;
}

export interface Meditation {
  id: string;
  userId: string;
  verseReference: string;
  verseText: string;
  createdAt: Timestamp;
  responses: { question: string; answer: string; }[];
}

export interface BibleCharacter {
  id: string;
  name: string;
  summary: string;
  keyVerses: string[];
  studyPlan: Task[];
  imageSrc: string;
  imageHint: string;
}

// --- Tipos da Comunidade da Congregação ---

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  onboardingCompleted: boolean;
  congregationId?: string | null;
  congregationStatus?: 'MEMBER' | 'PENDING' | 'ADMIN' | 'NONE';
}

export interface Congregation {
  id: string;
  name: string;
  city: string;
  pastorName: string;
  admins: { [userId: string]: boolean };
  memberCount: number;
  inviteCode: string;
  createdAt: Timestamp;
  createdBy: string;
}

export interface CongregationMember {
  id: string; // Same as userId
  displayName: string;
  photoURL: string | null;
  joinedAt?: Timestamp;
  requestedAt?: Timestamp;
  status: 'PENDING' | 'APPROVED';
}

export interface Post {
  id: string;
  congregationId: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  text: string;
  createdAt: Timestamp;
  type: 'ANNOUNCEMENT' | 'POST';
  likeCount: number;
  commentCount: number;
  // For client-side state management
  likes?: string[]; 
}

export interface Comment {
    id: string;
    authorId: string;
    authorName: string;
    authorPhotoURL: string | null;
    text: string;
    createdAt: Timestamp;
}

export interface Like {
  // The document ID will be the userId
  likedAt: Timestamp;
}

export interface Prayer {
  id: string;
  userId: string;
  createdAt: Timestamp;
  prayerText: string;
  responseText: string;
  citedVerses: string[];
}

// --- Tipos da API da Bíblia ---

export interface BibleBook {
  abbrev: { pt: string; en: string; };
  author: string;
  chapters: number;
  group: string;
  name: string;
  testament: 'VT' | 'NT';
  comment?: string;
}

export interface BibleChapter {
    book: {
      abbrev: { pt: string; en: string };
      name: string;
      author: string;
      group: string;
      version: string;
      testament: 'VT' | 'NT';
    };
    chapter: {
      number: number;
      verses: number;
    };
    verses: {
      number: number;
      text: string;
    }[];
}


// === AI Flow Schemas and Types ===

// From: bible-chat-response.ts
export const BibleChatResponseInputSchema = z.object({
  user_question: z.string().describe("The user's question or message."),
  bible_verses: z.array(z.string()).describe('Relevant Bible verses to consider in the response.'),
});

export type BibleChatResponseInput = z.infer<typeof BibleChatResponseInputSchema>;
export type BibleChatResponseOutput = string;

// From: guided-meditation-generation.ts
export const MeditationQuestionsInputSchema = z.object({
  bible_verse: z.string().describe('The Bible verse for meditation.'),
});
export type MeditationQuestionsInput = z.infer<typeof MeditationQuestionsInputSchema>;

export const MeditationQuestionsOutputSchema = z.object({
  questions: z.array(z.string()).describe('An array of three reflection questions.'),
});
export type MeditationQuestionsOutput = z.infer<typeof MeditationQuestionsOutputSchema>;

// From: prayer-reflection.ts
export const ProcessPrayerInputSchema = z.object({
  prayerText: z.string().describe('The transcribed text of the user\'s prayer.'),
});
export type ProcessPrayerInput = z.infe