'use client';

import { useState, useMemo, useEffect } from 'react';
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
  Select,
  Loader,
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
  IconHistory,
  IconCloudUpload,
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
import {
  useCreateSupportRequest,
  useMySupportRequests,
  syncOfflineSupportRequests,
} from '@/hooks/useSupportRequest';
import { useAppAuth } from '@/app/providers';
import {
  type SupportRequestType,
  SUPPORT_REQUEST_TYPES,
  SUPPORT_REQUEST_TYPE_LABELS,
  SUPPORT_REQUEST_STATUS_LABELS,
} from '@/lib/api/support';

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
  const [contactType, setContactType] = useState<SupportRequestType>(SUPPORT_REQUEST_TYPES.HELP);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactError, setContactError] = useState('');

  // Backend hooks
  const { getToken } = useAppAuth();
  const createSupportMutation = useCreateSupportRequest();
  const { data: myRequests, isLoading: loadingRequests } = useMySupportRequests();

  // Sync offline requests when coming back online
  useEffect(() => {
    const handleOnline = async () => {
      const result = await syncOfflineSupportRequests(getToken);
      if (result.synced > 0) {
        console.log(`Synced ${result.synced} offline support requests`);
      }
      if (result.deadLettered > 0) {
        console.warn(
          `${result.deadLettered} support requests moved to dead letter queue after max retries`
        );
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [getToken]);

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

  // Handle contact form submission with backend sync and offline support
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

    try {
      // ISSUE-174: Submit to backend via GraphQL mutation
      // If offline, the hook will queue for later sync
      await createSupportMutation.mutateAsync({
        type: contactType,
        subject: contactSubject.trim(),
        description: contactMessage.trim(),
      });

      setContactSubmitted(true);
      setContactType(SUPPORT_REQUEST_TYPES.HELP);
      setContactSubject('');
      setContactMessage('');
      setTimeout(() => setContactSubmitted(false), 5000);
    } catch (error) {
      // Provide user-friendly error message with offline queue indication
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      if (isOffline) {
        setContactError(
          'You appear to be offline. Your message has been saved and will be sent when you reconnect.'
        );
      } else {
        setContactError(
          'Unable to submit your request right now. Please try again in a few moments, or contact support@braveforms.com directly.'
        );
      }
      console.error('Support request error:', error);
    }
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
                <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
                  {contactError}
                </Alert>
              )}

              <Paper p="lg" withBorder>
                <form onSubmit={handleContactSubmit}>
                  <Stack gap="md">
                    <Select
                      label="Request Type"
                      placeholder="Select type"
                      required
                      value={contactType}
                      onChange={(value) =>
                        setContactType((value as SupportRequestType) || SUPPORT_REQUEST_TYPES.HELP)
                      }
                      data={[
                        { value: SUPPORT_REQUEST_TYPES.HELP, label: SUPPORT_REQUEST_TYPE_LABELS.help },
                        { value: SUPPORT_REQUEST_TYPES.BUG, label: SUPPORT_REQUEST_TYPE_LABELS.bug },
                        {
                          value: SUPPORT_REQUEST_TYPES.FEATURE,
                          label: SUPPORT_REQUEST_TYPE_LABELS.feature,
                        },
                        {
                          value: SUPPORT_REQUEST_TYPES.FEEDBACK,
                          label: SUPPORT_REQUEST_TYPE_LABELS.feedback,
                        },
                      ]}
                    />
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
                      <Button
                        type="submit"
                        leftSection={
                          createSupportMutation.isPending ? (
                            <Loader size={14} color="white" />
                          ) : (
                            <IconCloudUpload size={16} />
                          )
                        }
                        disabled={createSupportMutation.isPending}
                      >
                        {createSupportMutation.isPending ? 'Sending...' : 'Send Message'}
                      </Button>
                    </Group>
                  </Stack>
                </form>
              </Paper>

              {/* Previous Support Requests */}
              {myRequests && myRequests.length > 0 && (
                <Paper p="md" withBorder>
                  <Group gap="xs" mb="md">
                    <IconHistory size={18} />
                    <Text fw={500}>Your Previous Requests</Text>
                  </Group>
                  <Stack gap="sm">
                    {loadingRequests ? (
                      <Group justify="center" py="md">
                        <Loader size="sm" />
                        <Text size="sm" c="dimmed">
                          Loading requests...
                        </Text>
                      </Group>
                    ) : (
                      myRequests.slice(0, 5).map((request) => (
                        <Paper key={request.id} p="sm" withBorder>
                          <Group justify="space-between" mb="xs">
                            <Text size="sm" fw={500}>
                              {request.subject}
                            </Text>
                            <Badge
                              size="sm"
                              color={
                                request.status === 'OPEN'
                                  ? 'blue'
                                  : request.status === 'IN_PROGRESS'
                                    ? 'yellow'
                                    : request.status === 'RESOLVED'
                                      ? 'green'
                                      : 'gray'
                              }
                            >
                              {SUPPORT_REQUEST_STATUS_LABELS[request.status] || request.status}
                            </Badge>
                          </Group>
                          <Text size="xs" c="dimmed">
                            {new Date(request.createdAt).toLocaleDateString()}
                            {' - '}
                            {SUPPORT_REQUEST_TYPE_LABELS[request.type] || request.type}
                          </Text>
                          {request.response && (
                            <Paper p="xs" bg="gray.1" mt="xs">
                              <Text size="xs" fw={500}>
                                Response:
                              </Text>
                              <Text size="xs">{request.response}</Text>
                            </Paper>
                          )}
                        </Paper>
                      ))
                    )}
                  </Stack>
                </Paper>
              )}

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
