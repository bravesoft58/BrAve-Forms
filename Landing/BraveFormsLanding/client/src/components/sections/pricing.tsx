import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { config } from '@/lib/config';

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl font-heading font-bold text-secondary">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            No hidden fees. No long-term contracts. Cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Office User */}
          <div className="bg-background rounded-2xl p-8 border hover:shadow-xl transition-all duration-300">
            <h3 className="text-xl font-bold text-secondary mb-2">Office User</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-heading font-bold text-secondary">$19</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="text-muted-foreground text-sm mb-8">
              Perfect for project managers and admin staff.
            </p>
            <Button variant="outline" className="w-full mb-8 font-bold cursor-default">
              Coming Soon!
            </Button>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-2">
                <Check className="h-4 w-4 text-primary" /> Web Dashboard Access
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 text-primary" /> Report Generation
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 text-primary" /> User Management
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 text-primary" /> View-Only Forms
              </li>
            </ul>
          </div>

          {/* Field User (Popular) */}
          <div className="bg-secondary text-white rounded-2xl p-8 border-2 border-primary shadow-2xl relative transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Most Popular
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">Field User</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-heading font-bold text-white">$39</span>
              <span className="text-blue-200">/month</span>
            </div>
            <p className="text-blue-100 text-sm mb-8">
              Everything foremen need to get the job done.
            </p>
            <Button className="w-full mb-8 bg-primary hover:bg-primary/90 text-white font-bold border-none cursor-default">
              Coming Soon!
            </Button>
            <ul className="space-y-3 text-sm text-blue-50">
              <li className="flex gap-2">
                <Check className="h-4 w-4 text-primary" />{' '}
                <span className="font-bold">Unlimited</span> Forms
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 text-primary" />{' '}
                <span className="font-bold">Offline</span> Mode
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 text-primary" /> Photo Capture & GPS
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 text-primary" /> Digital Signatures
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 text-primary" /> EPA/OSHA Templates
              </li>
            </ul>
          </div>

          {/* Enterprise */}
          <div className="bg-background rounded-2xl p-8 border hover:shadow-xl transition-all duration-300">
            <h3 className="text-xl font-bold text-secondary mb-2">Enterprise</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-heading font-bold text-secondary">Custom</span>
            </div>
            <p className="text-muted-foreground text-sm mb-8">
              For large teams needing volume discounts.
            </p>
            <Button variant="outline" className="w-full mb-8 font-bold" asChild>
              <a href={`mailto:${config.contactEmail}`}>Contact Sales</a>
            </Button>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-2">
                <Check className="h-4 w-4 text-primary" /> Volume Discounts (11+ users)
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 text-primary" /> Custom Integrations
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 text-primary" /> Priority Support
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 text-primary" /> Dedicated Success Manager
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
