
export enum PostStyle {
  STORYTELLER = 'Storyteller',
  PROVOCATIVE = 'Provocative',
  OBSERVATIONAL = 'Observational',
  TECHNICAL_LEAD = 'Technical Lead',
  FOUNDER_VIBE = 'Founder Vibe',
  MINIMALIST = 'Minimalist',
  SARCASTIC = 'Sarcastic',
  CURATED = 'Curated Insights'
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
  engine: ProviderEngine;
  modelTier: ModelTier;
  customInstructions?: string;
  config?: ProviderConfig;
}
