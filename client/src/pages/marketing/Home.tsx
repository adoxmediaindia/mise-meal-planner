import React from 'react';
import { Nav } from '../../components/marketing/Nav.js';
import { Hero } from '../../components/marketing/Hero.js';
import { SupermarketMarquee } from '../../components/marketing/SupermarketMarquee.js';
import { StatsSection } from '../../components/marketing/StatsSection.js';
import { HowItWorks } from '../../components/marketing/HowItWorks.js';
import { ShowcaseA } from '../../components/marketing/ShowcaseA.js';
import { ShowcaseB } from '../../components/marketing/ShowcaseB.js';
import { FeaturesGrid } from '../../components/marketing/FeaturesGrid.js';
import { MealVibesSection } from '../../components/marketing/MealVibesSection.js';
import { ScreenshotGallery } from '../../components/marketing/ScreenshotGallery.js';
import { ReviewsSection } from '../../components/marketing/ReviewsSection.js';
import { FaqSection } from '../../components/marketing/FaqSection.js';
import { CtaBanner } from '../../components/marketing/CtaBanner.js';
import { Footer } from '../../components/marketing/Footer.js';

export const Home: React.FC = () => {
  return (
    <>
      <Nav />
      <main id="top">
        <Hero />
        <SupermarketMarquee />
        <StatsSection />
        <HowItWorks />
        <ShowcaseA />
        <ShowcaseB />
        <FeaturesGrid />
        <MealVibesSection />
        <ScreenshotGallery />
        <ReviewsSection />
        <FaqSection />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
};
