import { Navbar } from '@/components/layout/navbar';
import { Hero } from '@/components/sections/hero';
import { Problem } from '@/components/sections/problem';
import { Features } from '@/components/sections/features';
import { HowItWorks } from '@/components/sections/how-it-works';
import { ROICalculator } from '@/components/sections/roi-calculator';
import { Pricing } from '@/components/sections/pricing';
import { FAQ } from '@/components/sections/faq';
import { Footer } from '@/components/layout/footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Features />
        <HowItWorks />
        <ROICalculator />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
