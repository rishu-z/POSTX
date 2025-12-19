
import { GoogleGenAI } from "@google/genai";
import { PostRequest, GeneratedPost, GroundingSource, ModelTier, ProviderEngine, PostStyle, PostLength } from "../types";

export const generateXPost = async (request: PostRequest): Promise<GeneratedPost> => {
  // Use user-provided key if available in config, otherwise use system key
  const userKey = request.config?.apiKey;
  const activeApiKey = (request.engine === ProviderEngine.GEMINI && userKey) ? userKey : process.env.API_KEY;

  if (request.config && request.config.apiKey && request.engine !== ProviderEngine.GEMINI) {
    return await callExternalProvider(request);
  }

  const ai = new GoogleGenAI({ apiKey: activeApiKey as string });
  
  const modelMap = {
    [ModelTier.FLASH]: 'gemini-3-flash-preview',
    [ModelTier.PRO]: 'gemini-3-pro-preview',
    [ModelTier.LITE]: 'gemini-flash-lite-latest'
  };

  const selectedModel = request.config?.model || modelMap[request.modelTier] || 'gemini-3-flash-preview';

  const styleProfile = request.style === PostStyle.CUSTOM 
    ? `CUSTOM IDENTITY: ${request.customStyleDescription}`
    : `STYLE: ${request.style}`;

  // Use the manual maxCharacters as the absolute constraint
  const systemInstruction = `
    You are an elite Social Media Ghostwriter. 
    ${styleProfile}
    STRICT CHARACTER LIMIT: ${request.maxCharacters} characters. 
    (This is an absolute limit. If the limit is small, be punchy. If the limit is large, write a comprehensive detailed post or thread).

    RESEARCH MODE: If the subject is a link, crawl it for context. If it's a topic, find trending angles.
    STRICT RULES:
    1. No AI clichés like "In the world of...", "Revolutionizing...", or "Unlocking...".
    2. No hashtags unless specifically requested.
    3. Use aggressive white space for readability (human-like).
    4. Write as an industry insider with a specific perspective, not a generic assistant.
    5. TARGET LENGTH: Aim to get close to ${request.maxCharacters} characters without exceeding it, unless the topic is simple.
    
    ${request.customInstructions ? `USER REQUIREMENTS: ${request.customInstructions}` : ''}
  `;

  try {
    const contents = request.previousHistory ? [...request.previousHistory] : [];
    
    if (request.refinementCommand) {
      contents.push({ role: 'user', parts: [{ text: `REFINEMENT COMMAND: ${request.refinementCommand}. Stay under ${request.maxCharacters} characters.` }] });
    } else {
      contents.push({ role: 'user', parts: [{ text: `Project/Subject: "${request.projectName}". Synthesize a high-impact post under ${request.maxCharacters} characters.` }] });
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
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

    const newHistory = [
      ...contents,
      { role: 'model', parts: [{ text: content }] }
    ];

    return {
      content: content.trim(),
      sources: Array.from(new Map(sources.map(s => [s.uri, s])).values()),
      history: newHistory as any
    };
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error.message?.includes("not found") || error.message?.includes("404")) {
      throw new Error("MODEL_NOT_FOUND: The selected model is not available for this API key. Try 'Speed (Flash)'.");
    }
    throw new Error(error.message || "Protocol node failure.");
  }
};

const callExternalProvider = async (request: PostRequest): Promise<GeneratedPost> => {
  const { config, projectName, style, maxCharacters, refinementCommand } = request;
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

  const styleProfile = request.style === PostStyle.CUSTOM ? request.customStyleDescription : request.style;
  
  let prompt = "";
  if (refinementCommand) {
    prompt = `The user wants a change: "${refinementCommand}". Base it on "${projectName}" in style "${styleProfile}". Limit: ${maxCharacters} chars.`;
  } else {
    prompt = `Subject: ${projectName}. Write a Twitter post in ${styleProfile} style. Limit: ${maxCharacters} chars. No hashtags. No AI cliches.`;
  }

  const headers: Record<string, string> = {
    "Authorization": `Bearer ${config.apiKey}`,
    "Content-Type": "application/json"
  };

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
