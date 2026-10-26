import { Request, Response } from 'express';
import { Recipe } from '../models/Recipe.js';
import { User } from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';

export const getRecipes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cuisine, vibe, dietary, search, mealType, maxCookTime, excludeAllergens, limit = '50' } = req.query;

    const query: Record<string, any> = {};

    if (cuisine && typeof cuisine === 'string') {
      query.cuisine = cuisine;
    }

    if (vibe && typeof vibe === 'string') {
      query.vibes = vibe;
    }

    if (dietary && typeof dietary === 'string' && dietary !== 'None') {
      query.dietaryTags = dietary;
    }

    if (mealType && typeof mealType === 'string') {
      query.mealTypes = mealType;
    }

    if (maxCookTime && typeof maxCookTime === 'string') {
      const maxTime = parseInt(maxCookTime, 10);
      if (!isNaN(maxTime) && maxTime > 0) {
        query.cookTimeMinutes = { $lte: maxTime };
      }
    }

    if (excludeAllergens && typeof excludeAllergens === 'string') {
      const allergensList = excludeAllergens.split(',').map((a) => a.trim()).filter(Boolean);
      if (allergensList.length > 0) {
        query.allergens = { $nin: allergensList };
      }
    }

    if (search && typeof search === 'string') {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'ingredients.name': { $regex: search, $options: 'i' } },
      ];
    }

    const recipes = await Recipe.find(query).limit(parseInt(limit as string, 10));

    res.json({ success: true, count: recipes.length, data: recipes });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getFavorites = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).populate('favorites');
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({ success: true, data: user.favorites || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getRecipeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Support lookup by MongoDB ID or slug
    const recipe = id.match(/^[0-9a-fA-F]{24}$/)
      ? await Recipe.findById(id)
      : await Recipe.findOne({ slug: id });

    if (!recipe) {
      res.status(404).json({ success: false, error: 'Recipe not found' });
      return;
    }

    res.json({ success: true, data: recipe });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const toggleFavorite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user?.id);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const recipe = await Recipe.findById(id);
    if (!recipe) {
      res.status(404).json({ success: false, error: 'Recipe not found' });
      return;
    }

    const index = user.favorites.findIndex((fId) => fId.toString() === id);
    let isFavorited = false;
    if (index > -1) {
      user.favorites.splice(index, 1);
      isFavorited = false;
    } else {
      user.favorites.push(recipe._id as any);
      isFavorited = true;
    }

    await user.save();
    res.json({ success: true, isFavorited, favorites: user.favorites });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const submitReaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'up' or 'down'

    if (type !== 'up' && type !== 'down') {
      res.status(400).json({ success: false, error: "Reaction type must be 'up' or 'down'" });
      return;
    }

    const update = type === 'up' ? { $inc: { upvotes: 1 } } : { $inc: { downvotes: 1 } };
    const recipe = await Recipe.findByIdAndUpdate(id, update, { new: true });

    if (!recipe) {
      res.status(404).json({ success: false, error: 'Recipe not found' });
      return;
    }

    res.json({ success: true, upvotes: recipe.upvotes, downvotes: recipe.downvotes });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
