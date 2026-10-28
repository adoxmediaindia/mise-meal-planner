import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

let openaiInstance: OpenAI | null = null;

export const isOpenAIConfigured = (): boolean => {
  const key = process.env.OPENAI_API_KEY;
  return Boolean(key && key.trim() !== '' && key !== 'undefined' && key !== 'null');
};

export const isAIFeatureEnabled = (): boolean => {
  if (process.env.ENABLE_AI_FEATURES === 'false') {
    return false;
  }
  return isOpenAIConfigured();
};

export const getOpenAIModel = (): string => {
  return process.env.OPENAI_MODEL || 'gpt-4o-mini';
};

export const getOpenAITimeoutMs = (): number => {
  if (process.env.OPENAI_TIMEOUT_MS) {
    const parsed = parseInt(process.env.OPENAI_TIMEOUT_MS, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 15000; // 15 seconds default timeout
};

export const getOpenAIClient = (): OpenAI => {
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI API is not configured. OPENAI_API_KEY is missing or invalid.');
  }

  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!.trim(),
      timeout: getOpenAITimeoutMs(),
      maxRetries: 1,
    });
  }

  return openaiInstance;
};
