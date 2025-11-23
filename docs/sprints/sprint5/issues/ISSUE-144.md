# ISSUE-144: Help & Documentation Page (2h)

**Priority:** P2
**Phase:** Phase 3 - Settings & Profile
**Estimated Hours:** 2
**Dependencies:** None
**Sprint:** Sprint 5

---

## Objective

Create a help and documentation page with searchable FAQs, video tutorials, EPA/OSHA compliance guides, and contact support for field workers.

## Tasks

- [ ] Create /help route in Next.js App Router
- [ ] Create searchable FAQ component
- [ ] Create video tutorials section (embedded YouTube/Vimeo)
- [ ] Create compliance guides section (EPA CGP, OSHA regulations)
- [ ] Create quick reference guides (downloadable PDFs)
- [ ] Create contact support form
- [ ] Implement full-text search for help content
- [ ] Add unit tests for search logic

## Technical Details

**Libraries/Dependencies:**

- Mantine components (Accordion, TextInput, Tabs)
- Fuse.js (client-side fuzzy search)
- React Hook Form + Zod (contact form)

**Code Example:**

```typescript
'use client';

import { useState } from 'react';
import { TextInput, Accordion, Tabs, Stack, Text, Button, Anchor, Card } from '@mantine/core';
import { IconSearch, IconBook, IconVideo, IconFileText, IconMail } from '@tabler/icons-react';
import Fuse from 'fuse.js';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'forms' | 'compliance' | 'offline' | 'photos' | 'general';
}

const faqs: FAQ[] = [
  {
    id: '1',
    question: 'How do I work offline for 30 days?',
    answer: 'BrAve Forms automatically stores all data locally using IndexedDB. You can continue filling forms, uploading photos, and marking inspections complete without internet for up to 30 days. When you reconnect, everything syncs automatically.',
    category: 'offline',
  },
  {
    id: '2',
    question: 'What is the 0.25 inch rain rule?',
    answer: 'EPA CGP requires construction sites to conduct inspections within 24 hours (during working hours) after any storm event producing 0.25 inches or more of rain within 24 hours. BrAve Forms monitors weather automatically and alerts you when inspections are due.',
    category: 'compliance',
  },
  {
    id: '3',
    question: 'How do I add GPS location to photos?',
    answer: 'When taking photos with the BrAve Forms mobile app, GPS coordinates are automatically embedded in the photo EXIF data. You can view photo locations on the map in the Photos tab.',
    category: 'photos',
  },
  // ... 20+ more FAQs
];

const tutorials = [
  {
    id: '1',
    title: 'Getting Started with BrAve Forms',
    duration: '5:30',
    videoUrl: 'https://www.youtube.com/embed/...',
    category: 'general',
  },
  {
    id: '2',
    title: 'EPA Compliance Inspections Walkthrough',
    duration: '8:15',
    videoUrl: 'https://www.youtube.com/embed/...',
    category: 'compliance',
  },
  // ... more tutorials
];

const complianceGuides = [
  {
    id: '1',
    title: 'EPA CGP 2022 Summary',
    description: '0.25" rain rule, inspection requirements, SWPPP updates',
    pdfUrl: '/guides/epa-cgp-2022-summary.pdf',
  },
  {
    id: '2',
    title: 'OSHA Safety Inspection Checklist',
    description: 'Daily safety inspection requirements for construction sites',
    pdfUrl: '/guides/osha-safety-checklist.pdf',
  },
  // ... more guides
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Fuzzy search FAQs
  const fuse = new Fuse(faqs, {
    keys: ['question', 'answer'],
    threshold: 0.4,
  });

  const filteredFAQs = searchQuery
    ? fuse.search(searchQuery).map(result => result.item)
    : faqs;

  return (
    <Stack>
      <Text size="xl" fw={600}>Help & Documentation</Text>

      <TextInput
        placeholder="Search help articles..."
        leftSection={<IconSearch size={16} />}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        size="md"
      />

      <Tabs defaultValue="faq">
        <Tabs.List>
          <Tabs.Tab value="faq" leftSection={<IconBook size={16} />}>
            FAQs
          </Tabs.Tab>
          <Tabs.Tab value="tutorials" leftSection={<IconVideo size={16} />}>
            Video Tutorials
          </Tabs.Tab>
          <Tabs.Tab value="guides" leftSection={<IconFileText size={16} />}>
            Compliance Guides
          </Tabs.Tab>
          <Tabs.Tab value="contact" leftSection={<IconMail size={16} />}>
            Contact Support
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="faq" pt="md">
          <Accordion variant="separated">
            {filteredFAQs.map(faq => (
              <Accordion.Item key={faq.id} value={faq.id}>
                <Accordion.Control>{faq.question}</Accordion.Control>
                <Accordion.Panel>
                  <Text size="sm">{faq.answer}</Text>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>

          {filteredFAQs.length === 0 && (
            <Text c="dimmed" ta="center" py="xl">
              No results found for "{searchQuery}"
            </Text>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="tutorials" pt="md">
          <Stack gap="md">
            {tutorials.map(tutorial => (
              <Card key={tutorial.id} withBorder>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text fw={500}>{tutorial.title}</Text>
                    <Text size="sm" c="dimmed">{tutorial.duration}</Text>
                  </Group>
                  <iframe
                    width="100%"
                    height="315"
                    src={tutorial.videoUrl}
                    title={tutorial.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </Stack>
              </Card>
            ))}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="guides" pt="md">
          <Stack gap="md">
            {complianceGuides.map(guide => (
              <Card key={guide.id} withBorder padding="lg">
                <Group justify="space-between">
                  <div>
                    <Text fw={500}>{guide.title}</Text>
                    <Text size="sm" c="dimmed">{guide.description}</Text>
                  </div>
                  <Button
                    component="a"
                    href={guide.pdfUrl}
                    target="_blank"
                    variant="light"
                  >
                    Download PDF
                  </Button>
                </Group>
              </Card>
            ))}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="contact" pt="md">
          <ContactSupportForm />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

function ContactSupportForm() {
  const form = useForm({
    resolver: zodResolver(z.object({
      subject: z.string().min(5, 'Subject required'),
      message: z.string().min(20, 'Message must be at least 20 characters'),
    })),
  });

  const onSubmit = async (data) => {
    await fetch('/api/support/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Stack>
        <TextInput
          label="Subject"
          placeholder="What do you need help with?"
          {...form.register('subject')}
          error={form.formState.errors.subject?.message}
        />
        <Textarea
          label="Message"
          placeholder="Describe your issue in detail..."
          minRows={5}
          {...form.register('message')}
          error={form.formState.errors.message?.message}
        />
        <Button type="submit" loading={form.formState.isSubmitting}>
          Send Message
        </Button>
      </Stack>
    </form>
  );
}
```

## Acceptance Criteria

- [ ] /help route displays all help sections
- [ ] FAQ accordion searchable with fuzzy search
- [ ] Video tutorials embedded and playable
- [ ] Compliance guides downloadable as PDFs
- [ ] Contact support form functional
- [ ] Search returns relevant results
- [ ] Form validation errors display correctly
- [ ] Success notification on support request sent

## Testing Requirements

**Unit Tests:**

- Test FAQ search logic (Fuse.js)
- Test contact form validation
- Test category filtering

**Integration Tests:**

- Test contact support submission
- Test PDF download links
- Test video embed loading

**Manual Testing:**

- Search FAQs with various queries
- Watch video tutorials
- Download compliance guides
- Submit contact support request

## Evidence Requirements

- [ ] Screenshot: Help page with all tabs
- [ ] Screenshot: FAQ search results
- [ ] Screenshot: Video tutorials section
- [ ] Screenshot: Compliance guides download
- [ ] Screenshot: Contact support form
- [ ] Test Results: Help tests (>80% coverage)

## Success Criteria

Help & documentation page is complete when:

- All FAQs searchable and displayed
- Video tutorials playable
- Compliance guides downloadable
- Contact support form working
- All tests passing

---

**Created:** 2025-10-23
**Last Updated:** 2025-10-23
**Status:** READY FOR IMPLEMENTATION
