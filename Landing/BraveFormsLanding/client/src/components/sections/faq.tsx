import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function FAQ() {
  return (
    <section id="faq" className="py-24 bg-background">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl font-heading font-bold text-secondary">
            Frequently Asked Questions
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-lg font-semibold text-secondary">
              Does it really work offline?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Yes. BrAve Forms is built with a true offline-first architecture. You can create
              forms, take photos, and collect signatures without any internet connection. The app
              will automatically sync everything to the cloud once you&apos;re back in range. It
              works offline for up to 30 days.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger className="text-lg font-semibold text-secondary">
              Do I need to build forms from scratch?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              No. We include over 50 construction-specific templates (Daily Logs, Safety Toolbox
              Talks, Hot Work Permits, QA/QC, etc.) so you can start immediately. However, you can
              also use our drag-and-drop builder to create custom forms if you need to.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger className="text-lg font-semibold text-secondary">
              How is this different from Procore?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              BrAve Forms is focused specifically on field data collection and is significantly more
              affordable ($39/mo vs hundreds). While Procore is a full project management suite,
              many smaller GCs find it too complex and expensive just for handling daily logs and
              safety forms.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger className="text-lg font-semibold text-secondary">
              What happens to my data if I cancel?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Your data is yours. You can export all your forms and photos to PDF or Excel before
              you cancel. We never hold your data hostage.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}
