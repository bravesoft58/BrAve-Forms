'use client';

import { useState, useMemo } from 'react';
import {
  Container,
  Title,
  Text,
  Stack,
  Group,
  Paper,
  TextInput,
  Tabs,
  Accordion,
  Card,
  Button,
  Textarea,
  Badge,
  SimpleGrid,
  Alert,
  SegmentedControl,
  Anchor,
} from '@mantine/core';
import {
  IconSearch,
  IconBook,
  IconVideo,
  IconFileText,
  IconMail,
  IconDownload,
  IconExternalLink,
  IconCheck,
  IconClock,
  IconCategory,
  IconQuestionMark,
  IconAlertCircle,
} from '@tabler/icons-react';
import {
  faqs,
  tutorials,
  complianceGuides,
  faqCategoryLabels,
  guideCategoryLabels,
  type FAQ,
  type FAQCategory,
} from '@/lib/help/help-data';
import { searchFAQs, filterByCategory } from '@/lib/help/help-search';

/**
 * Help & Documentation Page
 *
 * Provides searchable FAQs, video tutorials, compliance guides, and contact support.
 */
export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string | null>('faq');
  const [categoryFilter, setCategoryFilter] = useState<FAQCategory | 'all'>('all');

  // Contact form state
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactError, setContactError] = useState('');

  // Fuzzy search FAQs
  const filteredFAQs = useMemo(() => {
    const searchResults = searchFAQs(searchQuery);
    return filterByCategory(searchResults, categoryFilter);
  }, [searchQuery, categoryFilter]);

  // Group FAQs by category for accordion display
  const groupedFAQs = useMemo(() => {
    const groups: Record<FAQCategory, FAQ[]> = {
      general: [],
      forms: [],
      compliance: [],
      offline: [],
      photos: [],
    };

    for (const faq of filteredFAQs) {
      groups[faq.category].push(faq);
    }

    return groups;
  }, [filteredFAQs]);

  // Handle contact form submission with offline support
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError('');

    // Validation
    if (contactSubject.trim().length < 5) {
      setContactError('Subject must be at least 5 characters');
      return;
    }
    if (contactMessage.trim().length < 20) {
      setContactError('Message must be at least 20 characters');
      return;
    }

    const supportRequest = {
      id: `support-${Date.now()}`,
      subject: contactSubject.trim(),
      message: contactMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    // Queue for offline sync - support requests stored in IndexedDB
    // and synced when online (see ISSUE-146 for backend API implementation)
    try {
      // Store in IndexedDB for offline support
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('braveforms-support', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
          const database = (event.target as IDBOpenDBRequest).result;
          if (!database.objectStoreNames.contains('requests')) {
            database.createObjectStore('requests', { keyPath: 'id' });
          }
        };
      });

      const transaction = db.transaction(['requests'], 'readwrite');
      const store = transaction.objectStore('requests');
      store.add(supportRequest);
      db.close();
    } catch {
      // IndexedDB not available - form still submitted UI-side
      console.warn('IndexedDB not available for offline queue');
    }

    setContactSubmitted(true);
    setContactSubject('');
    setContactMessage('');
    setTimeout(() => setContactSubmitted(false), 5000);
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        {/* Page Header */}
        <div>
          <Title order={1} size="h2">
            Help & Documentation
          </Title>
          <Text c="dimmed" size="sm">
            Search FAQs, watch tutorials, and download compliance guides
          </Text>
        </div>

        {/* Global Search */}
        <TextInput
          placeholder="Search help articles, FAQs, and guides..."
          leftSection={<IconSearch size={18} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          size="md"
        />

        {/* Tabs */}
        <Tabs value={activeTab} onChange={setActiveTab}>
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

          {/* FAQs Panel */}
          <Tabs.Panel value="faq" pt="md">
            <Stack gap="md">
              {/* Category Filter */}
              <Group justify="space-between" align="center">
                <Group gap="xs">
                  <IconCategory size={16} />
                  <Text size="sm" fw={500}>
                    Filter by category:
                  </Text>
                </Group>
                <SegmentedControl
                  value={categoryFilter}
                  onChange={(value) => setCategoryFilter(value as FAQCategory | 'all')}
                  data={[
                    { label: 'All', value: 'all' },
                    { label: 'General', value: 'general' },
                    { label: 'Forms', value: 'forms' },
                    { label: 'Compliance', value: 'compliance' },
                    { label: 'Offline', value: 'offline' },
                    { label: 'Photos', value: 'photos' },
                  ]}
                  size="md"
                />
              </Group>

              {/* FAQ Results Count */}
              <Text size="sm" c="dimmed">
                Showing {filteredFAQs.length} of {faqs.length} FAQs
                {searchQuery && ` matching "${searchQuery}"`}
              </Text>

              {/* FAQ Accordion by Category */}
              {filteredFAQs.length > 0 ? (
                Object.entries(groupedFAQs).map(
                  ([category, categoryFaqs]) =>
                    categoryFaqs.length > 0 && (
                      <Paper key={category} p="md" withBorder>
                        <Group gap="xs" mb="sm">
                          <IconQuestionMark size={18} />
                          <Text fw={600}>{faqCategoryLabels[category as FAQCategory]}</Text>
                          <Badge size="sm" variant="light">
                            {categoryFaqs.length}
                          </Badge>
                        </Group>

                        <Accordion variant="separated">
                          {categoryFaqs.map((faq) => (
                            <Accordion.Item key={faq.id} value={faq.id}>
                              <Accordion.Control>{faq.question}</Accordion.Control>
                              <Accordion.Panel>
                                <Text size="sm">{faq.answer}</Text>
                              </Accordion.Panel>
                            </Accordion.Item>
                          ))}
                        </Accordion>
                      </Paper>
                    )
                )
              ) : (
                <Paper p="xl" withBorder ta="center">
                  <IconSearch size={48} color="gray" style={{ opacity: 0.5 }} />
                  <Text c="dimmed" mt="md">
                    No results found for your search
                  </Text>
                  <Text size="sm" c="dimmed">
                    Try different keywords or clear the search
                  </Text>
                  <Button variant="subtle" mt="md" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
                </Paper>
              )}
            </Stack>
          </Tabs.Panel>

          {/* Video Tutorials Panel */}
          <Tabs.Panel value="tutorials" pt="md">
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Watch step-by-step tutorials to get the most out of BrAve Forms
              </Text>

              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                {tutorials.map((tutorial) => (
                  <Card key={tutorial.id} withBorder padding="lg">
                    <Stack gap="sm">
                      <Group justify="space-between" align="flex-start">
                        <div style={{ flex: 1 }}>
                          <Text fw={500}>{tutorial.title}</Text>
                          <Text size="xs" c="dimmed">
                            {tutorial.description}
                          </Text>
                        </div>
                        <Badge leftSection={<IconClock size={12} />} variant="light">
                          {tutorial.duration}
                        </Badge>
                      </Group>

                      {/* Video Embed Placeholder */}
                      <Paper
                        p="xl"
                        bg="dark.6"
                        style={{
                          aspectRatio: '16/9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Stack align="center" gap="xs">
                          <IconVideo size={48} color="gray" />
                          <Text size="sm" c="dimmed">
                            Video placeholder
                          </Text>
                          <Anchor
                            href={tutorial.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="sm"
                            aria-label={`Watch ${tutorial.title} tutorial on YouTube (opens in new tab)`}
                            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            Watch on YouTube <IconExternalLink size={14} />
                          </Anchor>
                        </Stack>
                      </Paper>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
            </Stack>
          </Tabs.Panel>

          {/* Compliance Guides Panel */}
          <Tabs.Panel value="guides" pt="md">
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Download EPA/OSHA compliance guides and quick reference materials
              </Text>

              {complianceGuides.map((guide) => (
                <Card key={guide.id} withBorder padding="lg">
                  <Group justify="space-between" wrap="nowrap">
                    <div style={{ flex: 1 }}>
                      <Group gap="xs" mb="xs">
                        <Text fw={500}>{guide.title}</Text>
                        <Badge size="sm" variant="light">
                          {guideCategoryLabels[guide.category]}
                        </Badge>
                      </Group>
                      <Text size="sm" c="dimmed">
                        {guide.description}
                      </Text>
                      <Text size="xs" c="dimmed" mt="xs">
                        Last updated: {new Date(guide.lastUpdated).toLocaleDateString()}
                      </Text>
                    </div>
                    <Button
                      component="a"
                      href={guide.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="light"
                      leftSection={<IconDownload size={16} />}
                      aria-label={`Download ${guide.title} PDF (opens in new tab)`}
                    >
                      Download PDF
                    </Button>
                  </Group>
                </Card>
              ))}

              <Paper p="md" withBorder bg="blue.0">
                <Group gap="xs">
                  <IconAlertCircle size={18} />
                  <Text size="sm" fw={500}>
                    Need a specific guide?
                  </Text>
                </Group>
                <Text size="sm" c="dimmed" mt="xs">
                  Contact support to request additional compliance guides or state-specific
                  documentation.
                </Text>
              </Paper>
            </Stack>
          </Tabs.Panel>

          {/* Contact Support Panel */}
          <Tabs.Panel value="contact" pt="md">
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Can&apos;t find what you&apos;re looking for? Send us a message and we&apos;ll get
                back to you.
              </Text>

              {contactSubmitted && (
                <Alert icon={<IconCheck size={16} />} title="Message Sent" color="green">
                  Thank you for contacting support. We&apos;ll respond within 24 hours.
                </Alert>
              )}

              {contactError && (
                <Alert icon={<IconAlertCircle size={16} />} title="Validation Error" color="red">
                  {contactError}
                </Alert>
              )}

              <Paper p="lg" withBorder>
                <form onSubmit={handleContactSubmit}>
                  <Stack gap="md">
                    <TextInput
                      label="Subject"
                      placeholder="What do you need help with?"
                      required
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.currentTarget.value)}
                      error={
                        contactSubject && contactSubject.length < 5
                          ? 'Subject must be at least 5 characters'
                          : undefined
                      }
                    />
                    <Textarea
                      label="Message"
                      placeholder="Describe your issue or question in detail..."
                      required
                      minRows={5}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.currentTarget.value)}
                      error={
                        contactMessage && contactMessage.length < 20
                          ? 'Message must be at least 20 characters'
                          : undefined
                      }
                    />
                    <Group justify="flex-end">
                      <Button type="submit" leftSection={<IconMail size={16} />}>
                        Send Message
                      </Button>
                    </Group>
                  </Stack>
                </form>
              </Paper>

              <Paper p="md" withBorder>
                <Text fw={500} mb="xs">
                  Other ways to get help
                </Text>
                <Stack gap="xs">
                  <Group gap="xs">
                    <IconMail size={16} />
                    <Text size="sm">Email: support@braveforms.com</Text>
                  </Group>
                  <Group gap="xs">
                    <IconClock size={16} />
                    <Text size="sm">Response time: Within 24 hours (business days)</Text>
                  </Group>
                </Stack>
              </Paper>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
