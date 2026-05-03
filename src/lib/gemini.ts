import { GoogleGenAI } from '@google/genai';

// Lazy initialization for the Gemini AI client
let aiInstance: any = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined. Please configure it in the Secrets panel.');
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

// Use supported model - gemini-3-flash-preview for ultra-fast response
const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Standard response fetch with context windowing and concise mode optimization.
 */
export const getMentorResponse = async (
  systemPrompt: string,
  userMessage: string,
  history: { role: string; content: string }[] = [],
  expectJson: boolean = false,
  concise: boolean = false
): Promise<string> => {
  const ai = getAI();
  const timeoutPromise = new Promise<string>((_, reject) =>
    setTimeout(() => reject(new Error('TIMEOUT')), 8000) // Increased timeout for deep mode
  );

  const fetchPromise = (async () => {
    try {
      const optimizedHistory = history.slice(-8).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      const finalSystemPrompt = concise 
        ? `${systemPrompt}\nIMPORTANT: Be extremely concise. Max 2-3 sentences.`
        : systemPrompt;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [
          ...optimizedHistory,
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: finalSystemPrompt,
          temperature: 0.7,
          // maxOutputTokens is safer when specified in systemInstruction but we use it here too
          maxOutputTokens: concise ? 200 : 1000,
          responseMimeType: expectJson ? "application/json" : "text/plain",
        }
      });

      return response.text || "I'm deep in thought, please ask again later.";
    } catch (error) {
      console.error("Error fetching mentor response:", error);
      throw error;
    }
  })();

  try {
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (err: any) {
    if (err.message === 'TIMEOUT' && !concise) {
      console.log("Switching to Fast Mode due to latency...");
      return getMentorResponse(systemPrompt, userMessage, history, expectJson, true);
    }
    return "The connection to my era seems unstable right now. Let us try again in a moment.";
  }
};

/**
 * Streaming response for real-time interaction.
 */
export const streamMentorResponse = async (
  systemPrompt: string,
  userMessage: string,
  history: { role: string; content: string }[] = [],
  onChunk: (chunk: string) => void,
  concise: boolean = false
): Promise<string> => {
  const ai = getAI();
  try {
    const optimizedHistory = history.slice(-8).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const finalSystemPrompt = concise 
      ? `${systemPrompt}\nIMPORTANT: Be extremely concise.`
      : systemPrompt;

    const responseStream = await ai.models.generateContentStream({
      model: MODEL_NAME,
      contents: [
        ...optimizedHistory,
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction: finalSystemPrompt,
        temperature: 0.7,
        maxOutputTokens: concise ? 250 : 1200, 
      }
    });

    let fullText = '';
    for await (const chunk of responseStream) {
      const chunkText = chunk.text || '';
      fullText += chunkText;
      onChunk(chunkText);
    }

    return fullText;
  } catch (error) {
    console.error("Error in streaming response:", error);
    return "Streaming connection lost. Let us try again.";
  }
};
