
import { GoogleGenAI } from "@google/genai";
import { PostRequest, GeneratedPost, GroundingSource, ModelTier, ProviderEngine } from "../types";

export const generateXPost = async (request: PostRequest): Promise<GeneratedPost> => {
  if (request.config && request.config.apiKey && request.engine !== ProviderEngine.GEMINI) {
    return await callExternalProvider(request);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const modelMap = {
    [ModelTier.FLASH]: 'gemini-3-flash-preview',
    [ModelTier.PRO]: 'gemini-3-pro-preview',
    [ModelTier.LITE]: 'gemini-flash-lite-latest'
  };

  const selectedModel = modelMap[request.modelTier] || 'gemini-3-flash-preview';

  const enginePersonalities = {
    [ProviderEngine.GEMINI]: "Focus on multimodal logic and creative synthesis.",
    [ProviderEngine.OPENAI]: "Focus on high-energy, structured, and professional output.",
    [ProviderEngine.ANTHROPIC]: "Focus on nuanced, ethical, and conversational storytelling.",
    [ProviderEngine.GROQ]: "Focus on rapid-fire, concise, and punchy statements.",
    [ProviderEngine.OPENROUTER]: "Versatile cross-model logic with broad context.",
    [ProviderEngine.GROK]: "Witty, slightly rebellious, and highly current logic."
  };

  const systemInstruction = `
    You are an elite Social Media Ghostwriter.
    ENGINE PERSONALITY: ${enginePersonalities[request.engine] || "Versatile"}
    
    TARGET: "${request.projectName}"
    STYLE: ${request.style}
    LIMIT: ${request.maxCharacters} characters.

    STRICT RULES:
    1. No AI clichés.
    2. No hashtags.
    3. Aggressive white space.
    4. Write as a human expert.
    
    ${request.customInstructions ? `USER REQUIREMENTS: ${request.customInstructions}` : ''}
  `;

  try {
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: [{ parts: [{ text: `Research "${request.projectName}" and write a ${request.maxCharacters} char post.` }] }],
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        thinkingConfig: selectedModel.includes('pro') ? { thinkingBudget: 4000 } : undefined
      },
    });

    const content = response.text || "Synthesis failed.";
    const sources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          sources.push({ title: chunk.web.title || "Reference", uri: chunk.web.uri });
        }
      });
    }

    return {
      content: content.trim(),
      sources: Array.from(new Map(sources.map(s => [s.uri, s])).values())
    };
  } catch (error: any) {
    if (error.message?.includes("404") || error.message?.includes("not found")) {
      throw new Error("SECURE_KEY_INVALID: Please link your OWN paid project key in AI Studio.");
    }
    throw new Error(error.message || "Protocol node failure.");
  }
};

const callExternalProvider = async (request: PostRequest): Promise<GeneratedPost> => {
  const { config, projectName, style, maxCharacters } = request;
  if (!config) throw new Error("Missing configuration.");

  let url = config.baseUrl?.trim() || "";
  let model = config.model?.trim() || "";

  switch (request.engine) {
    case ProviderEngine.GROQ:
      url = url || "https://api.groq.com/openai/v1/chat/completions";
      model = model || "llama-3.3-70b-versatile";
      break;
    case ProviderEngine.OPENAI:
      url = url || "https://api.openai.com/v1/chat/completions";
      model = model || "gpt-4o";
      break;
    case ProviderEngine.ANTHROPIC:
      url = url || "https://api.anthropic.com/v1/messages";
      model = model || "claude-3-5-sonnet-latest";
      break;
    case ProviderEngine.OPENROUTER:
      url = url || "https://openrouter.ai/api/v1/chat/completions";
      model = model || "google/gemini-2.0-flash-lite-preview-02-05:free";
      break;
    case ProviderEngine.GROK:
      url = url || "https://api.x.ai/v1/chat/completions";
      model = model || "grok-beta";
      break;
  }

  const prompt = `Write a ${style} style Twitter post about ${projectName}. Limit: ${maxCharacters} characters. No hashtags. No AI cliches.`;

  const headers: Record<string, string> = {
    "Authorization": `Bearer ${config.apiKey}`,
    "Content-Type": "application/json"
  };

  if (request.engine === ProviderEngine.OPENROUTER) {
    headers["HTTP-Referer"] = window.location.origin;
    headers["X-Title"] = "Postix AI";
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: config.temperature || 0.7
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err.error?.message || response.statusText;
      throw new Error(`Provider Error: ${msg}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || data.content?.[0]?.text || "No content returned.";
    
    return {
      content,
      sources: []
    };
  } catch (e: any) {
    throw new Error(e.message || "Network error contacting provider.");
  }
};
