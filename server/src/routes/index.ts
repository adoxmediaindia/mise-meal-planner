import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter, aiLimiter } from '../middleware/rateLimiter.js';
import * as authCtrl from '../controllers/authController.js';
import * as prefCtrl from '../controllers/preferencesController.js';
import * as recipeCtrl from '../controllers/recipesController.js';
import * as planCtrl from '../controllers/planController.js';
import * as shopCtrl from '../controllers/shoppingListController.js';
import * as subCtrl from '../controllers/subscriptionController.js';
import * as pantryCtrl from '../controllers/pantryController.js';
import * as householdCtrl from '../controllers/householdController.js';
import * as adminCtrl from '../controllers/adminController.js';
import * as aiCtrl from '../controllers/aiController.js';

const router = Router();

// 1. Auth routes (Rate-limited on sensitive endpoints)
router.post('/auth/register', authLimiter, validate(authCtrl.registerSchema), authCtrl.register);
router.post('/auth/login', authLimiter, validate(authCtrl.loginSchema), authCtrl.login);
router.post('/auth/logout', authCtrl.logout);
router.get('/auth/me', authenticate, authCtrl.me);
router.post('/auth/forgot-password', authLimiter, validate(authCtrl.forgotPasswordSchema), authCtrl.forgotPassword);
router.post('/auth/reset-password', authLimiter, validate(authCtrl.resetPasswordSchema), authCtrl.resetPassword);

// 2. Preferences routes
router.get('/preferences', authenticate, prefCtrl.getPreferences);
router.put('/preferences', authenticate, validate(prefCtrl.updatePreferenceSchema), prefCtrl.updatePreferences);

// 3. Recipes routes
router.get('/recipes', recipeCtrl.getRecipes);
router.get('/recipes/favorites', authenticate, recipeCtrl.getFavorites);
router.get('/recipes/:id', recipeCtrl.getRecipeById);
router.post('/recipes/:id/favorite', authenticate, recipeCtrl.toggleFavorite);
router.post('/recipes/:id/reaction', recipeCtrl.submitReaction);

// 4. Meal Plan routes
router.get('/plan/current', authenticate, planCtrl.getCurrentPlan);
router.get('/plan/history', authenticate, planCtrl.getPlanHistory);
router.post('/plan/generate', authenticate, planCtrl.generatePlan);
router.post('/plan/archive', authenticate, planCtrl.archiveCurrentPlan);
router.put('/plan/swap-meal', authenticate, validate(planCtrl.swapMealSchema), planCtrl.swapMeal);
router.patch('/plan/dinners/:day/cooked', authenticate, planCtrl.toggleDinnerCooked);
router.post('/plan/meals', authenticate, validate(planCtrl.addMealSlotSchema), planCtrl.addMealSlot);
router.delete('/plan/meals/:slotId', authenticate, planCtrl.removeMealSlot);
router.patch('/plan/meals/:slotId', authenticate, validate(planCtrl.editMealSlotSchema), planCtrl.editMealSlot);
router.patch('/plan/household-size', authenticate, validate(planCtrl.updateHouseholdSizeSchema), planCtrl.updateHouseholdSize);

// 5. Shopping List routes
router.get('/shopping-list', authenticate, shopCtrl.getShoppingList);
router.patch('/shopping-list/item/:itemId', authenticate, shopCtrl.toggleItem);
router.post('/shopping-list/reset', authenticate, shopCtrl.resetList);
router.post('/shopping-list/items', authenticate, validate(shopCtrl.addCustomItemSchema), shopCtrl.addCustomItem);
router.patch('/shopping-list/items/:itemId', authenticate, validate(shopCtrl.editItemSchema), shopCtrl.editItem);
router.delete('/shopping-list/items/:itemId', authenticate, shopCtrl.deleteItem);

// 6. Subscriptions routes
router.get('/subscriptions/status', authenticate, subCtrl.getStatus);
router.get('/subscriptions/usage', authenticate, subCtrl.getUsageStats);
router.post('/subscriptions/upgrade', authenticate, validate(subCtrl.upgradePlanSchema), subCtrl.upgradeSubscription);
router.post('/subscriptions/cancel', authenticate, subCtrl.cancelSubscription);
router.post('/subscriptions/reactivate', authenticate, subCtrl.reactivateSubscription);
router.get('/subscriptions/invoices', authenticate, subCtrl.getInvoices);
router.post('/subscriptions/mock-upgrade', authenticate, subCtrl.mockUpgrade);
router.post('/subscriptions/webhook', subCtrl.webhook);

// 7. Pantry routes
router.get('/pantry', authenticate, pantryCtrl.getPantryItems);
router.post('/pantry', authenticate, validate(pantryCtrl.addPantryItemSchema), pantryCtrl.addPantryItem);
router.patch('/pantry/:id', authenticate, validate(pantryCtrl.updatePantryItemSchema), pantryCtrl.updatePantryItem);
router.delete('/pantry/:id', authenticate, pantryCtrl.deletePantryItem);
router.post('/pantry/:id/consume', authenticate, validate(pantryCtrl.consumePantryItemSchema), pantryCtrl.consumePantryItem);
router.get('/pantry/recipes', authenticate, pantryCtrl.getPantryRecipeSuggestions);
router.post('/pantry/recipes/:recipeId/add-missing-to-grocery', authenticate, pantryCtrl.addMissingIngredientsToGrocery);

// 8. Household routes
router.get('/household', authenticate, householdCtrl.getMyHousehold);
router.post('/household', authenticate, validate(householdCtrl.createHouseholdSchema), householdCtrl.createHousehold);
router.post('/household/invitations', authenticate, validate(householdCtrl.inviteMemberSchema), householdCtrl.inviteMember);
router.get('/household/invitations/pending', authenticate, householdCtrl.getPendingInvitations);
router.post('/household/invitations/accept', authenticate, validate(householdCtrl.acceptInvitationSchema), householdCtrl.acceptInvitation);
router.post('/household/invitations/reject', authenticate, validate(householdCtrl.acceptInvitationSchema), householdCtrl.rejectInvitation);
router.delete('/household/invitations/:id', authenticate, householdCtrl.revokeInvitation);
router.delete('/household/members/:memberId', authenticate, householdCtrl.removeMember);
router.post('/household/leave', authenticate, householdCtrl.leaveHousehold);

// 9. Admin routes (Strict requireAdmin protection)
router.get('/admin/metrics', authenticate, requireAdmin, adminCtrl.getMetrics);
router.get('/admin/users', authenticate, requireAdmin, adminCtrl.getUsers);
router.get('/admin/users/:id', authenticate, requireAdmin, adminCtrl.getUserDetails);
router.patch('/admin/users/:id/tier', authenticate, requireAdmin, validate(adminCtrl.updateUserTierSchema), adminCtrl.updateUserTier);
router.get('/admin/recipes', authenticate, requireAdmin, adminCtrl.getAdminRecipes);
router.post('/admin/recipes', authenticate, requireAdmin, validate(adminCtrl.createRecipeSchema), adminCtrl.createAdminRecipe);
router.patch('/admin/recipes/:id', authenticate, requireAdmin, validate(adminCtrl.updateRecipeSchema), adminCtrl.updateAdminRecipe);

// 10. AI Assistant routes (Strict authenticate, aiLimiter, and validation)
router.post(
  '/ai/leftover-recipe',
  authenticate,
  aiLimiter,
  validate(aiCtrl.leftoverRecipeSchema),
  aiCtrl.generateLeftoverRecipe
);
router.post(
  '/ai/plan-intent',
  authenticate,
  aiLimiter,
  validate(aiCtrl.planIntentSchema),
  aiCtrl.customizePlanWithIntent
);

export default router;
