import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import heroImage from '@assets/generated_images/construction_foreman_using_phone_on_site.png';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background pt-16 pb-24 lg:pt-32 lg:pb-40">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium bg-muted/50 text-secondary">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
              New: Auto-Weather Compliance for EPA/SWPPP
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold tracking-tight text-secondary leading-[0.9]">
              Replace <span className="text-primary">3 Hours</span> of Paperwork with{' '}
              <span className="text-primary">30 Mins</span> of Mobile Forms.
            </h1>

            <p className="text-xl text-muted-foreground max-w-[600px]">
              Construction forms management built for the field. Works offline, auto-attaches
              photos, and includes EPA/OSHA compliance automation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-bold text-lg h-14 px-8 uppercase tracking-wide shadow-lg shadow-primary/20 cursor-default"
              >
                Coming Soon!
              </Button>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground font-medium pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Works Offline</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>50+ Templates</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>GPS Photos</span>
              </div>
            </div>
          </div>

          <div className="relative mx-auto lg:ml-auto w-full max-w-[600px]">
            {/* Stylized Image Container */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-8 border-white rotate-2 transform hover:rotate-0 transition-transform duration-500">
              <div className="absolute inset-0 bg-gradient-to-tr from-secondary/20 to-transparent pointer-events-none z-10"></div>
              <img
                src={heroImage}
                alt="Foreman using BrAve Forms on site"
                className="w-full h-auto object-cover aspect-[4/3]"
              />
            </div>

            {/* Floating UI Element */}
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-lg shadow-xl border border-border max-w-xs z-20 animate-in slide-in-from-bottom-4 fade-in duration-1000 delay-500">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-secondary">Daily Log Submitted</p>
                  <p className="text-xs text-muted-foreground">Just now • Job Site #42</p>
                </div>
              </div>
              <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
