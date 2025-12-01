import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useState } from 'react';
import { DollarSign } from 'lucide-react';

export function ROICalculator() {
  const [foremen, setForemen] = useState([5]);

  const savingsPerForeman = 37500;
  const totalSavings = foremen[0] * savingsPerForeman;
  const monthlyCost = foremen[0] * 39 * 12; // Annual cost
  const roi = Math.round((totalSavings / monthlyCost) * 100);

  return (
    <section className="py-24 bg-secondary text-white overflow-hidden relative">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      ></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-heading font-bold">Calculate Your Savings</h2>
            <p className="text-lg text-blue-200">
              See exactly how much wasted time is costing your business. Based on 2.5 hours of daily
              admin time saved per foreman.
            </p>

            <div className="space-y-6 bg-white/5 p-8 rounded-xl border border-white/10 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-lg">Number of Foremen</label>
                  <span className="text-3xl font-heading font-bold text-primary">{foremen[0]}</span>
                </div>
                <Slider
                  value={foremen}
                  onValueChange={setForemen}
                  max={50}
                  min={1}
                  step={1}
                  className="py-4"
                />
                <p className="text-sm text-blue-300">
                  Drag the slider to adjust based on your team size.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white text-secondary p-8 md:p-12 rounded-2xl shadow-2xl space-y-8">
            <div className="text-center space-y-2">
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Projected Annual Savings
              </p>
              <div className="text-6xl md:text-7xl font-heading font-bold text-primary flex items-center justify-center gap-2">
                <DollarSign className="h-10 w-10 md:h-14 md:w-14 mt-2" strokeWidth={3} />
                {totalSavings.toLocaleString()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 border-t border-border pt-8">
              <div className="text-center">
                <p className="text-3xl font-bold mb-1 text-secondary">{roi}%</p>
                <p className="text-sm text-muted-foreground font-medium">ROI</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold mb-1 text-secondary">4 Days</p>
                <p className="text-sm text-muted-foreground font-medium">Payback Period</p>
              </div>
            </div>

            <Button className="w-full h-14 text-lg font-bold uppercase bg-secondary hover:bg-secondary/90 text-white">
              Start Saving Today
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
