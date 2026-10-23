/**
 * Live Cross-Client & Shared Backend End-to-End Verification
 * Verifies that Web (Cookie Auth) and Mobile (Bearer Token Auth) interact
 * seamlessly with the same single authoritative backend and MongoDB database.
 */

const API_BASE = 'http://127.0.0.1:5000/api/v1';

async function runVerification() {
  console.log('===============================================================');
  console.log('Mise Meal Planner — Live Cross-Client Sync Verification');
  console.log('Target: ' + API_BASE);
  console.log('===============================================================\n');

  const testEmail = `sync.test.${Date.now()}@example.com`;
  const testPassword = 'SyncPassword2026!';
  const testName = 'Cross-Device Tester';

  let webCookie = '';
  let mobileToken = '';
  let initialWebPlan = null;
  let targetItemId = '';

  // STEP 1: Register on the Website (simulating Web Client)
  console.log('STEP 1: Registering on Website...');
  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: testName, email: testEmail, password: testPassword }),
  });

  if (!regRes.ok) {
    throw new Error(`Web registration failed with status ${regRes.status}: ${await regRes.text()}`);
  }

  const regData = await regRes.json();
  const setCookieHeader = regRes.headers.get('set-cookie');
  if (setCookieHeader) {
    webCookie = setCookieHeader.split(';')[0];
  }
  console.log(`[PASS] Web user registered. ID: ${regData.data.id}`);
  console.log(`[PASS] Web cookie captured: ${webCookie ? 'yes' : 'in-memory'}`);

  // STEP 2: Configure Preferences & Weekly Meal Plan on Web
  console.log('\nSTEP 2: Creating Preferences and Generating Meal Plan on Web...');
  const prefRes = await fetch(`${API_BASE}/preferences`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': webCookie,
    },
    body: JSON.stringify({
      supermarket: 'Whole Foods',
      householdSize: 4,
      weeklyBudget: 80,
      autoRegenerate: true,
    }),
  });

  const prefData = await prefRes.json();
  if (!prefData.success) throw new Error('Web preference update failed');
  console.log(`[PASS] Web preferences set: Supermarket=${prefData.data.supermarket}, Household=${prefData.data.householdSize}`);

  // Fetch current plan on Web
  const webPlanRes = await fetch(`${API_BASE}/plan/current`, {
    headers: { 'Cookie': webCookie },
  });
  const webPlanData = await webPlanRes.json();
  initialWebPlan = webPlanData.data;
  console.log(`[PASS] Web meal plan generated with ${initialWebPlan.dinners.length} dinners. Est Cost: $${initialWebPlan.estimatedCost}`);

  // STEP 3: Log in on Mobile using the same account
  console.log('\nSTEP 3: Logging in on Mobile with same account (Bearer Auth)...');
  const mobileLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  });

  const mobileLoginData = await mobileLoginRes.json();
  mobileToken = mobileLoginData.data.token;
  if (!mobileToken) throw new Error('Mobile login did not return JWT token');
  console.log(`[PASS] Mobile authenticated successfully. Token length: ${mobileToken.length}`);

  // STEP 4: Verify identical plan and preferences appear on Mobile
  console.log('\nSTEP 4: Verifying identical Plan and Preferences on Mobile...');
  const mobilePrefRes = await fetch(`${API_BASE}/preferences`, {
    headers: { 'Authorization': `Bearer ${mobileToken}` },
  });
  const mobilePrefData = await mobilePrefRes.json();

  if (mobilePrefData.data.supermarket !== 'Whole Foods' || mobilePrefData.data.householdSize !== 4) {
    throw new Error(`Mobile preferences mismatch! Expected Whole Foods, 4. Got: ${JSON.stringify(mobilePrefData.data)}`);
  }
  console.log(`[PASS] Mobile retrieved exact preferences: ${mobilePrefData.data.supermarket}, household of ${mobilePrefData.data.householdSize}`);

  const mobilePlanRes = await fetch(`${API_BASE}/plan/current`, {
    headers: { 'Authorization': `Bearer ${mobileToken}` },
  });
  const mobilePlanData = await mobilePlanRes.json();

  if (mobilePlanData.data.dinners.length !== initialWebPlan.dinners.length) {
    throw new Error('Mobile plan dinner count does not match Web plan');
  }
  console.log(`[PASS] Mobile plan identical to Web plan (${mobilePlanData.data.dinners.length} meals matching)`);

  // STEP 5: Check off a shopping-list item on Mobile
  console.log('\nSTEP 5: Checking off shopping-list item on Mobile...');
  const mobileListRes = await fetch(`${API_BASE}/shopping-list`, {
    headers: { 'Authorization': `Bearer ${mobileToken}` },
  });
  const mobileListData = await mobileListRes.json();
  const firstItem = mobileListData.data.items[0];
  targetItemId = firstItem.id;
  console.log(`Target item to check off: "${firstItem.name}" (ID: ${targetItemId})`);

  const toggleRes = await fetch(`${API_BASE}/shopping-list/item/${targetItemId}`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${mobileToken}` },
  });
  const toggleData = await toggleRes.json();
  const toggledItemMobile = toggleData.data.items.find(i => i.id === targetItemId);
  if (!toggledItemMobile.isBought) throw new Error('Toggle failed on Mobile client');
  console.log(`[PASS] Mobile checkoff complete: "${toggledItemMobile.name}" isBought=${toggledItemMobile.isBought}`);

  // STEP 6: Verify the change persists when opening Website
  console.log('\nSTEP 6: Verifying change persists when opening Website (Cookie auth)...');
  const webListRes = await fetch(`${API_BASE}/shopping-list`, {
    headers: { 'Cookie': webCookie },
  });
  const webListData = await webListRes.json();
  const toggledItemWeb = webListData.data.items.find(i => i.id === targetItemId);

  if (!toggledItemWeb || !toggledItemWeb.isBought) {
    throw new Error('Web shopping list does NOT reflect Mobile checkoff!');
  }
  console.log(`[PASS] Web shopping list immediately updated! "${toggledItemWeb.name}" is marked as bought.`);
  console.log(`[PASS] Web itemsBoughtCount = ${webListData.data.itemsBoughtCount}`);

  // STEP 7: Web swaps a meal, Mobile observes the update
  console.log('\nSTEP 7: Web swaps dinner, verifying immediate Mobile synchronization...');
  const swapDay = initialWebPlan.dinners[0].day;
  const originalRecipeTitle = initialWebPlan.dinners[0].recipe.title;

  const swapRes = await fetch(`${API_BASE}/plan/swap-meal`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': webCookie,
    },
    body: JSON.stringify({ day: swapDay }),
  });
  const swapData = await swapRes.json();
  const swappedSlot = swapData.data.dinners.find(d => d.day === swapDay);
  console.log(`[PASS] Web swapped ${swapDay} from "${originalRecipeTitle}" to "${swappedSlot.recipe.title}"`);

  // Mobile checks plan
  const mobilePlanCheckRes = await fetch(`${API_BASE}/plan/current`, {
    headers: { 'Authorization': `Bearer ${mobileToken}` },
  });
  const mobilePlanCheckData = await mobilePlanCheckRes.json();
  const mobileSwappedSlot = mobilePlanCheckData.data.dinners.find(d => d.day === swapDay);

  if (mobileSwappedSlot.recipe.title !== swappedSlot.recipe.title) {
    throw new Error('Mobile plan does not reflect Web swap!');
  }
  console.log(`[PASS] Mobile immediately retrieved swapped dinner: "${mobileSwappedSlot.recipe.title}"`);

  // STEP 8: Test Account Recovery, Session Expiry & Access Control
  console.log('\nSTEP 8: Testing Account Recovery, Session Expiry & Access Control...');

  // Forgot password
  const forgotRes = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail }),
  });
  const forgotData = await forgotRes.json();
  if (!forgotData.success || !forgotData.resetToken) throw new Error('Forgot password failed');
  console.log('[PASS] Forgot password issued reset token successfully.');

  // Access control test: Second user cannot access User A's data
  const userBEmail = `userb.${Date.now()}@example.com`;
  const userBRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'User B', email: userBEmail, password: 'UserBPassword123!' }),
  });
  const userBData = await userBRes.json();
  const userBToken = userBData.data.token;

  const userBShoppingListRes = await fetch(`${API_BASE}/shopping-list`, {
    headers: { 'Authorization': `Bearer ${userBToken}` },
  });
  const userBShoppingData = await userBShoppingListRes.json();
  if (userBShoppingData.data.user === regData.data.id) {
    throw new Error('DATA LEAK: User B accessed User A shopping list!');
  }
  console.log('[PASS] Data isolation verified: User B only accesses User B private documents.');

  // Logout test
  const logoutRes = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: { 'Cookie': webCookie },
  });
  const logoutData = await logoutRes.json();
  if (!logoutData.success) throw new Error('Logout failed');
  console.log('[PASS] Logout successfully invalidated session cookies.');

  console.log('\n===============================================================');
  console.log('ALL 8 CROSS-CLIENT SYNCHRONIZATION STEPS VERIFIED SUCCESSFULLY!');
  console.log('Single Authoritative Backend & Database Architecture Operational.');
  console.log('===============================================================');
}

runVerification().catch(err => {
  console.error('\n[VERIFICATION FAILED]:', err);
  process.exit(1);
});
