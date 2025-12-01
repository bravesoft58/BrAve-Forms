import messyPaperwork from '@assets/generated_images/messy_construction_paperwork.png';
import { XCircle } from 'lucide-react';

export function Problem() {
  return (
    <section className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 relative">
            <img
              src={messyPaperwork}
              alt="Messy construction paperwork"
              className="rounded-xl shadow-xl w-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
            />
            <div className="absolute inset-0 bg-red-900/10 pointer-events-none rounded-xl mix-blend-multiply"></div>
          </div>

          <div className="order-1 lg:order-2 space-y-8">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-secondary">
              You&apos;re Wasting{' '}
              <span className="text-destructive decoration-4 underline decoration-destructive/20">
                2-3 Hours
              </span>{' '}
              Every Day.
            </h2>

            <p className="text-lg text-muted-foreground">
              Paper forms get lost in the mud. Spreadsheets are full of errors. And when the rain
              starts, compliance deadlines get missed. It&apos;s costing you money and sanity.
            </p>

            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <XCircle className="h-6 w-6 text-destructive shrink-0 mt-1" />
                <div>
                  <strong className="block text-secondary">Lost Documentation</strong>
                  <span className="text-muted-foreground">
                    Forms vanish in trucks, get soaked in rain, or buried in the office.
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="h-6 w-6 text-destructive shrink-0 mt-1" />
                <div>
                  <strong className="block text-secondary">Disconnected Photos</strong>
                  <span className="text-muted-foreground">
                    Photos are stuck in your camera roll, not attached to your reports.
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="h-6 w-6 text-destructive shrink-0 mt-1" />
                <div>
                  <strong className="block text-secondary">$177.5B Annual Loss</strong>
                  <span className="text-muted-foreground">
                    That&apos;s how much the industry loses to administrative inefficiencies.
                    Don&apos;t contribute to it.
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
