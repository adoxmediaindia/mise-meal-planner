import { z } from 'zod';
import { getOpenAIClient, isAIFeatureEnabled, getOpenAIModel } from '../config/openai.js';
import { Preference, IPreference } from '../models/Preference.js';
import { Recipe, IRecipeDoc } from '../models/Recipe.js';
import { MealPlan, IMealPlanDoc, IDinnerSlot, IMealSlotDoc } from '../models/MealPlan.js';
import { User } from '../models/User.js';
import { PlannerService, NoRecipesFoundError, SUPERMARKET_PRICE_MULTIPLIERS } from './plannerService.js';
import { ShoppingListService } from './shoppingListService.js';
import { EntitlementService } from './entitlementService.js';
import {
  Allergen,
  DietaryNeed,
  Cuisine,
  KitchenEquipment,
  MealVibe,
  SupermarketAisle,
  DayOfWeek,
  IRecipe,
} from '../types/index.js';

// Strict Allergen Keyword Dictionary for Deterministic Server-Side Ingredient Auditing
const ALLERGEN_KEYWORDS: Record<Allergen, string[]> = {
  Peanuts: ['peanut', 'groundnut', 'arachis'],
  'Tree Nuts': ['almond', 'walnut', 'cashew', 'pecan', 'pistachio', 'hazelnut', 'macadamia', 'brazil nut'],
  Dairy: [
    'milk',
    'cheese',
    'butter',
    'cream',
    'yogurt',
    'whey',
    'ghee',
    'casein',
    'parmesan',
    'cheddar',
    'ricotta',
    'mozzarella',
    'paneer',
    'feta',
    'gouda',
    'brie',
    'halloumi',
  ],
  Eggs: ['egg', 'mayonnaise', 'aioli', 'albumin', 'meringue'],
  Fish: ['fish', 'salmon', 'tuna', 'cod', 'anchovy', 'halibut', 'trout', 'sea bass', 'haddock', 'mackerel', 'sardine', 'fish sauce'],
  Shellfish: ['shrimp', 'prawn', 'crab', 'lobster', 'clam', 'mussel', 'oyster', 'scallop', 'squid', 'calamari', 'octopus'],
  Gluten: ['flour', 'wheat', 'bread', 'pasta', 'spaghetti', 'penne', 'barley', 'rye', 'couscous', 'seitan', 'semolina'],
  Soy: ['soy', 'tofu', 'edamame', 'tempeh', 'miso'],
  Sesame: ['sesame', 'tahini', 'halva'],
};

const MEAT_KEYWORDS = [
  'beef',
  'pork',
  'chicken',
  'turkey',
  'lamb',
  'bacon',
  'ham',
  'sausage',
  'prosciutto',
  'pancetta',
  'veal',
  'duck',
  'venison',
  'steak',
  'mince',
];

const SEAFOOD_KEYWORDS = [
  'fish',
  'salmon',
  'tuna',
  'cod',
  'shrimp',
  'prawn',
  'crab',
  'lobster',
  'anchovy',
  'clam',
  'mussel',
  'oyster',
  'calamari',
  'squid',
];

// Zod Schema for Validating OpenAI Recipe Output
export const GeneratedRecipeSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(300),
  cuisine: z.enum(['Italian', 'Asian', 'Mexican', 'Indian', 'Mediterranean', 'British']),
  vibes: z.array(z.string()).min(1),
  prepTimeMinutes: z.number().int().min(1).max(180),
  cookTimeMinutes: z.number().int().min(1).max(240),
  servings: z.number().int().min(1).max(12),
  calories: z.number().int().min(100).max(2000),
  carbsGrams: z.number().int().min(0).max(300),
  proteinGrams: z.number().int().min(0).max(200),
  fatGrams: z.number().int().min(0).max(200),
  ingredients: z.array(
    z.object({
      name: z.string().min(2),
      quantity: z.number().positive(),
      unit: z.string(),
      aisle: z.enum([
        'Fresh Produce',
        'Meat & Seafood',
        'Dairy & Refrigerated',
        'Pantry & Grains',
        'Bakery',
        'Spices & Condiments',
        'Frozen',
      ]),
      estimatedCost: z.number().min(0),
      icon: z.string().optional(),
    })
  ).min(2),
  instructions: z.array(z.string().min(5)).min(2),
  dietaryTags: z.array(z.enum(['Vegetarian', 'Vegan', 'Pescatarian', 'None'])),
  allergens: z.array(
    z.enum(['Gluten', 'Dairy', 'Peanuts', 'Tree Nuts', 'Eggs', 'Fish', 'Shellfish', 'Soy', 'Sesame'])
  ),
  equipmentNeeded: z.array(
    z.enum(['Air Fryer', 'Slow Cooker', 'Hob Only', 'Oven', 'Blender', 'Instant Pot'])
  ),
});

export interface LeftoverRecipeResult {
  recipe: IRecipe;
  isAiGenerated: boolean;
  fallback: boolean;
  note?: string;
}

export interface PlanIntentResult {
  plan: IMealPlanDoc;
  summary: string;
  isAiGenerated: boolean;
  fallback: boolean;
}

export class AiService {
  /**
   * Deterministically verifies that a recipe contains no excluded allergens or dietary violations.
   * Checks both explicit tags and all ingredient names against keyword boundaries.
   */
  public static auditRecipeSafety(
    recipe: z.infer<typeof GeneratedRecipeSchema>,
    excludedAllergens: Allergen[],
    dietaryNeeds: DietaryNeed[]
  ): { safe: boolean; reason?: string } {
    // 1. Audit explicit recipe allergen tags
    if (recipe.allergens && recipe.allergens.length > 0 && excludedAllergens.length > 0) {
      const violatedTag = recipe.allergens.find((a) => excludedAllergens.includes(a as Allergen));
      if (violatedTag) {
        return { safe: false, reason: `Recipe declared excluded allergen tag: ${violatedTag}` };
      }
    }

    // 2. Audit every single ingredient against excluded allergen keywords
    for (const ing of recipe.ingredients) {
      const lowerName = ing.name.toLowerCase();

      for (const allergen of excludedAllergens) {
        const keywords = ALLERGEN_KEYWORDS[allergen] || [];
        for (const kw of keywords) {
          const regex = new RegExp(`\\b${kw}\\b|${kw}`, 'i');
          if (regex.test(lowerName)) {
            return {
              safe: false,
              reason: `Ingredient "${ing.name}" matches excluded allergen "${allergen}" keyword "${kw}"`,
            };
          }
        }
      }
    }

    // 3. Audit dietary restrictions
    const activeDiets = dietaryNeeds.filter((d) => d !== 'None');
    if (activeDiets.length > 0) {
      for (const ing of recipe.ingredients) {
        const lowerName = ing.name.toLowerCase();

        // Vegan: No meat, poultry, seafood, dairy, eggs
        if (activeDiets.includes('Vegan')) {
          if (MEAT_KEYWORDS.some((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(lowerName))) {
            return { safe: false, reason: `Vegan violation: Ingredient "${ing.name}" contains meat` };
          }
          if (SEAFOOD_KEYWORDS.some((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(lowerName))) {
            return { safe: false, reason: `Vegan violation: Ingredient "${ing.name}" contains seafood` };
          }
          const dairyEggKeywords = [...ALLERGEN_KEYWORDS.Dairy, ...ALLERGEN_KEYWORDS.Eggs];
          if (dairyEggKeywords.some((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(lowerName))) {
            return { safe: false, reason: `Vegan violation: Ingredient "${ing.name}" contains dairy or eggs` };
          }
        }

        // Vegetarian: No meat, poultry, seafood
        if (activeDiets.includes('Vegetarian')) {
          if (MEAT_KEYWORDS.some((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(lowerName))) {
            return { safe: false, reason: `Vegetarian violation: Ingredient "${ing.name}" contains meat` };
          }
          if (SEAFOOD_KEYWORDS.some((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(lowerName))) {
            return { safe: false, reason: `Vegetarian violation: Ingredient "${ing.name}" contains seafood` };
          }
        }

        // Pescatarian: No land meat or poultry
        if (activeDiets.includes('Pescatarian')) {
          if (MEAT_KEYWORDS.some((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(lowerName))) {
            return { safe: false, reason: `Pescatarian violation: Ingredient "${ing.name}" contains land meat` };
          }
        }
      }
    }

    return { safe: true };
  }

  /**
   * Generates a creative recipe from leftover pantry ingredients using OpenAI,
   * with strict allergen pre-injection, deterministic post-validation, and safe database fallback.
   */
  public static async generateLeftoverRecipe(
    userId: string,
    ingredients: string[],
    options: {
      cuisine?: Cuisine;
      maxCookTimeMinutes?: number;
      equipment?: KitchenEquipment;
      servings?: number;
      additionalNotes?: string;
    } = {}
  ): Promise<LeftoverRecipeResult> {
    const preference = (await Preference.findOne({ user: userId })) || {
      dietaryNeeds: ['None'],
      allergies: [],
      supermarket: 'Aldi',
      householdSize: 2,
    };

    const excludedAllergens = (preference.allergies || []) as Allergen[];
    const dietaryNeeds = (preference.dietaryNeeds || ['None']) as DietaryNeed[];

    // Enforce weekly quota and atomically reserve an AI query slot
    const reservation = await EntitlementService.reserveAiUsage(userId);

    // Check if AI is enabled and configured
    if (!isAIFeatureEnabled()) {
      await reservation.rollback();
      return this.fallbackToDeterministicRecipe(userId, preference, ingredients, 'AI features are currently offline. Showing a verified database recipe.');
    }

    try {
      const client = getOpenAIClient();
      const model = getOpenAIModel();

      const allergenPrompt =
        excludedAllergens.length > 0
          ? `STRICT EXCLUSION: User is SEVERELY allergic to: ${excludedAllergens.join(', ')}. You MUST NEVER include these ingredients, derivatives, or cross-contaminants under ANY circumstance.`
          : 'No specific food allergies.';

      const dietPrompt =
        dietaryNeeds.length > 0 && !dietaryNeeds.includes('None')
          ? `STRICT DIETARY REQUIREMENT: The recipe must be 100% compliant with: ${dietaryNeeds.join(', ')}.`
          : 'No specific dietary restriction.';

      const systemPrompt = `You are Chef Mise, an expert culinary assistant for home cooks.
Create a delicious, realistic home-cooked dinner recipe centered around the user's available leftover ingredients.
${allergenPrompt}
${dietPrompt}
Target servings: ${options.servings || preference.householdSize || 2}.
Preferred cuisine: ${options.cuisine || 'Any'}.
Max cook time: ${options.maxCookTimeMinutes || 30} minutes.
Available equipment: ${options.equipment || 'Hob Only'}.
Special user notes: ${options.additionalNotes || 'None'}.

Respond ONLY with a valid JSON object matching this schema:
{
  "title": string,
  "description": string,
  "cuisine": "Italian" | "Asian" | "Mexican" | "Indian" | "Mediterranean" | "British",
  "vibes": string[],
  "prepTimeMinutes": number,
  "cookTimeMinutes": number,
  "servings": number,
  "calories": number,
  "carbsGrams": number,
  "proteinGrams": number,
  "fatGrams": number,
  "ingredients": [
    {
      "name": string,
      "quantity": number,
      "unit": string,
      "aisle": "Fresh Produce" | "Meat & Seafood" | "Dairy & Refrigerated" | "Pantry & Grains" | "Bakery" | "Spices & Condiments" | "Frozen",
      "estimatedCost": number,
      "icon": string
    }
  ],
  "instructions": string[],
  "dietaryTags": ("Vegetarian" | "Vegan" | "Pescatarian" | "None")[],
  "allergens": ("Gluten" | "Dairy" | "Peanuts" | "Tree Nuts" | "Eggs" | "Fish" | "Shellfish" | "Soy" | "Sesame")[],
  "equipmentNeeded": ("Air Fryer" | "Slow Cooker" | "Hob Only" | "Oven" | "Blender" | "Instant Pot")[]
}`;

      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Create a recipe utilizing these ingredients: ${ingredients.join(', ')}. Feel free to add common pantry staples (oil, salt, pepper, garlic).`,
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1000,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('OpenAI returned an empty response.');
      }

      const parsedJson = JSON.parse(content);
      const validatedRecipe = GeneratedRecipeSchema.parse(parsedJson);

      // Deterministic Server-Side Safety Audit
      const audit = this.auditRecipeSafety(validatedRecipe, excludedAllergens, dietaryNeeds);
      if (!audit.safe) {
        console.warn(`[AiService] AI generated recipe failed safety audit: ${audit.reason}. Discarding and using fallback.`);
        await reservation.rollback();
        return this.fallbackToDeterministicRecipe(
          userId,
          preference,
          ingredients,
          'Recipe suggestion adjusted to strictly preserve your allergy exclusions.'
        );
      }

      // Record successful AI query against weekly entitlement
      await reservation.commit();

      const recipeOutput: IRecipe = {
        ...validatedRecipe,
        slug: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
        cuisine: validatedRecipe.cuisine as Cuisine,
        vibes: validatedRecipe.vibes as MealVibe[],
        dietaryTags: validatedRecipe.dietaryTags as DietaryNeed[],
        allergens: validatedRecipe.allergens as Allergen[],
        equipmentNeeded: validatedRecipe.equipmentNeeded as KitchenEquipment[],
        ingredients: validatedRecipe.ingredients.map((ing) => ({
          ...ing,
          aisle: ing.aisle as SupermarketAisle,
        })),
      };

      return {
        recipe: recipeOutput,
        isAiGenerated: true,
        fallback: false,
      };
    } catch (err: any) {
      console.warn(`[AiService] OpenAI leftover generation failed: ${err.message}. Falling back to verified catalog.`);
      await reservation.rollback();
      return this.fallbackToDeterministicRecipe(
        userId,
        preference,
        ingredients,
        'OpenAI unavailable. Showing a verified matching database recipe.'
      );
    }
  }

  /**
   * Safe fallback retrieving a verified database recipe complying with the user's safety query.
   */
  private static async fallbackToDeterministicRecipe(
    userId: string,
    preference: any,
    ingredients: string[],
    note?: string
  ): Promise<LeftoverRecipeResult> {
    const safetyQuery = PlannerService.buildSafetyQuery(preference);
    const rawCandidates = await Recipe.find(safetyQuery);

    // Defense-in-depth: Verify every single candidate against user's excluded allergens
    const candidates = rawCandidates.filter((c) =>
      PlannerService.validateRecipeAllergySafety(c, preference.allergies)
    );

    if (candidates.length === 0) {
      throw new NoRecipesFoundError(
        'No safe recipes found matching your active dietary preferences and allergen exclusions.'
      );
    }

    // Try to find a recipe matching some of the user's ingredients
    let bestMatch = candidates[0];
    let maxMatchCount = 0;

    for (const c of candidates) {
      const matchingCount = c.ingredients.filter((i) =>
        ingredients.some((ing) => i.name.toLowerCase().includes(ing.toLowerCase()))
      ).length;
      if (matchingCount > maxMatchCount) {
        maxMatchCount = matchingCount;
        bestMatch = c;
      }
    }

    return {
      recipe: bestMatch.toObject() as unknown as IRecipe,
      isAiGenerated: false,
      fallback: true,
      note,
    };
  }

  /**
   * Parses natural language plan intent with OpenAI to parameterize the deterministic weekly meal planner.
   */
  public static async customizePlanWithIntent(
    userId: string,
    userPrompt: string
  ): Promise<PlanIntentResult> {
    const userPrefDoc = await Preference.findOne({ user: userId });
    const preference: Partial<IPreference> = userPrefDoc
      ? userPrefDoc.toObject()
      : {
          dietaryNeeds: ['None'],
          allergies: [],
          supermarket: 'Aldi',
          householdSize: 2,
          cookingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        };

    // Enforce weekly quota and atomically reserve an AI query slot
    const reservation = await EntitlementService.reserveAiUsage(userId);

    // If AI feature is disabled or unconfigured, fallback immediately to deterministic planner
    if (!isAIFeatureEnabled()) {
      await reservation.rollback();
      const plan = await PlannerService.generateWeeklyPlan(userId, preference);
      await ShoppingListService.generateOrUpdateShoppingList(userId, plan._id.toString());
      const populated = await MealPlan.findById(plan._id).populate('dinners.recipe').populate('meals.recipe');
      return {
        plan: populated!,
        summary: 'AI customization is currently offline. Generated plan using your default saved preferences.',
        isAiGenerated: false,
        fallback: true,
      };
    }

    try {
      const client = getOpenAIClient();
      const model = getOpenAIModel();

      const daysList = preference.cookingDays?.join(', ') || 'Monday, Tuesday, Wednesday, Thursday, Friday';

      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: `You are the meal plan intent parser for Mise Meal Planner.
Given the user's natural language request, extract desired meal vibes and cuisines per day for these active cooking days: ${daysList}.
Supported Meal Vibes: "Speedy Meals", "Low Calorie", "Family Favs", "Healthy Comfort", "Fakeaway", "Gut Friendly", "Protein Packed", "British Staples".
Supported Cuisines: "Italian", "Asian", "Mexican", "Indian", "Mediterranean", "British".

Respond ONLY with a JSON object matching this schema:
{
  "summary": string (1 sentence explaining your interpretation of their week),
  "preferredVibes": string[] (up to 3 overall vibes),
  "dayOverrides": {
    "[DayName]": {
      "vibe": string,
      "cuisine": string
    }
  }
}`,
          },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 500,
        temperature: 0.5,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('OpenAI returned empty plan intent.');

      const parsed = JSON.parse(content);
      const summary = parsed.summary || 'Custom plan generated based on your notes.';

      // Apply interpreted vibes to a temporary preference object without destroying user defaults
      const customizedPref: Partial<IPreference> = {
        ...preference,
        vibes: (parsed.preferredVibes && parsed.preferredVibes.length > 0 ? parsed.preferredVibes : preference.vibes) as MealVibe[],
      };

      // Generate the weekly plan using the deterministic engine (guarantees allergen safety, pricing, and catalog recipes!)
      const plan = await PlannerService.generateWeeklyPlan(userId, customizedPref);
      await ShoppingListService.generateOrUpdateShoppingList(userId, plan._id.toString());

      await reservation.commit();

      const populated = await MealPlan.findById(plan._id).populate('dinners.recipe').populate('meals.recipe');

      return {
        plan: populated!,
        summary,
        isAiGenerated: true,
        fallback: false,
      };
    } catch (err: any) {
      console.warn(`[AiService] OpenAI plan intent parsing failed: ${err.message}. Generating default plan.`);
      await reservation.rollback();
      const plan = await PlannerService.generateWeeklyPlan(userId, preference);
      await ShoppingListService.generateOrUpdateShoppingList(userId, plan._id.toString());
      const populated = await MealPlan.findById(plan._id).populate('dinners.recipe').populate('meals.recipe');
      return {
        plan: populated!,
        summary: 'Generated plan using your default saved preferences (AI unavailable).',
        isAiGenerated: false,
        fallback: true,
      };
    }
  }
}
