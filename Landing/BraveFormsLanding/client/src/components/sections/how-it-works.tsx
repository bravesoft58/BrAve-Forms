import { ClipboardList, Smartphone, CloudOff } from 'lucide-react';

const steps = [
  {
    icon: ClipboardList,
    title: '1. Choose Template',
    description: 'Pick from 50+ pre-built construction forms or create your own in seconds.',
  },
  {
    icon: Smartphone,
    title: '2. Fill on Mobile',
    description: 'Complete forms on your phone or tablet. Works perfectly even without signal.',
  },
  {
    icon: CloudOff,
    title: '3. Auto-Sync & Report',
    description: 'Photos attach automatically with GPS data. Forms sync to the office instantly.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl font-heading font-bold text-secondary">How It Works</h2>
          <p className="text-lg text-muted-foreground">
            Simple enough for the oldest guy on the crew to use without complaining.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-secondary/10 -z-10"></div>

          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative flex flex-col items-center text-center bg-background md:bg-transparent p-6 rounded-xl shadow-sm md:shadow-none"
              >
                <div className="h-24 w-24 rounded-full bg-white border-4 border-primary flex items-center justify-center text-primary mb-6 shadow-lg z-10 relative">
                  <step.icon className="h-10 w-10" />
                  <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold border-2 border-white">
                    {index + 1}
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-secondary mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
