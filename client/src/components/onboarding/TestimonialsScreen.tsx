import React from 'react';
import { PrimaryButton } from './PrimaryButton.js';

interface TestimonialCardData {
  name: string;
  headline: string;
  text: string;
}

const ROW_1: TestimonialCardData[] = [
  {
    name: 'Sarah',
    headline: "Didn't think an app would actually help",
    text: "Six weeks in and we're still using it. Shop bill's down about £25 a week. Husband sends me the list now so I'm not wandering Aldi.",
  },
  {
    name: 'James',
    headline: 'Normal food not chef food',
    text: "Everything's doable after work which is basically my only requirement. No random ingredients my kids refuse to touch.",
  },
  {
    name: 'Emma',
    headline: 'The list is the best part',
    text: 'Pick your shop, get the plan, text the list to my partner. No more buying the same ingredients twice.',
  },
];

const ROW_2: TestimonialCardData[] = [
  {
    name: 'Muhammad',
    headline: 'Cancelled HelloFresh for this',
    text: 'Does the planning bit without tiny portions and a massive bill. Same convenience, way less money.',
  },
  {
    name: 'Jen',
    headline: 'Husband cooks now somehow',
    text: 'Steps are clear enough that he stopped defaulting to takeout twice a week. Did not see that coming!',
  },
  {
    name: 'David',
    headline: 'Organised week without the faff',
    text: 'Our entire week sorted without feeling like a project. Takes 5 minutes on Sunday afternoon.',
  },
];

const ROW_3: TestimonialCardData[] = [
  {
    name: 'Marcus',
    headline: 'Feeding three on a budget',
    text: "Recipes aren't fancy but they fill everyone up. We're spending less and wasting way less food.",
  },
  {
    name: 'Hannah',
    headline: 'Quick dinners that work',
    text: "Most things take under 30 mins after work. That's why we stick with it every single week!",
  },
  {
    name: 'Alex',
    headline: 'Grocery spend definitely down',
    text: 'Did not think I needed another app, but we save around £30 every single shop now.',
  },
];

interface TestimonialsScreenProps {
  onContinue: () => void;
}

const Card: React.FC<{ item: TestimonialCardData }> = ({ item }) => (
  <div className="w-[260px] sm:w-[280px] bg-white rounded-2xl p-4 border border-[#eaeae6] shadow-2xs shrink-0 text-left flex flex-col justify-between select-none">
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-sm text-[#1a1a1a]">{item.name}</span>
          <span className="text-[9px] bg-gray-100 text-[#8c8c88] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
            Demo
          </span>
        </div>
        <span className="text-[#f59e0b] text-xs font-bold tracking-widest" aria-label="5 stars">
          ★★★★★
        </span>
      </div>
      <h4 className="font-bold text-xs sm:text-sm text-[#1a1a1a] leading-snug mb-1">
        {item.headline}
      </h4>
      <p className="text-[11px] sm:text-xs text-[#6b6b6b] leading-relaxed line-clamp-2">
        {item.text}
      </p>
    </div>
  </div>
);

export const TestimonialsScreen: React.FC<TestimonialsScreenProps> = ({ onContinue }) => {
  return (
    <div className="flex-1 flex flex-col justify-between py-2 sm:py-4 animate-fadeIn">
      {/* Top Headings */}
      <div className="mb-4 text-left">
        <h1
          data-testid="testimonials-heading"
          className="text-3xl sm:text-4xl font-extrabold text-[#1a1a1a] tracking-tight leading-tight mb-1"
        >
          loved by home cooks
        </h1>
        <p className="text-sm sm:text-base text-[#8c8c88] font-medium">
          sample user feedback &amp; kitchen stories (demo preview)
        </p>
      </div>

      {/* Horizontally Moving Rows of Testimonial Cards */}
      <div className="my-auto py-2 space-y-3 overflow-hidden -mx-5 sm:-mx-6">
        {/* Row 1 — Moving Left */}
        <div className="overflow-hidden">
          <div className="animate-marquee-left flex gap-3 px-4">
            {[...ROW_1, ...ROW_1].map((item, idx) => (
              <Card key={`r1-${idx}`} item={item} />
            ))}
          </div>
        </div>

        {/* Row 2 — Moving Right */}
        <div className="overflow-hidden">
          <div className="animate-marquee-right flex gap-3 px-4">
            {[...ROW_2, ...ROW_2].map((item, idx) => (
              <Card key={`r2-${idx}`} item={item} />
            ))}
          </div>
        </div>

        {/* Row 3 — Moving Left */}
        <div className="overflow-hidden">
          <div className="animate-marquee-left flex gap-3 px-4">
            {[...ROW_3, ...ROW_3].map((item, idx) => (
              <Card key={`r3-${idx}`} item={item} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="pt-4">
        <PrimaryButton testId="continue-testimonials-btn" onClick={onContinue}>
          continue
        </PrimaryButton>
      </div>
    </div>
  );
};
