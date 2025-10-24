# ISSUE-154: Form Version History (3h)

**Priority:** P2
**Phase:** Phase 5 - Form Builder
**Estimated Hours:** 3
**Dependencies:** ISSUE-152
**Sprint:** Sprint 5

---

## Objective

Create a form version history system allowing form builders to track changes, compare versions, and restore previous versions of forms.

## Tasks

- [ ] Create FormVersionHistory component
- [ ] Implement auto-save versioning (every 5 minutes)
- [ ] Create version comparison view (diff viewer)
- [ ] Implement version restore functionality
- [ ] Add version metadata (timestamp, user, change summary)
- [ ] Create version labels/tags
- [ ] Implement version deletion with confirmation
- [ ] Add unit tests for versioning logic

## Technical Details

**Libraries/Dependencies:**

- IndexedDB (version storage)
- Valtio (form builder state)
- Mantine components (Timeline, Card, Modal, Button)
- diff library (version comparison)

**Code Example:**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Stack, Timeline, Card, Text, Button, Group, Badge, Modal } from '@mantine/core';
import { IconClock, IconCheck, IconRestore, IconTrash } from '@tabler/icons-react';
import { useSnapshot } from 'valtio';
import { formBuilderStore, loadVersion, saveVersion } from './store';
import { diffLines } from 'diff';

export interface FormVersion {
  id: string;
  formId: string;
  timestamp: number;
  userId: string;
  userName: string;
  changeSummary: string;
  label?: string;
  fields: FormField[];
}

// Form Version History Component
export function FormVersionHistory({ formId }: { formId: string }) {
  const [versions, setVersions] = useState<FormVersion[]>([]);
  const [compareVersion, setCompareVersion] = useState<FormVersion | null>(null);

  useEffect(() => {
    loadVersions();

    // Auto-save every 5 minutes
    const interval = setInterval(() => {
      autoSaveVersion();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [formId]);

  const loadVersions = async () => {
    const db = await openDB('braveforms', 1);
    const storedVersions = await db.getAll('formVersions');
    setVersions(storedVersions.filter(v => v.formId === formId));
  };

  const autoSaveVersion = async () => {
    const snap = formBuilderStore;
    const newVersion: FormVersion = {
      id: `version-${Date.now()}`,
      formId,
      timestamp: Date.now(),
      userId: 'current-user', // From Clerk
      userName: 'John Doe', // From Clerk
      changeSummary: 'Auto-saved',
      fields: snap.fields,
    };

    const db = await openDB('braveforms', 1);
    await db.add('formVersions', newVersion);
    await loadVersions();
  };

  const saveVersionWithLabel = async () => {
    const label = prompt('Version label (e.g., "v1.0 - Ready for production"):');
    if (!label) return;

    const snap = formBuilderStore;
    const newVersion: FormVersion = {
      id: `version-${Date.now()}`,
      formId,
      timestamp: Date.now(),
      userId: 'current-user',
      userName: 'John Doe',
      changeSummary: 'Manual save',
      label,
      fields: snap.fields,
    };

    const db = await openDB('braveforms', 1);
    await db.add('formVersions', newVersion);
    await loadVersions();
  };

  const restoreVersion = async (version: FormVersion) => {
    if (confirm(`Restore version from ${new Date(version.timestamp).toLocaleString()}?`)) {
      loadVersion(version.fields);
      alert('Version restored!');
    }
  };

  const deleteVersion = async (versionId: string) => {
    if (confirm('Delete this version? This cannot be undone.')) {
      const db = await openDB('braveforms', 1);
      await db.delete('formVersions', versionId);
      await loadVersions();
    }
  };

  return (
    <Card withBorder padding="md">
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Text size="lg" fw={600}>Version History</Text>
            <Text size="xs" c="dimmed">{versions.length} versions saved</Text>
          </div>

          <Button size="xs" onClick={saveVersionWithLabel}>
            Save Version
          </Button>
        </Group>

        {versions.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="xl">
            No versions saved yet
          </Text>
        ) : (
          <Timeline active={0} bulletSize={24} lineWidth={2}>
            {versions.map((version, index) => (
              <Timeline.Item
                key={version.id}
                bullet={index === 0 ? <IconCheck size={12} /> : <IconClock size={12} />}
                title={
                  <Group gap="xs">
                    <Text size="sm" fw={500}>
                      {new Date(version.timestamp).toLocaleString()}
                    </Text>
                    {version.label && (
                      <Badge size="sm" variant="light">{version.label}</Badge>
                    )}
                    {index === 0 && (
                      <Badge size="sm" color="green">Current</Badge>
                    )}
                  </Group>
                }
              >
                <Stack gap="xs">
                  <Text size="xs" c="dimmed">
                    by {version.userName} • {version.changeSummary}
                  </Text>

                  <Text size="xs" c="dimmed">
                    {version.fields.length} fields
                  </Text>

                  <Group gap="xs">
                    <Button
                      size="xs"
                      variant="subtle"
                      onClick={() => setCompareVersion(version)}
                    >
                      Compare
                    </Button>

                    {index > 0 && (
                      <>
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<IconRestore size={14} />}
                          onClick={() => restoreVersion(version)}
                        >
                          Restore
                        </Button>

                        <Button
                          size="xs"
                          variant="subtle"
                          color="red"
                          leftSection={<IconTrash size={14} />}
                          onClick={() => deleteVersion(version.id)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </Group>
                </Stack>
              </Timeline.Item>
            ))}
          </Timeline>
        )}

        {/* Version Comparison Modal */}
        <Modal
          opened={!!compareVersion}
          onClose={() => setCompareVersion(null)}
          title="Version Comparison"
          size="xl"
        >
          {compareVersion && (
            <VersionComparison
              version1={versions[0]} // Current version
              version2={compareVersion}
            />
          )}
        </Modal>
      </Stack>
    </Card>
  );
}

// Version Comparison Component
function VersionComparison({ version1, version2 }: { version1: FormVersion, version2: FormVersion }) {
  const currentFields = JSON.stringify(version1.fields, null, 2);
  const previousFields = JSON.stringify(version2.fields, null, 2);

  const differences = diffLines(previousFields, currentFields);

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Text size="sm" fw={500}>Current Version</Text>
          <Text size="xs" c="dimmed">{new Date(version1.timestamp).toLocaleString()}</Text>
        </div>
        <div>
          <Text size="sm" fw={500}>Previous Version</Text>
          <Text size="xs" c="dimmed">{new Date(version2.timestamp).toLocaleString()}</Text>
        </div>
      </Group>

      <Card withBorder padding="md" style={{ fontFamily: 'monospace', fontSize: 12 }}>
        {differences.map((part, index) => {
          const color = part.added ? 'green' : part.removed ? 'red' : 'gray';
          const bgColor = part.added ? '#e6ffe6' : part.removed ? '#ffe6e6' : 'transparent';

          return (
            <div
              key={index}
              style={{
                color,
                backgroundColor: bgColor,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {part.value}
            </div>
          );
        })}
      </Card>

      <Text size="xs" c="dimmed">
        <span style={{ color: 'green' }}>Green</span> = Added,{' '}
        <span style={{ color: 'red' }}>Red</span> = Removed
      </Text>
    </Stack>
  );
}
```

## Acceptance Criteria

- [ ] Version history displays all saved versions
- [ ] Auto-save creates version every 5 minutes
- [ ] Manual save with label functional
- [ ] Version comparison shows diff
- [ ] Restore version loads fields into canvas
- [ ] Delete version working with confirmation
- [ ] Version metadata displayed (timestamp, user, summary)
- [ ] Current version highlighted

## Testing Requirements

**Unit Tests:**

- Test version save
- Test version restore
- Test version delete
- Test version comparison

**Integration Tests:**

- Test auto-save interval
- Test IndexedDB storage
- Test version load to canvas

**Manual Testing:**

- Wait 5 minutes to test auto-save
- Save version with label
- Compare two versions
- Restore previous version
- Delete old version

## Evidence Requirements

- [ ] Screenshot: Version history timeline
- [ ] Screenshot: Version comparison diff
- [ ] Screenshot: Restore version confirmation
- [ ] Test Results: Versioning tests (>80% coverage)

## Success Criteria

Form version history is complete when:

- Auto-save working every 5 minutes
- Manual save with labels functional
- Version comparison shows changes
- Restore version working
- All tests passing

---

**Created:** 2025-10-23
**Last Updated:** 2025-10-23
**Status:** READY FOR IMPLEMENTATION
