import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.js';
import { AiService } from '../services/aiService.js';
import { EntitlementError } from '../services/entitlementService.js';
import { NoRecipesFoundError } from '../services/plannerService.js';

export const leftoverRecipeSchema = z.object({
  ingredients: z.array(z.string().trim().min(1)).min(1).max(20),
  cuisine: z.enum(['Italian', 'Asian', 'Mexican', 'Indian', 'Mediterranean', 'British']).optional(),
  maxCookTimeMinutes: z.number().int().min(5).max(180).optional(),
  equipment: z.enum(['Air Fryer', 'Slow Cooker', 'Hob Only', 'Oven', 'Blender', 'Instant Pot']).optional(),
  servings: z.number().int().min(1).max(12).optional(),
  additionalNotes: z.string().trim().max(300).optional(),
});

export const planIntentSchema = z.object({
  prompt: z.string().trim().min(3).max(500),
});

export const generateLeftoverRecipe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { ingredients, cuisine, maxCookTimeMinutes, equipment, servings, additionalNotes } = req.body;

    const result = await AiService.generateLeftoverRecipe(userId, ingredients, {
      cuisine,
      maxCookTimeMinutes,
      equipment,
      servings,
      additionalNotes,
    });

    res.json({
      success: true,
      data: result.recipe,
      isAiGenerated: result.isAiGenerated,
      fallback: result.fallback,
      note: result.note,
    });
  } catch (err: any) {
    if (err instanceof EntitlementError) {
      res.status(err.statusCode).json({
        success: false,
        error: err.message,
        code: err.code,
        feature: err.feature,
        limit: err.limit,
        current: err.current,
      });
      return;
    }
    if (err instanceof NoRecipesFoundError || err.code === 'NO_RECIPES_FOUND') {
      res.status(422).json({
        success: false,
        error: err.message,
        code: 'NO_RECIPES_FOUND',
      });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
};

export const customizePlanWithIntent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { prompt } = req.body;

    const result = await AiService.customizePlanWithIntent(userId, prompt);

    res.json({
      success: true,
      data: result.plan,
      summary: result.summary,
      isAiGenerated: result.isAiGenerated,
      fallback: result.fallback,
    });
  } catch (err: any) {
    if (err instanceof EntitlementError) {
      res.status(err.statusCode).json({
        success: false,
        error: err.message,
        code: err.code,
        feature: err.feature,
        limit: err.limit,
        current: err.current,
      });
      return;
    }
    res.status(500).json({ success: false, error: err.message });
  }
};

export const listAvailableModels = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { isAIFeatureEnabled, getGeminiClient, getGeminiModel } = await import('../config/gemini.js');
    if (!isAIFeatureEnabled()) {
      res.json({ success: true, enabled: false, configuredModel: getGeminiModel(), models: [] });
      return;
    }
    const client = getGeminiClient();
    const pager = await client.models.list();
    const models: any[] = [];
    for await (const m of pager) {
      models.push({
        name: m.name,
        displayName: m.displayName,
        supportedMethods: (m as any).supportedGenerationMethods || (m as any).supportedActions || [],
      });
    }
    res.json({ success: true, enabled: true, configuredModel: getGeminiModel(), count: models.length, models });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const testModelGeneration = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { isAIFeatureEnabled, getGeminiClient, getGeminiModel } = await import('../config/gemini.js');
    if (!isAIFeatureEnabled()) {
      res.json({ success: false, error: 'AI not configured' });
      return;
    }
    const client = getGeminiClient();
    const testModels = [
      'gemini-2.5-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-2.5-flash',
      'gemini-flash-latest',
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-2.5-pro',
    ];

    const results: any[] = [];
    for (const m of testModels) {
      // 1. Without thinkingConfig
      try {
        const respWithout = await client.models.generateContent({
          model: m,
          contents: 'Generate valid JSON: {"status": "ok", "message": "hello"}',
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
            maxOutputTokens: 60,
          },
        });
        results.push({
          model: m,
          withThinking: false,
          success: true,
          text: (respWithout.text || '').trim(),
        });
      } catch (errWithout: any) {
        results.push({
          model: m,
          withThinking: false,
          success: false,
          error: (errWithout.message || '').replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED]'),
          status: errWithout.status,
          code: errWithout.code,
        });
      }

      // 2. With thinkingBudget: 0
      try {
        const respWith = await client.models.generateContent({
          model: m,
          contents: 'Generate valid JSON: {"status": "ok", "message": "hello"}',
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
            maxOutputTokens: 60,
            thinkingConfig: { thinkingBudget: 0 },
          },
        });
        results.push({
          model: m,
          withThinking: true,
          success: true,
          text: (respWith.text || '').trim(),
        });
      } catch (errWith: any) {
        results.push({
          model: m,
          withThinking: true,
          success: false,
          error: (errWith.message || '').replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED]'),
          status: errWith.status,
          code: errWith.code,
        });
      }
    }

    res.json({
      success: true,
      configuredModel: getGeminiModel(),
      results,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
