# ISSUE-135: Offline Experience Tests (4h)

**Priority:** P0
**Phase:** Phase 2 - Offline Experience UI
**Estimated Hours:** 4
**Dependencies:** ISSUE-134
**Sprint:** Sprint 5

---

## Objective

Create comprehensive test suite for all offline experience features to ensure 30-day offline capability works reliably for construction field workers.

## Tasks

- [ ] Write tests for offline detection (network toggle)
- [ ] Write tests for auto-save to IndexedDB
- [ ] Write tests for sync queue persistence
- [ ] Write tests for conflict detection and resolution
- [ ] Write tests for 30-day storage capacity
- [ ] Write tests for manual sync trigger
- [ ] Write tests for retry failed sync
- [ ] Achieve >80% test coverage for offline features
- [ ] Create E2E tests with Playwright for offline scenarios

## Technical Details

**Libraries/Dependencies:**

- Vitest (unit/integration tests)
- Playwright (E2E offline tests)
- Mock Service Worker (network mocking)

**Test Categories:**

**1. Offline Detection:**

```typescript
describe('Offline Detection', () => {
  it('detects when network goes offline', async () => {
    // Simulate online
    Object.defineProperty(navigator, 'onLine', { value: true });
    expect(getNetworkStatus()).toBe('online');

    // Simulate offline
    Object.defineProperty(navigator, 'onLine', { value: false });
    window.dispatchEvent(new Event('offline'));

    await waitFor(() => {
      expect(getNetworkStatus()).toBe('offline');
    });
  });

  it('shows offline banner when offline', async () => {
    goOffline();
    render(<App />);

    expect(screen.getByText(/you are offline/i)).toBeInTheDocument();
  });
});
```

**2. Auto-Save:**

```typescript
describe('Auto-Save to IndexedDB', () => {
  it('auto-saves form data every 30 seconds', async () => {
    const { result } = renderHook(() => useFormAutoSave());

    act(() => {
      result.current.updateField('name', 'John Doe');
    });

    // Wait for auto-save interval
    await waitFor(
      () => {
        const saved = await getFromIndexedDB('formDraft');
        expect(saved.name).toBe('John Doe');
      },
      { timeout: 31000 }
    );
  });

  it('restores form data from IndexedDB on reload', async () => {
    await saveToIndexedDB('formDraft', { name: 'John Doe' });

    const { result } = renderHook(() => useFormAutoSave());

    expect(result.current.formData.name).toBe('John Doe');
  });
});
```

**3. Sync Queue:**

```typescript
describe('Sync Queue Persistence', () => {
  it('persists sync queue to IndexedDB', async () => {
    const item = {
      id: '123',
      type: 'form_submission',
      data: {
        /* form data */
      },
    };

    await syncQueueStore.addItem(item);

    const queue = await getSyncQueueFromIndexedDB();
    expect(queue).toContainEqual(item);
  });

  it('processes sync queue when back online', async () => {
    // Add items while offline
    goOffline();
    await submitForm({
      /* data */
    });
    await uploadPhoto({
      /* data */
    });

    expect(syncQueueStore.queue).toHaveLength(2);

    // Go back online
    goOnline();
    await triggerSync();

    await waitFor(() => {
      expect(syncQueueStore.queue).toHaveLength(0);
    });
  });
});
```

**4. Conflict Resolution:**

```typescript
describe('Conflict Detection', () => {
  it('detects conflicts between local and server versions', () => {
    const localData = { name: 'John', age: 30 };
    const serverData = { name: 'John Doe', age: 30 };

    const conflicts = detectConflicts(localData, serverData);

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({
      field: 'name',
      localValue: 'John',
      serverValue: 'John Doe',
      type: 'modified',
    });
  });

  it('resolves conflicts with Keep Local option', async () => {
    const conflict = createTestConflict();

    await resolveConflict(conflict.id, 'local');

    const resolved = await getForm(conflict.resourceId);
    expect(resolved.data).toEqual(conflict.localVersion.data);
  });
});
```

**5. 30-Day Storage:**

```typescript
describe('30-Day Storage Capacity', () => {
  it('estimates days remaining correctly', async () => {
    // Mock storage at 50% capacity
    mockStorageEstimate({ usage: 50 * 1024 * 1024, quota: 100 * 1024 * 1024 });

    const info = await getStorageInfo();

    expect(info.daysRemaining).toBeCloseTo(15, 1);
  });

  it('shows warning at 80% capacity', async () => {
    mockStorageEstimate({ usage: 80 * 1024 * 1024, quota: 100 * 1024 * 1024 });

    render(<StorageIndicators />);

    expect(screen.getByText(/storage warning/i)).toBeInTheDocument();
  });
});
```

**6. E2E Offline Tests (Playwright):**

```typescript
test.describe('Offline Experience E2E', () => {
  test('complete offline workflow', async ({ page, context }) => {
    // Start online, load app
    await page.goto('/');
    await expect(page.locator('[data-testid="app-header"]')).toBeVisible();

    // Go offline
    await context.setOffline(true);

    // Fill form offline
    await page.goto('/forms/123');
    await page.fill('[name="inspectorName"]', 'John Doe');
    await page.fill('[name="notes"]', 'Inspection completed');
    await page.click('button[type="submit"]');

    // Verify queued
    await page.goto('/sync/queue');
    await expect(page.locator('table tbody tr')).toHaveCount(1);

    // Go back online
    await context.setOffline(false);

    // Trigger sync
    await page.click('button:has-text("Sync Now")');

    // Verify synced
    await expect(page.locator('text=Sync Complete')).toBeVisible();
    await page.goto('/sync/queue');
    await expect(page.locator('table tbody tr')).toHaveCount(0);
  });
});
```

## Acceptance Criteria

- [ ] Offline detection tests passing
- [ ] Auto-save to IndexedDB tests passing
- [ ] Sync queue persistence tests passing
- [ ] Conflict detection tests passing
- [ ] 30-day storage capacity tests passing
- [ ] Manual sync trigger tests passing
- [ ] Retry failed sync tests passing
- [ ] Test coverage >80% for all offline features
- [ ] E2E tests cover complete offline workflow

## Testing Requirements

**Unit Tests (15+ tests):**

- Offline detection (3 tests)
- Auto-save (4 tests)
- Sync queue (4 tests)
- Conflict resolution (4 tests)

**Integration Tests (10+ tests):**

- Storage indicators (3 tests)
- Manual sync (3 tests)
- Retry failed (2 tests)
- Queue management (2 tests)

**E2E Tests (3+ scenarios):**

- Complete offline workflow
- Conflict resolution flow
- Storage cleanup flow

## Evidence Requirements

- [ ] Screenshot: Test coverage report (>80%)
- [ ] Screenshot: All offline tests passing
- [ ] Screenshot: E2E test execution video
- [ ] Test Results: Vitest output showing all tests pass
- [ ] Test Results: Playwright E2E test report

## Success Criteria

Offline experience tests are complete when:

- All unit tests passing (>25 tests)
- All integration tests passing (>10 tests)
- All E2E tests passing (>3 scenarios)
- Test coverage >80%
- Evidence collected and documented

---

**Created:** 2025-10-23
**Last Updated:** 2025-10-23
**Status:** READY FOR IMPLEMENTATION
