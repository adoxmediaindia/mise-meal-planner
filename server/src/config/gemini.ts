import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

let geminiInstance: GoogleGenAI | null = null;

export const isGeminiConfigured = (): boolean => {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(
    key &&
    key.trim() !== '' &&
    key !== 'undefined' &&
    key !== 'null' &&
    !key.includes('your_gemini_api_key')
  );
};

export const isAIFeatureEnabled = (): boolean => {
  if (process.env.ENABLE_AI_FEATURES === 'false') {
    return false;
  }
  return isGeminiConfigured();
};

export const getGeminiModel = (): string => {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
};

export const getGeminiTimeoutMs = (): number => {
  if (process.env.GEMINI_TIMEOUT_MS) {
    const parsed = parseInt(process.env.GEMINI_TIMEOUT_MS, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 30000; // 30 seconds default timeout
};

export const getGeminiClient = (): GoogleGenAI => {
  if (!isGeminiConfigured()) {
    throw new Error('Gemini API is not configured. GEMINI_API_KEY is missing or invalid.');
  }

  if (!geminiInstance) {
    geminiInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!.trim(),
    });
  }

  return geminiInstance;
};
