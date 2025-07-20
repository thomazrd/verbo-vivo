

import type { Timestamp, FieldValue } from "firebase/firestore";
import { z } from "zod";

export interface BibleVerse {
  reference: string;
  text: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  createdAt: Timestamp | FieldValue;
  citedVerses?: BibleVerse[];
  hasPlanButton?: boolean;
  topic?: string;
  history?: { role: string, parts: { text: string }[] }[]; // Adicionado para o histórico
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

export interface WisdomPearl {
  id: string;
  text: string;
  reference: string;
  bookAbbrev: string;
  chapter: number;
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
  armorOnboardingCompleted?: boolean;
  prayerCircleOnboardingCompleted?: boolean;
  congregationId?: string | null;
  congregationStatus?: 'MEMBER' | 'PENDING' | 'ADMIN' | 'NONE';
  preferredLanguage?: string | null;
  preferredModel?: string | null; // e.g., "gemini-1.5-flash"
  favoriteArmorIds?: string[];
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
  status: 'PENDING' | 'MEMBER' | 'ADMIN';
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
  videoId: string;
  thumbnailUrl?: string;
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
    parentCommentId?: string | null; // ID of the parent comment if this is a reply
    replyCount: number;
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
  citedVerses: BibleVerse[];
}

// --- Tipos dos Círculos de Oração ---

export interface PrayerCircle {
  id: string;
  name: string;
  isPublic: boolean;
  authorName: string;
  members: string[];
  inviteCode: string;
  createdAt: Timestamp;
  createdBy: string;
}

export interface PrayerRequest {
  id: string;
  circleId: string;
  authorId: string;
  authorName: string;
  text: string;
  prayingUsers: string[];
  createdAt: Timestamp;
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
    isLetter?: boolean;
    recipientName?: string | null;
    senderName?: string | null;
}

// --- Tipos da Jornada de Sentimentos ---
export interface FeelingJourneyStep {
  stepNumber: number;
  emotionBefore: string;
  userReportText: string;
  aiResponseText: string;
  citedVerses: BibleVerse[];
  emotionAfter: string;
}

export interface FeelingJourney {
  id: string;
  userId: string;
  createdAt: Timestamp;
  status: 'COMPLETED' | 'INTERRUPTED';
  initialEmotion: string;
  finalEmotion: string;
  steps: FeelingJourneyStep[];
}

// --- Tipos de Notificações ---

export type NotificationType = 'NEW_POST' | 'COMMENT_LIKE' | 'POST_LIKE' | 'REPLY' | 'NEW_COMMENT' | 'CONGREGATION_APPROVAL';

export interface Notification {
  id: string;
  recipientId: string;
  actorId: string;
  actorName: string;
  actorPhotoURL: string | null;
  type: NotificationType;
  entityId: string; // e.g., postId, commentId
  entityPath: string; // e.g., /community/congregationId
  isRead: boolean;
  createdAt: Timestamp;
}

export interface UserPushToken {
    id: string; // Document ID (can be the token itself for simplicity)
    userId: string;
    token: string;
    platform: 'web' | 'ios' | 'android';
    createdAt: Timestamp;
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

// --- Tipos de Artigos (Blog) ---
export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string; // Markdown
  excerpt: string;
  coverImageUrl: string | null;
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  status: 'draft' | 'published';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;
}

// --- Tipos da API da Bíblia ---

export interface BibleVersion {
  id: string;
  name: string;
  language: string;
  apiSource: 'abibliadigital' | 'apibible';
}

export interface BibleBook {
  id?: string;
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

// --- Tipos da Minha Armadura ---
export interface ArmorWeapon {
  id: string;
  verseReference: string;
  verseText: string;
  bibleVersion: string;
}

export interface Armor {
  id: string;
  userId: string;
  name: string;
  description?: string;
  weapons: ArmorWeapon[];
  isShared: boolean;
  isFavorite?: boolean; // Client-side state
  createdAt: Timestamp;
  updatedAt: Timestamp;
  authorName?: string;
  authorPhotoURL?: string | null;
  originalArmorId?: string; // To track copied armors
}


// === AI Flow Schemas and Types ===
const BaseAiInputSchema = z.object({
    model: z.string().optional().describe("The AI model to use, e.g. 'gemini-1.5-pro'."),
    language: z.string().optional().describe('The language code for the response (e.g., "pt", "en").'),
});

const ChatPartSchema = z.object({
  text: z.string(),
});

const ChatHistoryItemSchema = z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(ChatPartSchema),
});
export type ChatHistoryItem = z.infer<typeof ChatHistoryItemSchema>;


// From: bible-chat-response.ts
export const BibleChatResponseInputSchema = BaseAiInputSchema.extend({
  user_question: z.string().describe("The user's question or message."),
  history: z.array(ChatHistoryItemSchema).optional().describe('The recent chat history.'),
  userId: z.string(),
  messageId: z.string(),
});
export type BibleChatResponseInput = z.infer<typeof BibleChatResponseInputSchema>;

export const BibleChatResponseOutputSchema = z.object({
    response: z.string().describe('The main, helpful response to the user.'),
    verses: z.array(z.object({
        reference: z.string().describe('The reference of the verse. Ex: "João 3:16"'),
        text: z.string().describe("The full text of the verse."),
    })).describe('An array of relevant bible verses.'),
});
export type BibleChatResponseOutput = z.infer<typeof BibleChatResponseOutputSchema>;


// From: guided-meditation-generation.ts
export const MeditationQuestionsInputSchema = BaseAiInputSchema.extend({
  bible_verse: z.string().describe('The Bible verse for meditation.'),
});
export type MeditationQuestionsInput = z.infer<typeof MeditationQuestionsInputSchema>;

export const MeditationQuestionsOutputSchema = z.object({
  questions: z.array(z.string()).describe('An array of three reflection questions.'),
});
export type MeditationQuestionsOutput = z.infer<typeof MeditationQuestionsOutputSchema>;

// From: prayer-reflection.ts
export const ProcessPrayerInputSchema = BaseAiInputSchema.extend({
  prayerText: z.string().describe('The transcribed text of the user\'s prayer.'),
});
export type ProcessPrayerInput = z.infer<typeof ProcessPrayerInputSchema>;

export const ProcessPrayerOutputSchema = z.object({
    responseText: z.string().describe('The devotional reflection based on the prayer.'),
    citedVerses: z.array(z.object({
      reference: z.string(),
      text: z.string()
    })).describe('An array of Bible verse references cited in the response.'),
});
export type ProcessPrayerOutput = z.infer<typeof ProcessPrayerOutputSchema>;

// From: study-plan-generation.ts
export const StudyPlanInputSchema = BaseAiInputSchema.extend({
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
export const ChapterSummaryInputSchema = BaseAiInputSchema.extend({
  chapterText: z.string().describe('The full text of the Bible chapter.'),
});
export type ChapterSummaryInput = z.infer<typeof ChapterSummaryInputSchema>;

export const ChapterSummaryOutputSchema = z.object({
  summary: z.string().describe('The generated summary of the chapter.'),
});
export type ChapterSummaryOutput = z.infer<typeof ChapterSummaryOutputSchema>;

// From: shareable-content-generation.ts
export const GenerateShareableContentInputSchema = BaseAiInputSchema.extend({
  problemDescription: z.string().describe('The problem description provided by the user.'),
  recipientName: z.string().optional().describe("The name of the person receiving the letter, for personalization."),
});
export type GenerateShareableContentInput = z.infer<typeof GenerateShareableContentInputSchema>;

// The output is the content object itself.
export const GenerateShareableContentOutputSchema = SharedContentSchema;
export type GenerateShareableContentOutput = z.infer<typeof GenerateShareableContentOutputSchema>;


// From: feeling-journey-flow.ts
export const ProcessFeelingReportInputSchema = BaseAiInputSchema.extend({
  emotion: z.string().describe("The user's selected emotion."),
  reportText: z.string().describe("The user's voice report explaining their feeling."),
});
export type ProcessFeelingReportInput = z.infer<typeof ProcessFeelingReportInputSchema>;

export const ProcessFeelingReportOutputSchema = z.object({
    responseText: z.string().describe('A pastoral, Bible-based reflection on the user\'s feeling.'),
    citedVerses: z.array(z.object({
        reference: z.string().describe('The reference of the verse. Ex: "João 3:16"'),
        text: z.string().describe("The full text of the verse."),
    })).describe('An array of relevant bible verses.'),
});
export type ProcessFeelingReportOutput = z.infer<typeof ProcessFeelingReportOutputSchema>;

// From: explain-passage-flow.ts
export const ExplainPassageInputSchema = BaseAiInputSchema.extend({
  passage: z.string().describe("The biblical passage to be explained."),
});
export type ExplainPassageInput = z.infer<typeof ExplainPassageInputSchema>;

export const ExplainPassageOutputSchema = z.object({
  explanation: z.string().describe("A clear and concise explanation of the passage."),
});
export type ExplainPassageOutput = z.infer<typeof ExplainPassageOutputSchema>;

// From: armor-suggestion-flow.ts
export const ArmorSuggestionInputSchema = BaseAiInputSchema.extend({
  battle: z.string().describe('The spiritual battle the user is facing (e.g., "Anxiety", "Fear").'),
});
export type ArmorSuggestionInput = z.infer<typeof ArmorSuggestionInputSchema>;

export const ArmorWeaponSchema = z.object({
    verseReference: z.string(),
    verseText: z.string(),
    bibleVersion: z.string(),
});
export type ArmorWeaponOutput = z.infer<typeof ArmorWeaponSchema>;

export const ArmorSuggestionOutputSchema = z.object({
    weapons: z.array(ArmorWeaponSchema).describe('An array of bible verses to be used as spiritual weapons.'),
});
export type ArmorSuggestionOutput = z.infer<typeof ArmorSuggestionOutputSchema>;
