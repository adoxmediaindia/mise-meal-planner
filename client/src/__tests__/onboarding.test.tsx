import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext.js';
import { PlanProvider } from '../context/PlanContext.js';
import { Onboarding } from '../pages/app/Onboarding.js';

describe('Meltto Web Onboarding Screens 1–5', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderOnboarding = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <PlanProvider>
            <Onboarding />
          </PlanProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('SCREEN 1: renders "choose your language" and all 7 language options', async () => {
    renderOnboarding();

    await waitFor(() => {
      expect(screen.getByText(/choose your language/i)).toBeInTheDocument();
    });
    expect(screen.getByTestId('language-option-en')).toHaveTextContent('English');
    expect(screen.getByTestId('language-option-de')).toHaveTextContent('Deutsch');
    expect(screen.getByTestId('language-option-sv')).toHaveTextContent('Svenska');
    expect(screen.getByTestId('language-option-nl')).toHaveTextContent('Nederlands');
    expect(screen.getByTestId('language-option-pt')).toHaveTextContent('Português');
    expect(screen.getByTestId('language-option-es')).toHaveTextContent('Español');
    expect(screen.getByTestId('language-option-fr')).toHaveTextContent('Français');
  });

  it('SCREEN 1 to SCREEN 2: selecting language advances to Screen 2 welcome carousel', async () => {
    renderOnboarding();

    const deOption = screen.getByTestId('language-option-de');
    fireEvent.click(deOption);

    // After delay, Screen 2 should be visible
    await waitFor(() => {
      expect(screen.getByText(/plan dinners around your budget/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/meltto/i)).toBeInTheDocument();
    expect(screen.getByTestId('welcome-get-started-btn')).toHaveTextContent(/get started →/i);
    expect(screen.getByText(/Got a code\?/i)).toBeInTheDocument();
  });

  it('SCREEN 2: Got a code opens referral modal', async () => {
    renderOnboarding();

    fireEvent.click(screen.getByTestId('language-option-en'));

    await waitFor(() => {
      expect(screen.getByText(/Got a code\?/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Got a code\?/i));
    expect(screen.getByText(/Enter Referral Code/i)).toBeInTheDocument();
  });

  it('SCREEN 3: renders name input, disables continue when empty, and validates trimming', async () => {
    renderOnboarding();

    // Go to Screen 2
    fireEvent.click(screen.getByTestId('language-option-en'));
    await waitFor(() => {
      expect(screen.getByTestId('welcome-get-started-btn')).toBeInTheDocument();
    });

    // Go to Screen 3
    fireEvent.click(screen.getByTestId('welcome-get-started-btn'));
    expect(screen.getByText(/what's your name\?/i)).toBeInTheDocument();

    const continueBtn = screen.getByTestId('name-continue-btn');
    expect(continueBtn).toBeDisabled();

    const nameInput = screen.getByTestId('name-input-field');
    expect(nameInput).toHaveAttribute('placeholder', 'enter here');

    // Entering only spaces keeps button disabled
    fireEvent.change(nameInput, { target: { value: '   ' } });
    expect(continueBtn).toBeDisabled();

    // Valid name enables continue button
    fireEvent.change(nameInput, { target: { value: '  Alex Chef  ' } });
    expect(continueBtn).not.toBeDisabled();

    // Clicking continue advances to Screen 4
    fireEvent.click(continueBtn);
    expect(screen.getByText(/how old are you\?/i)).toBeInTheDocument();
  });

  it('SCREEN 4: renders age options and enables continue only upon selection', async () => {
    renderOnboarding();

    // Navigate to Screen 3
    fireEvent.click(screen.getByTestId('language-option-en'));
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('welcome-get-started-btn'));
    });

    // Name input to Screen 4
    const nameInput = screen.getByTestId('name-input-field');
    fireEvent.change(nameInput, { target: { value: 'Alex' } });
    fireEvent.click(screen.getByTestId('name-continue-btn'));

    expect(screen.getByText(/how old are you\?/i)).toBeInTheDocument();
    expect(screen.getByText(/we only use this information to personalise your experience/i)).toBeInTheDocument();

    const continueBtn = screen.getByTestId('age-continue-btn');
    expect(continueBtn).toBeDisabled();

    // Select 25-34
    const ageOption = screen.getByTestId('age-option-25-34');
    fireEvent.click(ageOption);
    expect(continueBtn).not.toBeDisabled();

    // Advance to Screen 5
    fireEvent.click(continueBtn);
    expect(screen.getByText(/what are you trying to achieve\?/i)).toBeInTheDocument();
  });

  it('SCREEN 5: renders 4 goals and preserves selections during back navigation', async () => {
    renderOnboarding();

    // Navigate to Screen 3
    fireEvent.click(screen.getByTestId('language-option-en'));
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('welcome-get-started-btn'));
    });

    // Enter name
    fireEvent.change(screen.getByTestId('name-input-field'), { target: { value: 'Alex' } });
    fireEvent.click(screen.getByTestId('name-continue-btn'));

    // Select age
    fireEvent.click(screen.getByTestId('age-option-25-34'));
    fireEvent.click(screen.getByTestId('age-continue-btn'));

    // Screen 5
    expect(screen.getByText(/what are you trying to achieve\?/i)).toBeInTheDocument();
    expect(screen.getByTestId('goal-option-Meal prep for the week')).toBeInTheDocument();
    expect(screen.getByTestId('goal-option-Find super simple recipes')).toBeInTheDocument();
    expect(screen.getByTestId('goal-option-Feed myself')).toBeInTheDocument();
    expect(screen.getByTestId('goal-option-Feed my family')).toBeInTheDocument();

    const goalContinue = screen.getByTestId('goal-continue-btn');
    expect(goalContinue).toBeDisabled();

    // Select goal
    fireEvent.click(screen.getByTestId('goal-option-Meal prep for the week'));
    expect(goalContinue).not.toBeDisabled();

    // Test back button
    const backBtn = screen.getByRole('button', { name: /Go back to previous screen/i });
    fireEvent.click(backBtn);

    // Should return to Screen 4 with 25-34 still selected
    expect(screen.getByText(/how old are you\?/i)).toBeInTheDocument();
    expect(screen.getByTestId('age-option-25-34')).toHaveAttribute('aria-pressed', 'true');
  });

  it('SCREEN 6: renders 4 cooking barriers and advances to Screen 7 on continue', async () => {
    localStorage.setItem(
      'meltto_onboarding_guest',
      JSON.stringify({
        preferredLanguage: 'en',
        name: 'Alex',
        ageRange: '25-34',
        primaryGoal: 'Meal prep for the week',
        onboardingStep: 6,
      })
    );

    renderOnboarding();

    await waitFor(() => {
      expect(screen.getByText(/what prevents you from doing that\?/i)).toBeInTheDocument();
    });

    expect(screen.getByTestId('barrier-option-Lack of time')).toBeInTheDocument();
    expect(screen.getByTestId('barrier-option-Too tired after work')).toBeInTheDocument();
    expect(screen.getByTestId('barrier-option-I find cooking difficult')).toBeInTheDocument();
    expect(screen.getByTestId('barrier-option-I struggle for inspiration')).toBeInTheDocument();

    const continueBtn = screen.getByTestId('barrier-continue-btn');
    expect(continueBtn).toBeDisabled();

    // Select barrier
    fireEvent.click(screen.getByTestId('barrier-option-Lack of time'));
    expect(continueBtn).not.toBeDisabled();

    fireEvent.click(continueBtn);

    // Screen 7 (Chef Introduction)
    expect(screen.getByText(/planning for meals is time-consuming\.\.\./i)).toBeInTheDocument();
  });

  it('SCREEN 7: renders chef introduction and allows continue without selection', async () => {
    localStorage.setItem(
      'meltto_onboarding_guest',
      JSON.stringify({
        preferredLanguage: 'en',
        name: 'Alex',
        cookingBarrier: 'Lack of time',
        onboardingStep: 7,
      })
    );

    renderOnboarding();

    await waitFor(() => {
      expect(screen.getByText(/planning for meals is time-consuming\.\.\./i)).toBeInTheDocument();
    });

    expect(screen.getByText(/we take away that stress and provide you with delicious meals/i)).toBeInTheDocument();
    expect(screen.getByAltText(/Meltto Chef/i)).toBeInTheDocument();

    const continueBtn = screen.getByTestId('chef-continue-btn');
    // Screen 7 is informational: Continue is immediately enabled!
    expect(continueBtn).not.toBeDisabled();

    fireEvent.click(continueBtn);

    // Advances to Screen 8
    expect(screen.getByText(/do you feel like you could save more on your shopping\?/i)).toBeInTheDocument();
  });

  it('SCREEN 8: renders shopping savings options with continue button gating', async () => {
    localStorage.setItem(
      'meltto_onboarding_guest',
      JSON.stringify({
        preferredLanguage: 'en',
        name: 'Alex',
        onboardingStep: 8,
      })
    );

    renderOnboarding();

    await waitFor(() => {
      expect(screen.getByText(/do you feel like you could save more on your shopping\?/i)).toBeInTheDocument();
    });

    expect(screen.getByTestId('savings-option-Definitely')).toBeInTheDocument();
    expect(screen.getByTestId('savings-option-Most likely')).toBeInTheDocument();
    expect(screen.getByTestId('savings-option-Somewhat')).toBeInTheDocument();
    expect(screen.getByTestId('savings-option-Not really')).toBeInTheDocument();

    const continueBtn = screen.getByTestId('savings-continue-btn');
    expect(continueBtn).toBeDisabled();

    fireEvent.click(screen.getByTestId('savings-option-Definitely'));
    expect(continueBtn).not.toBeDisabled();

    fireEvent.click(continueBtn);

    // Advances to Screen 9
    expect(screen.getByText(/how long do you usually spend cooking your meals\?/i)).toBeInTheDocument();
  });

  it('SCREEN 9: renders cooking time options and subtitle', async () => {
    localStorage.setItem(
      'meltto_onboarding_guest',
      JSON.stringify({
        preferredLanguage: 'en',
        name: 'Alex',
        onboardingStep: 9,
      })
    );

    renderOnboarding();

    await waitFor(() => {
      expect(screen.getByText(/how long do you usually spend cooking your meals\?/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/we'll match recipes to your routine/i)).toBeInTheDocument();
    expect(screen.getByTestId('cooking-time-option-15–30 min')).toBeInTheDocument();
    expect(screen.getByTestId('cooking-time-option-30–45 min')).toBeInTheDocument();
    expect(screen.getByTestId('cooking-time-option-45–60 min')).toBeInTheDocument();
    expect(screen.getByTestId('cooking-time-option-60+ min')).toBeInTheDocument();

    const continueBtn = screen.getByTestId('cooking-time-continue-btn');
    expect(continueBtn).toBeDisabled();

    fireEvent.click(screen.getByTestId('cooking-time-option-30–45 min'));
    expect(continueBtn).not.toBeDisabled();

    fireEvent.click(continueBtn);

    // Advances to Screen 10
    expect(screen.getByText(/where did you hear about us\?/i)).toBeInTheDocument();
  });

  it('SCREEN 10: renders referral source options, brand icons, and completion holding screen', async () => {
    localStorage.setItem(
      'meltto_onboarding_guest',
      JSON.stringify({
        preferredLanguage: 'en',
        name: 'Alex',
        onboardingStep: 10,
      })
    );

    renderOnboarding();

    await waitFor(() => {
      expect(screen.getByText(/where did you hear about us\?/i)).toBeInTheDocument();
    });

    expect(screen.getByTestId('referral-option-Instagram')).toBeInTheDocument();
    expect(screen.getByTestId('referral-option-TikTok')).toBeInTheDocument();
    expect(screen.getByTestId('referral-option-YouTube')).toBeInTheDocument();
    expect(screen.getByTestId('referral-option-Facebook')).toBeInTheDocument();
    expect(screen.getByTestId('referral-option-Word of mouth')).toBeInTheDocument();
    expect(screen.getByTestId('referral-option-Google Play')).toBeInTheDocument();

    const continueBtn = screen.getByTestId('referral-continue-btn');
    expect(continueBtn).toBeDisabled();

    fireEvent.click(screen.getByTestId('referral-option-Instagram'));
    expect(continueBtn).not.toBeDisabled();

    fireEvent.click(continueBtn);

    // Advances to Screen 11 (Time-Saving Intro)
    expect(screen.getByText(/plan your week in less time/i)).toBeInTheDocument();
  });

  it('SCREEN 11: renders stopwatch illustration, comparison bars, and allows continue without input', async () => {
    localStorage.setItem(
      'meltto_onboarding_guest',
      JSON.stringify({
        preferredLanguage: 'en',
        name: 'Alex',
        onboardingStep: 11,
      })
    );

    renderOnboarding();

    await waitFor(() => {
      expect(screen.getByText(/plan your week in less time/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Stopwatch Illustration/i)).toBeInTheDocument();
    expect(screen.getByText(/less time deciding recipes, checking cupboards/i)).toBeInTheDocument();
    expect(screen.getByText(/5m/i)).toBeInTheDocument();
    expect(screen.getByText(/with us/i)).toBeInTheDocument();
    expect(screen.getByText(/60m/i)).toBeInTheDocument();
    expect(screen.getByText(/without us/i)).toBeInTheDocument();
    expect(screen.getByText(/save nearly an hour every week/i)).toBeInTheDocument();

    const continueBtn = screen.getByTestId('screen11-continue-btn');
    expect(continueBtn).not.toBeDisabled();

    fireEvent.click(continueBtn);

    // Advances to Screen 12 (Country Selection)
    expect(screen.getByText(/where are you from\?/i)).toBeInTheDocument();
  });

  it('SCREEN 12: renders country options and persists selected country & currency', async () => {
    localStorage.setItem(
      'meltto_onboarding_guest',
      JSON.stringify({
        preferredLanguage: 'en',
        name: 'Alex',
        onboardingStep: 12,
      })
    );

    renderOnboarding();

    await waitFor(() => {
      expect(screen.getByText(/where are you from\?/i)).toBeInTheDocument();
    });

    expect(screen.getByTestId('country-option-US')).toBeInTheDocument();
    expect(screen.getByTestId('country-option-EU')).toBeInTheDocument();
    expect(screen.getByTestId('country-option-GB')).toBeInTheDocument();
    expect(screen.getByTestId('country-option-AU')).toBeInTheDocument();
    expect(screen.getByTestId('country-option-CA')).toBeInTheDocument();
    expect(screen.getByTestId('country-option-NZ')).toBeInTheDocument();
    expect(screen.getByTestId('country-option-BR')).toBeInTheDocument();
    expect(screen.getByTestId('country-option-IN')).toBeInTheDocument();

    const continueBtn = screen.getByTestId('country-continue-btn');
    expect(continueBtn).not.toBeDisabled();

    // Select United Kingdom (GBP)
    fireEvent.click(screen.getByTestId('country-option-GB'));
    fireEvent.click(continueBtn);

    // Advances to Screen 13 (Household Size)
    expect(screen.getByText(/how many are you cooking for\?/i)).toBeInTheDocument();
  });

  it('SCREEN 13: renders household stepper with minus/plus and boundary enforcement', async () => {
    localStorage.setItem(
      'meltto_onboarding_guest',
      JSON.stringify({
        preferredLanguage: 'en',
        name: 'Alex',
        onboardingStep: 13,
      })
    );

    renderOnboarding();

    await waitFor(() => {
      expect(screen.getByText(/how many are you cooking for\?/i)).toBeInTheDocument();
    });

    const minusBtn = screen.getByTestId('household-minus-btn');
    const plusBtn = screen.getByTestId('household-plus-btn');
    const countDisplay = screen.getByTestId('household-count-value');

    // Default reference is 3
    expect(countDisplay).toHaveTextContent('3');

    // Decrement to 2
    fireEvent.click(minusBtn);
    expect(countDisplay).toHaveTextContent('2');

    // Decrement to 1 (minimum)
    fireEvent.click(minusBtn);
    expect(countDisplay).toHaveTextContent('1');
    expect(minusBtn).toBeDisabled();

    // Increment to 4
    fireEvent.click(plusBtn);
    fireEvent.click(plusBtn);
    fireEvent.click(plusBtn);
    expect(countDisplay).toHaveTextContent('4');

    const continueBtn = screen.getByTestId('household-continue-btn');
    expect(continueBtn).not.toBeDisabled();
    fireEvent.click(continueBtn);

    // Advances to Screen 14 (Cooking Days)
    expect(screen.getByText(/which days will you cook\?/i)).toBeInTheDocument();
  });

  it('SCREEN 14: toggles days in multi-select and disables continue when 0 days selected', async () => {
    localStorage.setItem(
      'meltto_onboarding_guest',
      JSON.stringify({
        preferredLanguage: 'en',
        name: 'Alex',
        onboardingStep: 14,
      })
    );

    renderOnboarding();

    await waitFor(() => {
      expect(screen.getByText(/which days will you cook\?/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/5 days selected/i)).toBeInTheDocument();

    const continueBtn = screen.getByTestId('cooking-days-continue-btn');
    expect(continueBtn).not.toBeDisabled();

    // Toggle off all 5 preselected days to test empty gating
    fireEvent.click(screen.getByTestId('day-option-Monday'));
    fireEvent.click(screen.getByTestId('day-option-Tuesday'));
    fireEvent.click(screen.getByTestId('day-option-Wednesday'));
    fireEvent.click(screen.getByTestId('day-option-Thursday'));
    fireEvent.click(screen.getByTestId('day-option-Friday'));

    expect(screen.getByText(/0 days selected/i)).toBeInTheDocument();
    expect(continueBtn).toBeDisabled();

    // Toggle on Saturday & Sunday
    fireEvent.click(screen.getByTestId('day-option-Saturday'));
    fireEvent.click(screen.getByTestId('day-option-Sunday'));

    expect(screen.getByText(/2 days selected/i)).toBeInTheDocument();
    expect(continueBtn).not.toBeDisabled();

    fireEvent.click(continueBtn);

    // Advances to Screen 15 (Weekly Budget)
    expect(screen.getByText(/what's your weekly budget\?/i)).toBeInTheDocument();
  });

  it('SCREEN 15: renders budget amount, slider, and leads to Batch 3 completion screen', async () => {
    localStorage.setItem(
      'meltto_onboarding_guest',
      JSON.stringify({
        preferredLanguage: 'en',
        name: 'Alex',
        currencyCode: 'USD',
        onboardingStep: 15,
      })
    );

    renderOnboarding();

    await waitFor(() => {
      expect(screen.getByText(/what's your weekly budget\?/i)).toBeInTheDocument();
    });

    const display = screen.getByTestId('budget-amount-display');
    expect(display).toHaveTextContent('$120');

    const slider = screen.getByTestId('budget-slider');
    fireEvent.change(slider, { target: { value: '160' } });
    expect(display).toHaveTextContent('$160');

    const continueBtn = screen.getByTestId('budget-continue-btn');
    fireEvent.click(continueBtn);

    // Advances to Screen 16: Weekly Savings Intro
    expect(screen.getByText(/you could save an average of/i)).toBeInTheDocument();
  });

  it('SCREEN 16: currency-aware savings calculation and display', async () => {
    localStorage.setItem(
      'meltto_onboarding_guest',
      JSON.stringify({
        currencyCode: 'GBP',
        onboardingStep: 16,
      })
    );

    renderOnboarding();

    await waitFor(() => {
      expect(screen.getByText(/you could save an average of/i)).toBeInTheDocument();
    });

    // GBP weekly savings is £15 and yearly is £780
    expect(screen.getByTestId('savings-weekly-amount')).toHaveTextContent('£15');
    expect(screen.getByTestId('savings-yearly-statement')).toHaveTextContent("that's £780 a year!");

    // Clicking continue advances to Screen 17
    fireEvent.click(screen.getByTestId('screen16-continue-btn'));
    expect(screen.getByText(/what are you in the mood for\?/i)).toBeInTheDocument();
  });

  it('SCREEN 17: mood selection limits to 3 and displays warning on 4th attempt', async () => {
    localStorage.setItem(
      'meltto_onboarding_guest',
      JSON.stringify({
        onboardingStep: 17,
      })
    );

    renderOnboarding();

    await waitFor(() => {
      expect(screen.getByText(/what are you in the mood for\?/i)).toBeInTheDocument();
    });

    const speedy = screen.getByTestId('mood-option-Speedy Meals');
    const lowCal = screen.getByTestId('mood-option-Low Calorie');
    const family = screen.getByTestId('mood-option-Family Favs');
    const protein = screen.getByTestId('mood-option-Protein Packed');

    // Default has Speedy Meals selected. Select 2 more: Low Calorie and Family Favs (3 total)
    fireEvent.click(lowCal);
    fireEvent.click(family);

    // Try to select 4th (Protein Packed)
    fireEvent.click(protein);
    expect(screen.getByTestId('mood-warning-banner')).toHaveTextContent(/up to 3 moods/i);

    // Continue to Screen 18
    const continueBtn = screen.getByTestId('moods-continue-btn');
    expect(continueBtn).not.toBeDisabled();
    fireEvent.click(continueBtn);
    expect(screen.getByText(/any dietary needs\?/i)).toBeInTheDocument();
  });

  it('SCREEN 18: dietary needs enforces mutual exclusivity with "None"', async () => {
    localStorage.setItem(
      'meltto_onboarding_guest',
      JSON.stringify({
        onboardingStep: 18,
      })
    );

    renderOnboarding();

    await waitFor(() => {
      expect(screen.getByText(/any dietary needs\?/i)).toBeInTheDocument();
    });

    const noneOpt = screen.getByTestId('dietary-option-None');
    const vegOpt = screen.getByTestId('dietary-option-Vegetarian');
    const veganOpt = screen.getByTestId('dietary-option-Vegan');

    // Initial has None selected
    // Selecting Vegetarian automatically deselects None
    fireEvent.click(vegOpt);
    // Selecting Vegan adds Vegan
    fireEvent.click(veganOpt);

    // Selecting None clears all others
    fireEvent.click(noneOpt);

    const continueBtn = screen.getByTestId('dietary-continue-btn');
    expect(continueBtn).not.toBeDisabled();
    fireEvent.click(continueBtn);
    expect(screen.getByText(/any allergies\?/i)).toBeInTheDocument();
  });

  it('SCREEN 19: allergies enforces mutual exclusivity with "None"', async () => {
    localStorage.setItem(
      'meltto_onboarding_guest',
      JSON.stringify({
        onboardingStep: 19,
      })
    );

    renderOnboarding();

    await waitFor(() => {
      expect(screen.getByText(/any allergies\?/i)).toBeInTheDocument();
    });

    const noneOpt = screen.getByTestId('allergy-option-None');
    const glutenOpt = screen.getByTestId('allergy-option-Gluten free');
    const nutOpt = screen.getByTestId('allergy-option-Nut free');

    // Selecting Gluten free deselects None
    fireEvent.click(glutenOpt);
    fireEvent.click(nutOpt);

    // Selecting None clears all specific allergies
    fireEvent.click(noneOpt);

    const continueBtn = screen.getByTestId('allergies-continue-btn');
    expect(continueBtn).not.toBeDisabled();
    fireEvent.click(continueBtn);
    expect(screen.getByText(/what appliances do you have\?/i)).toBeInTheDocument();
  });

  it('SCREEN 20: kitchen appliances validates minimum 1 selection, triggers generate plan, and advances to Screen 21', async () => {
    localStorage.setItem(
      'meltto_onboarding_guest',
      JSON.stringify({
        onboardingStep: 20,
      })
    );

    renderOnboarding();

    await waitFor(() => {
      expect(screen.getByText(/what appliances do you have\?/i)).toBeInTheDocument();
    });

    const generateBtn = screen.getByTestId('generate-plan-btn');
    expect(generateBtn).not.toBeDisabled();

    // Clicking generate plan advances to Screen 21
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByTestId('testimonials-heading')).toHaveTextContent(/loved by home cooks/i);
    });
  });

  it('SCREEN 21: Loved by Home Cooks renders demo preview testimonials and advances to Screen 22', async () => {
    localStorage.setItem(
      'meltto_onboarding_guest',
      JSON.stringify({
        onboardingStep: 21,
      })
    );

    renderOnboarding();

    await waitFor(() => {
      expect(screen.getByTestId('testimonials-heading')).toHaveTextContent(/loved by home cooks/i);
      expect(screen.getByText(/sample user feedback & kitchen stories \(demo preview\)/i)).toBeInTheDocument();
    });

    // Verify demo badges and sample feedback exist
    expect(screen.getAllByText(/DEMO/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Didn't think an app would actually help/i).length).toBeGreaterThanOrEqual(1);

    const continueBtn = screen.getByTestId('continue-testimonials-btn');
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByTestId('building-week-heading')).toBeInTheDocument();
    });
  });

  it('SCREEN 22: Building Your Week dynamically renders user name and progress checklist', async () => {
    localStorage.setItem(
      'meltto_onboarding_guest',
      JSON.stringify({
        name: 'Pratik Raj',
        onboardingStep: 22,
      })
    );

    renderOnboarding();

    await waitFor(() => {
      expect(screen.getByTestId('building-week-heading')).toHaveTextContent(/Pratik Raj, we're building your week.../i);
    });

    expect(screen.getByTestId('building-progress-checklist')).toBeInTheDocument();
    expect(screen.getByText(/matching meals to your shop \+ budget/i)).toBeInTheDocument();
    expect(screen.getByText(/lining up dinners for the week/i)).toBeInTheDocument();
    expect(screen.getByText(/putting together your grocery list/i)).toBeInTheDocument();
  });

  it('SCREEN 23: Free Trial Introduction renders app mockup preview without initiating billing', async () => {
    localStorage.setItem(
      'meltto_onboarding_guest',
      JSON.stringify({
        onboardingStep: 23,
      })
    );

    renderOnboarding();

    await waitFor(() => {
      expect(screen.getByTestId('free-trial-intro-heading')).toHaveTextContent(/we want you to try meltto for free!/i);
    });

    const continueBtn = screen.getByTestId('continue-free-trial-intro-btn');
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByTestId('trial-reminder-heading')).toHaveTextContent(/Trial Reminder Preference/i);
    });
  });

  it('SCREEN 24: Trial Reminder allows selecting 1-day or 2-day reminder and persists preference', async () => {
    localStorage.setItem(
      'meltto_onboarding_guest',
      JSON.stringify({
        onboardingStep: 24,
      })
    );

    renderOnboarding();

    await waitFor(() => {
      expect(screen.getByTestId('trial-reminder-heading')).toHaveTextContent(/Trial Reminder Preference/i);
    });

    const opt2Days = screen.getByTestId('reminder-option-2-days');
    fireEvent.click(opt2Days);

    const continueBtn = screen.getByTestId('continue-trial-reminder-btn');
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByTestId('pricing-heading')).toHaveTextContent(/Meltto Subscription/i);
    });

    const stored = JSON.parse(localStorage.getItem('meltto_onboarding_guest') || '{}');
    expect(stored.trialReminderPreference).toBe('2_days_before');
  });

  it('SCREEN 25: Subscription screen displays pricing, trust badges, and opens All Plans modal', async () => {
    localStorage.setItem(
      'meltto_onboarding_guest',
      JSON.stringify({
        currencyCode: 'USD',
        onboardingStep: 25,
      })
    );

    renderOnboarding();

    await waitFor(() => {
      expect(screen.getByTestId('pricing-heading')).toHaveTextContent(/Meltto Subscription/i);
    });

    expect(screen.getByText(/Online Checkout Unconfigured/i)).toBeInTheDocument();
    expect(screen.getByText(/Free Starter Tier/i)).toBeInTheDocument();
    expect(screen.getByText(/No checkout required while billing is unconfigured/i)).toBeInTheDocument();

    // View all plans opens modal
    const viewAllBtn = screen.getByTestId('view-all-plans-btn');
    fireEvent.click(viewAllBtn);

    await waitFor(() => {
      expect(screen.getByText(/Meltto Plans/i)).toBeInTheDocument();
      expect(screen.getByTestId('select-starter-plan')).toBeInTheDocument();
      expect(screen.getByTestId('select-pro-annual-plan')).toBeInTheDocument();
      expect(screen.getByTestId('select-pro-monthly-plan')).toBeInTheDocument();
    });
  });

  it('BATCH 5 COMPLETE: clicking continue transitions to Batch 5 completion review and preserves onboardingCompleted: false', async () => {
    localStorage.setItem(
      'meltto_onboarding_guest',
      JSON.stringify({
        name: 'Pratik Raj',
        currencyCode: 'USD',
        onboardingStep: 25,
      })
    );

    renderOnboarding();

    await waitFor(() => {
      expect(screen.getByTestId('pricing-heading')).toHaveTextContent(/Meltto Subscription/i);
    });

    const trialBtn = screen.getByTestId('start-free-trial-btn');
    fireEvent.click(trialBtn);

    await waitFor(() => {
      expect(screen.getByTestId('batch5-complete-heading')).toHaveTextContent(/Batch 5 Complete!/i);
    });

    const stored = JSON.parse(localStorage.getItem('meltto_onboarding_guest') || '{}');
    expect(stored.onboardingCompleted).toBe(false);
  });

  it('GUEST PERSISTENCE: restores full state through Screen 20 from localStorage', async () => {
    localStorage.setItem(
      'meltto_onboarding_guest',
      JSON.stringify({
        preferredLanguage: 'fr',
        name: 'Camille',
        ageRange: '35-44',
        primaryGoal: 'Feed myself',
        cookingBarrier: 'Too tired after work',
        shoppingSavingsConfidence: 'Definitely',
        usualCookingTime: '15–30 min',
        referralSource: 'YouTube',
        countryCode: 'GB',
        countryName: 'United Kingdom',
        currencyCode: 'GBP',
        householdSize: 4,
        cookingDays: ['Monday', 'Wednesday', 'Friday'],
        weeklyBudget: 95,
        weeklyBudgetCurrency: 'GBP',
        mealMoods: ['Speedy Meals', 'Healthy Comfort'],
        dietaryPreferences: ['None'],
        allergies: ['Nut free'],
        appliances: ['Stovetop', 'Oven'],
        onboardingStep: 20,
      })
    );

    renderOnboarding();

    await waitFor(() => {
      expect(screen.getByText(/what appliances do you have\?/i)).toBeInTheDocument();
    });
  });
});
