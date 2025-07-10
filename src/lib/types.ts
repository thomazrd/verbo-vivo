import type { Timestamp } from "firebase/firestore";
import { z } from "zod";

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  createdAt: Timestamp;
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
export type ProcessPrayerInput = z.infer<typeof ProcessPrayerInputSchema>;

export const ProcessPrayerOutputSchema = z.object({
  responseText: z.string().describe('The AI-generated devotional reflection.'),
  citedVerses: z.array(z.string()).describe('An array of Bible verse references used in the reflection.'),
});
export type ProcessPrayerOutput = z.infer<typeof ProcessPrayerOutputSchema>;

// From: study-plan-generation.ts
export const StudyPlanInputSchema = z.object({
  topic: z.string().describe('The topic for the study plan.'),
});
export type StudyPlanInput = z.infer<typeof StudyPlanInputSchema>;

export const StudyPlanOutputSchema = z.object({
  title: z.string().describe('The title of the study plan.'),
  tasks: z.array(
    z.object({
      day: z.number().describe('The day of the plan (1-7).'),
      verseReference: z.string().describe('The Bible verse reference for the day.'),
      description: z.string().describe('A short description or reflection for the day.'),
    })
  ),
});
export type StudyPlanOutput = z.infer<typeof StudyPlanOutputSchema>;
