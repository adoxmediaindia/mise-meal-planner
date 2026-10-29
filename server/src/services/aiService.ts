import { z } from 'zod';
import { getGeminiClient, isAIFeatureEnabled, getGeminiModel, getGeminiTimeoutMs } from '../config/gemini.js';
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

// Zod Schema for Validating Gemini Recipe Output
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
   * Safely strips markdown code blocks (e.g. ```json ... ```) from model text output
   */
  public static cleanJson(raw: string): string {
    const trimmed = raw.trim();
    if (trimmed.startsWith('```json')) {
      return trimmed.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
    }
    if (trimmed.startsWith('```')) {
      return trimmed.replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
    }
    return trimmed;
  }

  /**
   * Server-side heuristic safety audit for AI-generated recipes.
   * Checks explicit tags and ingredient names against known allergen/dietary keywords.
   * Note: Automated keyword and tag checks act as an aggressive heuristic filter, but cannot
   * guarantee total biochemical allergen safety. Any unverifiable or failing recipe is rejected
   * and immediately substituted with a verified database catalog recipe.
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
   * Generates a creative recipe from leftover pantry ingredients using Google Gemini,
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
      const client = getGeminiClient();
      const model = getGeminiModel();
      const timeoutMs = getGeminiTimeoutMs();

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

      const response = await AiService.callGeminiWithFallback(
        client,
        model,
        {
          contents: `Create a recipe utilizing these ingredients: ${ingredients.join(', ')}. Feel free to add common pantry staples (oil, salt, pepper, garlic).`,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            temperature: 0.7,
            maxOutputTokens: 2500,
          },
        },
        timeoutMs
      );
      const content = response.text;
      if (!content) {
        throw new Error('Gemini returned an empty response.');
      }

      const parsedJson = JSON.parse(AiService.cleanJson(content));
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
      console.warn(`[AiService] Gemini leftover generation failed: ${err.message}. Falling back to verified catalog.`);
      await reservation.rollback();
      const safeReason = err.message ? err.message.replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED]').slice(0, 150) : undefined;
      return this.fallbackToDeterministicRecipe(
        userId,
        preference,
        ingredients,
        `Gemini unavailable (${safeReason || 'offline'}). Showing a verified matching database recipe.`
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
   * Deterministically extracts dietary needs, strict cook time limits, vibes,
   * cuisines, and allergies from natural language user prompts.
   * Serves as both a standalone deterministic parser and an authoritative validation guard for AI models.
   */
  public static parseIntentConstraints(prompt: string): {
    dietaryNeeds: DietaryNeed[];
    maxCookTimeMinutes?: number;
    vibes: MealVibe[];
    cuisines: Cuisine[];
    allergies: Allergen[];
  } {
    const text = prompt.toLowerCase();
    const dietaryNeeds: DietaryNeed[] = [];
    let maxCookTimeMinutes: number | undefined = undefined;
    const vibes: MealVibe[] = [];
    const cuisines: Cuisine[] = [];
    const allergies: Allergen[] = [];

    // 1. Dietary Needs Extraction
    if (/\b(?:vegan|plant-?based)\b/i.test(text)) {
      dietaryNeeds.push('Vegan');
    } else if (/\b(?:vegetarian|veggie|meat-?free|meatless|no meat)\b/i.test(text)) {
      dietaryNeeds.push('Vegetarian');
    } else if (/\b(?:pescatarian|pescetarian)\b/i.test(text)) {
      dietaryNeeds.push('Pescatarian');
    }

    // 2. Strict Time Limit Extraction
    // Check "under X minutes" / "less than X minutes" -> strictly less than X (<= X - 1)
    const underMatch = text.match(/(?:under|less than|fewer than)\s*(\d+)\s*(?:min|minute)s?/i);
    if (underMatch && underMatch[1]) {
      const parsed = parseInt(underMatch[1], 10);
      if (!isNaN(parsed) && parsed > 0) {
        maxCookTimeMinutes = parsed - 1; // e.g. "under 25 minutes" -> max 24 minutes
      }
    }

    // Check "in X minutes or less" / "max X minutes" / "within X minutes" / "in X minutes"
    const maxMatch =
      text.match(/(?:max(?:imum)?|within|at most|up to)\s*(\d+)\s*(?:min|minute)s?/i) ||
      text.match(/(\d+)\s*(?:min|minute)s?\s*(?:or less|max)/i) ||
      text.match(/(?:ready in|cook(?:ing)? time(?: of)?|in)\s*(\d+)\s*(?:min|minute)s?/i);
    if (maxMatch && maxMatch[1]) {
      const parsed = parseInt(maxMatch[1], 10);
      if (!isNaN(parsed) && parsed > 0) {
        if (maxCookTimeMinutes === undefined || parsed < maxCookTimeMinutes) {
          maxCookTimeMinutes = parsed;
        }
      }
    }

    // 3. Meal Vibes Extraction
    if (/\b(?:quick|fast|speedy|express|rapid|20-?min|15-?min|10-?min)\b/i.test(text)) {
      vibes.push('Speedy Meals');
    }
    if (/\b(?:low cal(?:orie)?|light)\b/i.test(text)) {
      vibes.push('Low Calorie');
    }
    if (/\b(?:family|kid-?friendly|crowd-?pleaser)\b/i.test(text)) {
      vibes.push('Family Favs');
    }
    if (/\b(?:healthy comfort|comfort food|hearty)\b/i.test(text)) {
      vibes.push('Healthy Comfort');
    }
    if (/\b(?:fakeaway|takeaway|takeout)\b/i.test(text)) {
      vibes.push('Fakeaway');
    }
    if (/\b(?:gut|digestion|fiber-rich|gut friendly)\b/i.test(text)) {
      vibes.push('Gut Friendly');
    }
    if (/\b(?:protein|high protein|protein-packed)\b/i.test(text)) {
      vibes.push('Protein Packed');
    }
    if (/\b(?:british|pub|staple)\b/i.test(text)) {
      vibes.push('British Staples');
    }

    // 4. Cuisines
    const supportedCuisines: Cuisine[] = ['Italian', 'Asian', 'Mexican', 'Indian', 'Mediterranean', 'British'];
    for (const c of supportedCuisines) {
      if (new RegExp(`\\b${c}\\b`, 'i').test(text)) {
        cuisines.push(c);
      }
    }

    // 5. Allergens
    if (/\b(?:dairy-?free|no dairy|no milk|no cheese|zero dairy)\b/i.test(text)) allergies.push('Dairy');
    if (/\b(?:gluten-?free|no gluten|no wheat|zero gluten)\b/i.test(text)) allergies.push('Gluten');
    if (/\b(?:nut-?free|no nuts|no peanuts)\b/i.test(text)) {
      allergies.push('Peanuts');
      allergies.push('Tree Nuts');
    }
    if (/\b(?:egg-?free|no eggs)\b/i.test(text)) allergies.push('Eggs');
    if (/\b(?:fish-?free|no fish)\b/i.test(text)) allergies.push('Fish');
    if (/\b(?:shellfish-?free|no shellfish|no shrimp)\b/i.test(text)) allergies.push('Shellfish');
    if (/\b(?:soy-?free|no soy)\b/i.test(text)) allergies.push('Soy');
    if (/\b(?:sesame-?free|no sesame)\b/i.test(text)) allergies.push('Sesame');

    return {
      dietaryNeeds,
      maxCookTimeMinutes,
      vibes,
      cuisines,
      allergies,
    };
  }

  /**
   * Parses natural language plan intent with Google Gemini to parameterize the deterministic weekly meal planner.
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
      const deterministic = AiService.parseIntentConstraints(userPrompt);
      const customizedPref: Partial<IPreference> = {
        ...preference,
        dietaryNeeds: deterministic.dietaryNeeds.length > 0 ? deterministic.dietaryNeeds : preference.dietaryNeeds,
        maxCookTimeMinutes:
          deterministic.maxCookTimeMinutes !== undefined
            ? deterministic.maxCookTimeMinutes
            : preference.maxCookTimeMinutes,
        allergies: Array.from(new Set([...(preference.allergies || []), ...deterministic.allergies])) as Allergen[],
        vibes: (deterministic.vibes.length > 0 ? deterministic.vibes : preference.vibes) as MealVibe[],
      };

      const plan = await PlannerService.generateWeeklyPlan(userId, customizedPref);
      await ShoppingListService.generateOrUpdateShoppingList(userId, plan._id.toString());
      const populated = await MealPlan.findById(plan._id).populate('dinners.recipe').populate('meals.recipe');

      const requestedDays = preference.cookingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const scheduledCount = populated!.dinners.length;
      const constraintNotes: string[] = [];
      const activeDiets = customizedPref.dietaryNeeds?.filter((d) => d !== 'None');
      if (activeDiets && activeDiets.length > 0) constraintNotes.push(activeDiets.join(', '));
      if (customizedPref.maxCookTimeMinutes)
        constraintNotes.push(`under ${customizedPref.maxCookTimeMinutes + 1} minutes`);
      if (customizedPref.vibes && customizedPref.vibes.length > 0) constraintNotes.push(customizedPref.vibes[0]);
      const desc = constraintNotes.join(', ');

      let summary = `Customized your weekly dinners with ${scheduledCount} matching meals.`;
      if (scheduledCount < requestedDays.length) {
        const scheduledDays = populated!.dinners.map((d) => d.day).join(', ');
        summary = `Found ${scheduledCount} recipes matching your strict criteria (${desc}). Scheduled meals on ${scheduledDays}. Catalog has no further unique meals meeting all strict constraints.`;
      }

      return {
        plan: populated!,
        summary,
        isAiGenerated: false,
        fallback: true,
      };
    }

    try {
      const client = getGeminiClient();
      const model = getGeminiModel();
      const timeoutMs = getGeminiTimeoutMs();

      const daysList = preference.cookingDays?.join(', ') || 'Monday, Tuesday, Wednesday, Thursday, Friday';

      const systemPrompt = `You are the meal plan intent parser for Mise Meal Planner.
Given the user's natural language request, extract desired dietary requirements, maximum cooking times, meal vibes, and cuisines per day for these active cooking days: ${daysList}.

Supported Dietary Needs: "Vegetarian", "Vegan", "Pescatarian", "None".
Supported Meal Vibes: "Speedy Meals", "Low Calorie", "Family Favs", "Healthy Comfort", "Fakeaway", "Gut Friendly", "Protein Packed", "British Staples".
Supported Cuisines: "Italian", "Asian", "Mexican", "Indian", "Mediterranean", "British".
Supported Allergens: "Gluten", "Dairy", "Peanuts", "Tree Nuts", "Eggs", "Fish", "Shellfish", "Soy", "Sesame".

CRITICAL TIME LIMIT INSTRUCTION:
If the user specifies "under X minutes" or "less than X minutes", maxCookTimeMinutes must be strictly less than X (at most X - 1, e.g. "under 25 minutes" -> 24).
If the user specifies "in X minutes" or "X minutes or less", maxCookTimeMinutes is X.

Respond ONLY with a JSON object matching this schema:
{
  "summary": string (1-2 sentences explaining your interpretation of their week),
  "dietaryNeeds": ("Vegetarian" | "Vegan" | "Pescatarian" | "None")[],
  "maxCookTimeMinutes": number or null,
  "preferredVibes": string[],
  "cuisines": string[],
  "allergies": string[],
  "dayOverrides": {
    "[DayName]": {
      "vibe": string,
      "cuisine": string
    }
  }
}`;

      const response = await AiService.callGeminiWithFallback(
        client,
        model,
        {
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            temperature: 0.5,
            maxOutputTokens: 1200,
          },
        },
        timeoutMs
      );
      const content = response.text;
      if (!content) throw new Error('Gemini returned empty plan intent.');

      const parsed = JSON.parse(AiService.cleanJson(content));

      // Deterministic validation & merging to guarantee strict safety boundary
      const deterministic = AiService.parseIntentConstraints(userPrompt);

      let finalDietaryNeeds: DietaryNeed[] = preference.dietaryNeeds || ['None'];
      if (deterministic.dietaryNeeds.length > 0) {
        finalDietaryNeeds = deterministic.dietaryNeeds;
      } else if (parsed.dietaryNeeds && Array.isArray(parsed.dietaryNeeds) && parsed.dietaryNeeds.length > 0) {
        const valid = parsed.dietaryNeeds.filter((d: string) =>
          ['Vegetarian', 'Vegan', 'Pescatarian', 'None'].includes(d)
        );
        if (valid.length > 0) finalDietaryNeeds = valid;
      }

      let finalMaxCookTime: number | undefined = preference.maxCookTimeMinutes;
      if (deterministic.maxCookTimeMinutes !== undefined) {
        finalMaxCookTime = deterministic.maxCookTimeMinutes;
      } else if (
        parsed.maxCookTimeMinutes &&
        typeof parsed.maxCookTimeMinutes === 'number' &&
        parsed.maxCookTimeMinutes > 0
      ) {
        finalMaxCookTime = parsed.maxCookTimeMinutes;
      }

      const finalAllergies: Allergen[] = Array.from(
        new Set([...(preference.allergies || []), ...deterministic.allergies, ...(parsed.allergies || [])])
      ) as Allergen[];

      const finalVibes: MealVibe[] = Array.from(
        new Set([...deterministic.vibes, ...(parsed.preferredVibes || []), ...(preference.vibes || [])])
      ).slice(0, 3) as MealVibe[];

      const customizedPref: Partial<IPreference> = {
        ...preference,
        dietaryNeeds: finalDietaryNeeds,
        maxCookTimeMinutes: finalMaxCookTime,
        allergies: finalAllergies,
        vibes: finalVibes,
      };

      // Generate the weekly plan using the deterministic engine (strictly enforces allergen safety, ingredient-level dietary requirements, and strict time limits!)
      const plan = await PlannerService.generateWeeklyPlan(userId, customizedPref);
      await ShoppingListService.generateOrUpdateShoppingList(userId, plan._id.toString());

      await reservation.commit();

      const populated = await MealPlan.findById(plan._id).populate('dinners.recipe').populate('meals.recipe');

      const requestedDays = preference.cookingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const scheduledCount = populated!.dinners.length;

      let summary = parsed.summary || 'Custom plan generated based on your notes.';
      if (!parsed.summary && scheduledCount < requestedDays.length) {
        const scheduledDays = populated!.dinners.map((d) => d.day).join(', ');
        const activeDiets = finalDietaryNeeds.filter((d) => d !== 'None').join(', ');
        const timeLimitStr = finalMaxCookTime ? `under ${finalMaxCookTime + 1} minutes` : '';
        const constraintDetails = [activeDiets, timeLimitStr].filter(Boolean).join(' and ');
        summary = `Found ${scheduledCount} recipes matching your strict criteria (${constraintDetails}). Scheduled dinners on ${scheduledDays}. Catalog has no further unique meals meeting all strict constraints.`;
      }

      return {
        plan: populated!,
        summary,
        isAiGenerated: true,
        fallback: false,
      };
    } catch (err: any) {
      console.warn(`[AiService] Gemini plan intent parsing failed: ${err.message}. Generating deterministic plan.`);
      await reservation.rollback();

      const deterministic = AiService.parseIntentConstraints(userPrompt);
      const customizedPref: Partial<IPreference> = {
        ...preference,
        dietaryNeeds: deterministic.dietaryNeeds.length > 0 ? deterministic.dietaryNeeds : preference.dietaryNeeds,
        maxCookTimeMinutes:
          deterministic.maxCookTimeMinutes !== undefined
            ? deterministic.maxCookTimeMinutes
            : preference.maxCookTimeMinutes,
        allergies: Array.from(new Set([...(preference.allergies || []), ...deterministic.allergies])) as Allergen[],
        vibes: (deterministic.vibes.length > 0 ? deterministic.vibes : preference.vibes) as MealVibe[],
      };

      const plan = await PlannerService.generateWeeklyPlan(userId, customizedPref);
      await ShoppingListService.generateOrUpdateShoppingList(userId, plan._id.toString());
      const populated = await MealPlan.findById(plan._id).populate('dinners.recipe').populate('meals.recipe');

      const requestedDays = preference.cookingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const scheduledCount = populated!.dinners.length;

      const constraintNotes: string[] = [];
      const activeDiets = customizedPref.dietaryNeeds?.filter((d) => d !== 'None');
      if (activeDiets && activeDiets.length > 0) constraintNotes.push(activeDiets.join(', '));
      if (customizedPref.maxCookTimeMinutes)
        constraintNotes.push(`ready in under ${customizedPref.maxCookTimeMinutes + 1} minutes`);
      if (customizedPref.vibes && customizedPref.vibes.length > 0) constraintNotes.push(customizedPref.vibes[0]);
      const desc = constraintNotes.join(', ');

      let summary = `Customized your weekly dinners with ${scheduledCount} ${desc} meals.`;
      if (scheduledCount < requestedDays.length) {
        const scheduledDays = populated!.dinners.map((d) => d.day).join(', ');
        summary = `Found ${scheduledCount} recipes matching your strict criteria (${desc}). Scheduled dinners on ${scheduledDays}. Catalog has no further unique meals meeting all constraints.`;
      }

      return {
        plan: populated!,
        summary,
        isAiGenerated: false,
        fallback: true,
      };
    }
  }

  /**
   * Dispatches generation to Gemini with intelligent model fallback
   * to ensure resilience across different API keys, project quotas, and region availabilities.
   */
  public static async callGeminiWithFallback(
    client: any,
    primaryModel: string,
    params: {
      contents: any;
      config: any;
    },
    timeoutMs: number
  ): Promise<any> {
    const candidateModels = [
      primaryModel,
      'gemini-flash-lite-latest',
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-flash-latest',
    ].filter((m, i, arr) => m && arr.indexOf(m) === i);

    let lastError: any = null;

    for (const m of candidateModels) {
      // Attempt up to 2 tries per model (1 initial + 1 bounded backoff retry for transient 503)
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Gemini request timed out after ${timeoutMs}ms`)), timeoutMs)
          );

          const callPromise = client.models.generateContent({
            ...params,
            model: m,
          });

          const response = await Promise.race([callPromise, timeoutPromise]);
          return response;
        } catch (err: any) {
          lastError = err;
          const msg = (err.message || '').toLowerCase();
          const is503 =
            msg.includes('503') ||
            msg.includes('high demand') ||
            msg.includes('capacity') ||
            msg.includes('unavailable') ||
            err.status === 503;

          // Rate limit (429) or Authentication (401/403): do NOT repeatedly retry, fail fast
          if (
            err.status === 429 ||
            err.status === 401 ||
            err.status === 403 ||
            msg.includes('quota') ||
            msg.includes('rate limit') ||
            msg.includes('api_key')
          ) {
            throw err;
          }

          // If thinkingConfig is unsupported or rejected on this model, retry immediately without thinkingConfig
          if (
            params.config?.thinkingConfig &&
            (msg.includes('thinking') || msg.includes('unknown field') || msg.includes('invalid argument'))
          ) {
            try {
              const strippedConfig = { ...params.config };
              delete strippedConfig.thinkingConfig;
              const strippedCall = client.models.generateContent({
                ...params,
                config: strippedConfig,
                model: m,
              });
              const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error(`Gemini request timed out after ${timeoutMs}ms`)), timeoutMs)
              );
              const response = await Promise.race([strippedCall, timeoutPromise]);
              return response;
            } catch (strippedErr) {
              // fallback to regular candidate loop
            }
          }

          // If 503 high demand spike on attempt 1, wait 1000ms before retrying once
          if (is503 && attempt === 1) {
            console.warn(`[AiService] Gemini model "${m}" returned 503 on attempt 1. Retrying in 1000ms...`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            continue;
          }

          // If 503, timeout, not found, or unsupported, break out of retry loop to try next model
          if (
            is503 ||
            msg.includes('not found') ||
            msg.includes('not supported') ||
            msg.includes('404') ||
            msg.includes('timed out')
          ) {
            console.warn(`[AiService] Gemini model "${m}" unavailable (${err.message}). Trying next candidate model.`);
            break;
          }

          // Any other fatal error, throw immediately
          throw err;
        }
      }
    }

    throw lastError;
  }
}
