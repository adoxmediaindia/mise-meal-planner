import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import { Recipe } from '../models/Recipe.js';
import { User } from '../models/User.js';
import { Preference } from '../models/Preference.js';
import { SEED_RECIPES } from './recipeData.js';
import { PlannerService } from '../services/plannerService.js';
import { ShoppingListService } from '../services/shoppingListService.js';

dotenv.config();
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: 'server/.env' });
}

export const seedDatabase = async (): Promise<void> => {
  try {
    await connectDB();

    console.log('[Seed] Synchronizing recipe catalogue (upserting by slug to preserve existing IDs)...');
    for (const recipe of SEED_RECIPES) {
      await Recipe.findOneAndUpdate(
        { slug: recipe.slug },
        { $set: recipe },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    const insertedRecipes = await Recipe.find();
    console.log(`[Seed] Successfully synchronized ${insertedRecipes.length} recipes.`);

    // Upsert Demo User
    const demoEmail = 'chef@misemealplanner.com';
    let demoUser = await User.findOne({ email: demoEmail });
    if (!demoUser) {
      demoUser = await User.create({
        name: 'Chef Alex',
        email: demoEmail,
        password: 'Password123!',
        subscriptionTier: 'pro',
        subscriptionStatus: 'active',
        favorites: [insertedRecipes[0]._id, insertedRecipes[1]._id],
      });
      console.log('[Seed] Created demo user: chef@misemealplanner.com');
    } else {
      demoUser.favorites = [insertedRecipes[0]._id, insertedRecipes[1]._id];
      await demoUser.save();
    }

    // Set demo user preferences
    let pref = await Preference.findOne({ user: demoUser._id });
    if (!pref) {
      pref = await Preference.create({
        user: demoUser._id,
        supermarket: 'Aldi',
        householdSize: 2,
        cookingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        weeklyBudget: 40,
        dietaryNeeds: ['None'],
        allergies: [],
        equipment: ['Hob Only', 'Oven'],
        vibes: ['Speedy Meals', 'Family Favs'],
      });
      console.log('[Seed] Created demo user preferences.');
    }

    // Generate initial meal plan & shopping list
    console.log('[Seed] Generating initial plan & shopping list for demo user...');
    const plan = await PlannerService.generateWeeklyPlan(demoUser._id.toString(), pref);
    await ShoppingListService.generateOrUpdateShoppingList(demoUser._id.toString(), plan._id.toString());
    console.log('[Seed] Demo meal plan and consolidated shopping list ready!');

    console.log('[Seed] Database seeding completed successfully.');
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  }
};

// Execute if run directly from CLI
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase().then(() => {
    mongoose.connection.close();
    process.exit(0);
  });
}
