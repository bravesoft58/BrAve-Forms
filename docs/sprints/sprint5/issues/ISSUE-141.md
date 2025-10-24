# ISSUE-141: Loading States & Skeletons (3h)

**Priority:** P1
**Phase:** Phase 4 - Polish & Testing
**Estimated Hours:** 3
**Dependencies:** Phase 1, 2, 3 complete
**Sprint:** Sprint 5

---

## Objective

Add professional loading states and skeleton screens to all Sprint 5 features to improve perceived performance and provide visual feedback during data fetching for field workers.

## Tasks

- [ ] Create skeleton components for photo gallery grid
- [ ] Create skeleton components for map view
- [ ] Create skeleton components for sync queue table
- [ ] Create skeleton components for settings forms
- [ ] Add loading states to all async operations
- [ ] Implement optimistic updates for form submissions
- [ ] Add loading spinners to buttons during async actions
- [ ] Test loading states with simulated slow network
- [ ] Add unit tests for loading state logic

## Technical Details

**Libraries/Dependencies:**

- Mantine Skeleton component
- Mantine Loader component
- React Suspense (for code splitting)
- TanStack Query (isLoading, isFetching states)

**Code Example:**

```typescript
'use client';

import { Skeleton, Card, SimpleGrid, Stack, Group, Loader } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';

// Photo Gallery Skeleton
export function PhotoGallerySkeleton() {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }}>
      {Array.from({ length: 8 }).map((_, index) => (
        <Card key={index} withBorder>
          <Skeleton height={200} radius="md" mb="xs" />
          <Skeleton height={16} width="70%" mb="xs" />
          <Skeleton height={12} width="50%" />
        </Card>
      ))}
    </SimpleGrid>
  );
}

// Map View Skeleton
export function MapViewSkeleton() {
  return (
    <Card withBorder>
      <Skeleton height={400} radius="md" />
    </Card>
  );
}

// Sync Queue Table Skeleton
export function SyncQueueSkeleton() {
  return (
    <Stack gap="xs">
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={index} withBorder padding="md">
          <Group justify="space-between">
            <Skeleton height={16} width={200} />
            <Skeleton height={12} width={100} />
          </Group>
        </Card>
      ))}
    </Stack>
  );
}

// Settings Form Skeleton
export function SettingsFormSkeleton() {
  return (
    <Stack gap="md">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index}>
          <Skeleton height={12} width={100} mb="xs" />
          <Skeleton height={36} radius="sm" />
        </div>
      ))}
      <Skeleton height={36} width={120} radius="sm" />
    </Stack>
  );
}

// Usage in Photo Gallery Component
export default function PhotoGalleryPage() {
  const { data: photos, isLoading, isFetching } = useQuery({
    queryKey: ['photos'],
    queryFn: fetchPhotos,
  });

  if (isLoading) {
    return <PhotoGallerySkeleton />;
  }

  return (
    <div>
      {isFetching && (
        <Group gap="xs" mb="md">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">Refreshing photos...</Text>
        </Group>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }}>
        {photos?.map(photo => (
          <PhotoCard key={photo.id} photo={photo} />
        ))}
      </SimpleGrid>
    </div>
  );
}

// Optimistic Update Example (Form Submission)
export function FormSubmissionButton({ formData }: { formData: FormData }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: submitForm,
    onMutate: async (newForm) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['forms'] });

      // Snapshot previous value
      const previousForms = queryClient.getQueryData(['forms']);

      // Optimistically update to new value
      queryClient.setQueryData(['forms'], (old: Form[]) => [
        ...old,
        { ...newForm, id: 'temp-id', status: 'pending' },
      ]);

      return { previousForms };
    },
    onError: (err, newForm, context) => {
      // Rollback on error
      queryClient.setQueryData(['forms'], context?.previousForms);
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['forms'] });
    },
  });

  return (
    <Button
      onClick={() => mutation.mutate(formData)}
      loading={mutation.isPending}
      disabled={mutation.isPending}
    >
      {mutation.isPending ? 'Submitting...' : 'Submit Form'}
    </Button>
  );
}

// Button Loading States
export function ActionButton({ onClick, children }: { onClick: () => Promise<void>, children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onClick();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} loading={loading}>
      {children}
    </Button>
  );
}

// Simulated Slow Network (for testing)
export async function simulateSlowNetwork<T>(fn: () => Promise<T>, delay = 2000): Promise<T> {
  await new Promise(resolve => setTimeout(resolve, delay));
  return fn();
}

// Usage in tests
it('should show skeleton while loading photos', async () => {
  const { container } = render(<PhotoGalleryPage />);

  // Skeleton should be visible initially
  expect(screen.getAllByTestId('skeleton')).toHaveLength(8);

  // Wait for photos to load
  await waitFor(() => {
    expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
  });

  // Photos should be visible
  expect(screen.getAllByTestId('photo-card')).toHaveLength(10);
});
```

## Acceptance Criteria

- [ ] All photo gallery views show skeletons while loading
- [ ] Map view shows skeleton while tiles load
- [ ] Sync queue shows skeleton during refresh
- [ ] Settings forms show skeletons while fetching preferences
- [ ] All buttons show loading spinners during async actions
- [ ] Optimistic updates applied to form submissions
- [ ] Loading states work with simulated slow network
- [ ] No flash of empty content (skeleton appears immediately)
- [ ] Smooth transitions from skeleton to actual content

## Testing Requirements

**Unit Tests:**

- Test skeleton components render correctly
- Test loading state transitions
- Test optimistic update rollback on error

**Integration Tests:**

- Test TanStack Query loading states
- Test button loading spinners
- Test skeleton → content transitions

**Manual Testing:**

- Throttle network to "Slow 3G" in DevTools
- Verify skeletons appear immediately on load
- Verify smooth transitions to actual content
- Test optimistic updates with network failures

## Evidence Requirements

- [ ] Screenshot: Photo gallery skeleton
- [ ] Screenshot: Map view skeleton
- [ ] Screenshot: Sync queue skeleton
- [ ] Screenshot: Settings form skeleton
- [ ] Video: Smooth skeleton → content transition
- [ ] Test Results: Loading state tests (>80% coverage)

## Success Criteria

Loading states are complete when:

- All features have appropriate skeletons
- No flash of empty content
- Smooth transitions to actual content
- Optimistic updates working
- All tests passing

---

**Created:** 2025-10-23
**Last Updated:** 2025-10-23
**Status:** READY FOR IMPLEMENTATION
