
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
  id:string;
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
  preferredLanguage?: string | null; // User's preferred language code (e.g., "pt", "en", "es"). null by default.
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
  status: 'PENDING' | 'MEMBER' | 'ADMIN' | 'APPROVED';
}

export type PostType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'BACKGROUND_TEXT';

export interface TextContent {
  text: string;
}

export interface ImageContent {
  text: string;
  imageUrl: string;
  thumbnailUrl?: string; // Opcional, gerado por uma função
}

export interface VideoContent {
  text: string;
  videoUrl: string;
  thumbnailUrl?: string; // Opcional, gerado por uma função
}

export interface BackgroundTextContent {
  text: string;
  backgroundStyle: string; // ex: 'gradient_blue'
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  createdAt: Timestamp;
  postType: PostType;
  content: TextContent | ImageContent | VideoContent | BackgroundTextContent;
  likeCount: number;
  commentCount: number;
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

// --- Tipos da Ponte da Esperança ---

export const SharedContentSchema = z.object({
  title: z.string().describe("Um título curto e acolhedor para a página"),
  opening: z.string().describe("Um parágrafo de abertura que mostra empatia pelo problema, sem mencioná-lo diretamente."),
  sections: z.array(z.object({
    verse: z.string().describe("A referência do versículo. Ex: 'Jeremias 29:11'"),
    verse_text: z.string().describe("O texto do versículo."),
    explanation: z.string().describe("Uma breve e simples explicação de como este versículo oferece esperança para uma situação difícil.")
  })),
  conclusion: z.string().describe("Um parágrafo de conclusão com uma palavra de encorajamento e uma pergunta suave para reflexão pessoal.")
});
export type SharedContent = z.infer<typeof SharedContentSchema>;

export interface SharedContentDocument {
    id: string;
    creatorId: string;
    createdAt: Timestamp;
    problemDescription: string;
    content: SharedContent;
    status: 'ACTIVE' | 'DELETED';
    viewCount: number;
}

export interface CongregationReport {
  id: string;
  congregationId: string;
  reportedPostId: string;
  reporterId: string;
  reason?: string;
  status: 'PENDING' | 'RESOLVED';
  createdAt: Timestamp;
}

// --- Tipos da API da Bíblia ---

export interface BibleVersion {
  id: string;
  name: string;
  language: string;
  apiSource: 'abibliadigital' | 'apibible';
}

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
export type ProcessPrayerInput = z.infer<typeof ProcessPrayerInputSchema>;

export const ProcessPrayerOutputSchema = z.object({
    responseText: z.string().describe('The devotional reflection based on the prayer.'),
    citedVerses: z.array(z.string()).describe('An array of Bible verse references cited in the response.'),
});
export type ProcessPrayerOutput = z.infer<typeof ProcessPrayerOutputSchema>;

// From: study-plan-generation.ts
export const StudyPlanInputSchema = z.object({
  topic: z.string().describe('The topic for the Bible study plan.'),
});
export type StudyPlanInput = z.infer<typeof StudyPlanInputSchema>;

export const StudyPlanTaskSchema = z.object({
  day: z.number().describe('The day number of the task (1-7).'),
  verseReference: z.string().describe('The Bible verse reference for the day.'),
  description: z.string().describe('A brief description or reflection task.'),
});

export const StudyPlanOutputSchema = z.object({
  title: z.string().describe('The title of the study plan.'),
  tasks: z.array(StudyPlanTaskSchema).describe('An array of daily tasks for the study plan.'),
});
export type StudyPlanOutput = z.infer<typeof StudyPlanOutputSchema>;

// From: chapter-summary-generation.ts
export const ChapterSummaryInputSchema = z.object({
  chapterText: z.string().describe('The full text of the Bible chapter.'),
  language: z.string().describe('The language code for the summary (e.g., "pt", "en").'),
});
export type ChapterSummaryInput = z.infer<typeof ChapterSummaryInputSchema>;

export const ChapterSummaryOutputSchema = z.object({
  summary: z.string().describe('The generated summary of the chapter.'),
});
export type ChapterSummaryOutput = z.infer<typeof ChapterSummaryOutputSchema>;

// From: shareable-content-generation.ts
export const GenerateShareableContentInputSchema = z.object({
  problemDescription: z.string().describe('The problem description provided by the user.'),
});
export type GenerateShareableContentInput = z.infer<typeof GenerateShareableContentInputSchema>;

// The output is the content object itself.
export const GenerateShareableContentOutputSchema = SharedContentSchema;
export type GenerateShareableContentOutput = z.infer<typeof GenerateShareableContentOutputSchema>;
