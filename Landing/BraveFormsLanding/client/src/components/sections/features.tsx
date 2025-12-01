import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, WifiOff, Camera, FileText, ShieldCheck, CloudRain } from 'lucide-react';

const features = [
  {
    icon: Clock,
    title: 'Save 70% Time',
    description:
      'Complete daily logs in 10 minutes, not 45. Save $37,500 annually per foreman in administrative time costs.',
  },
  {
    icon: WifiOff,
    title: 'Works Offline',
    description:
      'True offline-first architecture. Fill forms, capture photos, and get signatures without any signal for up to 30 days.',
  },
  {
    icon: Camera,
    title: 'GPS Photo Tagging',
    description:
      'Photos capture directly within forms. No more emailing yourself pictures or guessing where a photo was taken.',
  },
  {
    icon: FileText,
    title: '50+ Templates',
    description:
      'Start immediately with industry-standard templates for Daily Logs, Safety, Quality, and Equipment reports.',
  },
  {
    icon: ShieldCheck,
    title: 'Digital Signatures',
    description:
      'ESIGN Act compliant multi-signer workflows. Generate professional PDFs instantly.',
  },
  {
    icon: CloudRain,
    title: 'Weather Automation',
    description:
      'Automatic 0.25" rain alerts for EPA SWPPP inspections. Never miss a compliance deadline due to weather.',
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl font-heading font-bold text-secondary">
            Built for the Job Site, Not the Office
          </h2>
          <p className="text-lg text-muted-foreground">
            Features designed specifically for the realities of construction work. Rugged, reliable,
            and fast.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-2 border-transparent hover:border-primary/10 hover:shadow-lg transition-all duration-300 group"
            >
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-bold text-secondary">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
