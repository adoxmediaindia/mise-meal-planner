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
    const { isAIFeatureEnabled, getGeminiClient } = await import('../config/gemini.js');
    if (!isAIFeatureEnabled()) {
      res.json({ success: true, enabled: false, models: [] });
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
    res.json({ success: true, enabled: true, count: models.length, models });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
