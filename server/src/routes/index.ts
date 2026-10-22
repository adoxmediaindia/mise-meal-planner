import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as authCtrl from '../controllers/authController.js';
import * as prefCtrl from '../controllers/preferencesController.js';
import * as recipeCtrl from '../controllers/recipesController.js';
import * as planCtrl from '../controllers/planController.js';
import * as shopCtrl from '../controllers/shoppingListController.js';
import * as subCtrl from '../controllers/subscriptionController.js';

const router = Router();

// 1. Auth routes
router.post('/auth/register', validate(authCtrl.registerSchema), authCtrl.register);
router.post('/auth/login', validate(authCtrl.loginSchema), authCtrl.login);
router.post('/auth/logout', authCtrl.logout);
router.get('/auth/me', authenticate, authCtrl.me);

// 2. Preferences routes
router.get('/preferences', authenticate, prefCtrl.getPreferences);
router.put('/preferences', authenticate, validate(prefCtrl.updatePreferenceSchema), prefCtrl.updatePreferences);

// 3. Recipes routes
router.get('/recipes', recipeCtrl.getRecipes);
router.get('/recipes/:id', recipeCtrl.getRecipeById);
router.post('/recipes/:id/favorite', authenticate, recipeCtrl.toggleFavorite);
router.post('/recipes/:id/reaction', recipeCtrl.submitReaction);

// 4. Meal Plan routes
router.get('/plan/current', authenticate, planCtrl.getCurrentPlan);
router.post('/plan/generate', authenticate, planCtrl.generatePlan);
router.put('/plan/swap-meal', authenticate, validate(planCtrl.swapMealSchema), planCtrl.swapMeal);
router.patch('/plan/dinners/:day/cooked', authenticate, planCtrl.toggleDinnerCooked);

// 5. Shopping List routes
router.get('/shopping-list', authenticate, shopCtrl.getShoppingList);
router.patch('/shopping-list/item/:itemId', authenticate, shopCtrl.toggleItem);
router.post('/shopping-list/reset', authenticate, shopCtrl.resetList);

// 6. Subscriptions routes
router.get('/subscriptions/status', authenticate, subCtrl.getStatus);
router.post('/subscriptions/mock-upgrade', authenticate, subCtrl.mockUpgrade);

export default router;
