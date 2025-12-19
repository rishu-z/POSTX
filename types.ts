
export enum PostStyle {
  STORYTELLER = 'Storyteller',
  PROVOCATIVE = 'Provocative',
  OBSERVATIONAL = 'Observational',
  TECHNICAL_LEAD = 'Technical Lead',
  FOUNDER_VIBE = 'Founder Vibe',
  MINIMALIST = 'Minimalist',
  SARCASTIC = 'Sarcastic',
  CURATED = 'Curated Insights',
  CUSTOM = 'Custom Identity'
}

export enum PostLength {
  SHORT = 'Short',
  MEDIUM = 'Medium',
  LONG = 'Long'
}

export enum ProviderEngine {
  GEMINI = 'Google Gemini',
  OPENAI = 'OpenAI',
  ANTHROPIC = 'Anthropic',
  GROQ = 'Groq',
  OPENROUTER = 'OpenRouter',
  GROK = 'xAI Grok'
}

export enum ModelTier {
  FLASH = 'Speed (Flash)',
  PRO = 'Reasoning (Pro)',
  LITE = 'Efficiency (Lite)'
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface GeneratedPost {
  content: string;
  sources: GroundingSource[];
  history?: { role: 'user' | 'model'; parts: { text: string }[] }[];
}

export interface ProviderConfig {
  engine: ProviderEngine;
  apiKey: string;
  model?: string;
  baseUrl?: string;
  temperature?: number;
}

export interface PostRequest {
  projectName: string;
  maxCharacters: number;
  style: PostStyle;
  length: PostLength;
  customStyleDescription?: string;
  engine: ProviderEngine;
  modelTier: ModelTier;
  customInstructions?: string;
  config?: ProviderConfig;
  refinementCommand?: string;
  previousHistory?: { role: 'user' | 'model'; parts: { text: string }[] }[];
}
