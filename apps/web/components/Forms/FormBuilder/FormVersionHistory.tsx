'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Stack,
  Timeline,
  Card,
  Text,
  Button,
  Group,
  Badge,
  Modal,
  TextInput,
  ActionIcon,
  Tooltip,
  Alert,
  ScrollArea,
  Code,
} from '@mantine/core';
import {
  IconClock,
  IconCheck,
  IconHistory,
  IconTrash,
  IconTag,
  IconAlertCircle,
  IconArrowBack,
  IconPlus,
  IconMinus,
  IconEqual,
} from '@tabler/icons-react';
import { useSnapshot } from 'valtio';
import { formBuilderStore } from '@/lib/stores/form-builder-store';
import type { FieldDefinition } from '@brave-forms/types';

// ============================================================================
// Types
// ============================================================================

interface FormVersion {
  id: string;
  formId: string;
  timestamp: number;
  userId: string;
  userName: string;
  changeSummary: string;
  label?: string;
  fields: FieldDefinition[];
  fieldCount: number;
}

interface FieldChange {
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  fieldId: string;
  fieldLabel: string;
  details?: string;
  oldValue?: string;
  newValue?: string;
}

interface FormVersionHistoryProps {
  formId?: string;
}

// ============================================================================
// LocalStorage Persistence
// ============================================================================

const VERSIONS_STORAGE_KEY = 'braveforms_versions';
const MAX_VERSIONS = 50; // Keep last 50 versions per form
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Load versions from localStorage
 */
function loadVersionsFromStorage(formId: string): FormVersion[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(VERSIONS_STORAGE_KEY);
    if (!stored) return [];

    const allVersions: FormVersion[] = JSON.parse(stored);
    return allVersions.filter((v) => v.formId === formId).sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    console.error('Failed to load versions from storage');
    return [];
  }
}

/**
 * Save versions to localStorage
 */
function saveVersionsToStorage(versions: FormVersion[]): void {
  if (typeof window === 'undefined') return;

  try {
    // Load all versions, filter out current form's versions, add new ones
    const stored = localStorage.getItem(VERSIONS_STORAGE_KEY);
    const allVersions: FormVersion[] = stored ? JSON.parse(stored) : [];

    // Get unique form IDs being updated
    const updatedFormIds = new Set(versions.map((v) => v.formId));

    // Filter out versions for forms being updated
    const otherVersions = allVersions.filter((v) => !updatedFormIds.has(v.formId));

    // Combine and save
    const combinedVersions = [...otherVersions, ...versions];

    localStorage.setItem(VERSIONS_STORAGE_KEY, JSON.stringify(combinedVersions));
  } catch {
    console.error('Failed to save versions to storage');
  }
}

/**
 * Delete a version from storage
 */
function deleteVersionFromStorage(versionId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(VERSIONS_STORAGE_KEY);
    if (!stored) return;

    const allVersions: FormVersion[] = JSON.parse(stored);
    const filteredVersions = allVersions.filter((v) => v.id !== versionId);

    localStorage.setItem(VERSIONS_STORAGE_KEY, JSON.stringify(filteredVersions));
  } catch {
    console.error('Failed to delete version from storage');
  }
}

// ============================================================================
// Version Comparison Utilities
// ============================================================================

/**
 * Compare two versions and identify field changes
 */
function compareVersions(
  currentFields: FieldDefinition[],
  previousFields: FieldDefinition[]
): FieldChange[] {
  const changes: FieldChange[] = [];

  const currentFieldMap = new Map(currentFields.map((f) => [f.id, f]));
  const previousFieldMap = new Map(previousFields.map((f) => [f.id, f]));

  // Check for added fields
  for (const field of currentFields) {
    if (!previousFieldMap.has(field.id)) {
      changes.push({
        type: 'added',
        fieldId: field.id,
        fieldLabel: field.label,
        newValue: field.type,
      });
    }
  }

  // Check for removed fields
  for (const field of previousFields) {
    if (!currentFieldMap.has(field.id)) {
      changes.push({
        type: 'removed',
        fieldId: field.id,
        fieldLabel: field.label,
        oldValue: field.type,
      });
    }
  }

  // Check for modified fields
  for (const field of currentFields) {
    const previousField = previousFieldMap.get(field.id);
    if (previousField) {
      const currentJson = JSON.stringify(field);
      const previousJson = JSON.stringify(previousField);

      if (currentJson !== previousJson) {
        // Find what changed
        const changedProps: string[] = [];
        if (field.label !== previousField.label) changedProps.push('label');
        if (field.type !== previousField.type) changedProps.push('type');
        if (field.placeholder !== previousField.placeholder) changedProps.push('placeholder');
        if (JSON.stringify(field.validation) !== JSON.stringify(previousField.validation)) {
          changedProps.push('validation');
        }
        if (JSON.stringify(field.conditional) !== JSON.stringify(previousField.conditional)) {
          changedProps.push('conditional logic');
        }
        if (JSON.stringify(field.options) !== JSON.stringify(previousField.options)) {
          changedProps.push('options');
        }

        changes.push({
          type: 'modified',
          fieldId: field.id,
          fieldLabel: field.label,
          details:
            changedProps.length > 0 ? `Changed: ${changedProps.join(', ')}` : 'Content modified',
        });
      }
    }
  }

  // Add unchanged fields
  for (const field of currentFields) {
    const previousField = previousFieldMap.get(field.id);
    if (previousField) {
      const currentJson = JSON.stringify(field);
      const previousJson = JSON.stringify(previousField);
      if (currentJson === previousJson) {
        changes.push({
          type: 'unchanged',
          fieldId: field.id,
          fieldLabel: field.label,
        });
      }
    }
  }

  return changes;
}

/**
 * Generate change summary from field changes
 */
function generateChangeSummary(changes: FieldChange[]): string {
  const added = changes.filter((c) => c.type === 'added').length;
  const removed = changes.filter((c) => c.type === 'removed').length;
  const modified = changes.filter((c) => c.type === 'modified').length;

  const parts: string[] = [];
  if (added > 0) parts.push(`${added} added`);
  if (removed > 0) parts.push(`${removed} removed`);
  if (modified > 0) parts.push(`${modified} modified`);

  return parts.length > 0 ? parts.join(', ') : 'No changes';
}

// ============================================================================
// FormVersionHistory Component
// ============================================================================

export function FormVersionHistory({ formId = 'default' }: FormVersionHistoryProps) {
  const snap = useSnapshot(formBuilderStore);
  const [versions, setVersions] = useState<FormVersion[]>([]);
  const [compareVersion, setCompareVersion] = useState<FormVersion | null>(null);
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [versionLabel, setVersionLabel] = useState('');
  const [lastSaveTimestamp, setLastSaveTimestamp] = useState<number>(0);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  // Deep copy fields to avoid Valtio readonly issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deepCopyFields = useCallback((fields: any): FieldDefinition[] => {
    return JSON.parse(JSON.stringify(fields)) as FieldDefinition[];
  }, []);

  /**
   * Load versions on mount
   */
  useEffect(() => {
    const loadedVersions = loadVersionsFromStorage(formId);
    setVersions(loadedVersions);

    if (loadedVersions.length > 0) {
      setLastSaveTimestamp(loadedVersions[0].timestamp);
    }
  }, [formId]);

  /**
   * Auto-save every 5 minutes
   */
  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      if (snap.fields.length > 0) {
        autoSaveVersion();
      }
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
      }
    };
  }, [snap.fields.length]);

  /**
   * Create auto-save version
   */
  const autoSaveVersion = useCallback(() => {
    const currentFields = deepCopyFields(snap.fields);

    // Check if there are actual changes since last save
    if (versions.length > 0) {
      const lastVersion = versions[0];
      const changes = compareVersions(currentFields, lastVersion.fields);
      const hasChanges = changes.some((c) => c.type !== 'unchanged');

      if (!hasChanges) {
        return; // No changes, skip auto-save
      }
    }

    const newVersion: FormVersion = {
      id: `version_${Date.now()}`,
      formId,
      timestamp: Date.now(),
      userId: 'current_user',
      userName: 'Current User',
      changeSummary: 'Auto-saved',
      fields: currentFields,
      fieldCount: currentFields.length,
    };

    const updatedVersions = [newVersion, ...versions].slice(0, MAX_VERSIONS);
    setVersions(updatedVersions);
    saveVersionsToStorage(updatedVersions);
    setLastSaveTimestamp(Date.now());
  }, [snap.fields, versions, formId, deepCopyFields]);

  /**
   * Save version with custom label
   */
  const saveVersionWithLabel = useCallback(() => {
    if (!versionLabel.trim()) return;

    const currentFields = deepCopyFields(snap.fields);
    let changeSummary = 'Manual save';

    if (versions.length > 0) {
      const changes = compareVersions(currentFields, versions[0].fields);
      changeSummary = generateChangeSummary(changes);
    }

    const newVersion: FormVersion = {
      id: `version_${Date.now()}`,
      formId,
      timestamp: Date.now(),
      userId: 'current_user',
      userName: 'Current User',
      changeSummary,
      label: versionLabel.trim(),
      fields: currentFields,
      fieldCount: currentFields.length,
    };

    const updatedVersions = [newVersion, ...versions].slice(0, MAX_VERSIONS);
    setVersions(updatedVersions);
    saveVersionsToStorage(updatedVersions);
    setLastSaveTimestamp(Date.now());

    setLabelModalOpen(false);
    setVersionLabel('');
  }, [versionLabel, snap.fields, versions, formId, deepCopyFields]);

  /**
   * Restore a previous version
   */
  const restoreVersion = useCallback(
    (version: FormVersion) => {
      // Save current state before restoring
      const currentFields = deepCopyFields(snap.fields);

      const saveBeforeRestore: FormVersion = {
        id: `version_${Date.now()}`,
        formId,
        timestamp: Date.now(),
        userId: 'current_user',
        userName: 'Current User',
        changeSummary: `Before restore to ${version.label || new Date(version.timestamp).toLocaleString()}`,
        fields: currentFields,
        fieldCount: currentFields.length,
      };

      const updatedVersions = [saveBeforeRestore, ...versions].slice(0, MAX_VERSIONS);
      setVersions(updatedVersions);
      saveVersionsToStorage(updatedVersions);

      // Restore the selected version by directly setting store fields
      formBuilderStore.fields = [...version.fields];
      formBuilderStore.isDirty = true;
      formBuilderStore.lastModified = new Date().toISOString();
    },
    [snap.fields, versions, formId, deepCopyFields]
  );

  /**
   * Delete a version
   */
  const deleteVersion = useCallback(
    (versionId: string) => {
      const updatedVersions = versions.filter((v) => v.id !== versionId);
      setVersions(updatedVersions);
      deleteVersionFromStorage(versionId);
    },
    [versions]
  );

  /**
   * Format relative time
   */
  const formatRelativeTime = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    return `${days} day${days === 1 ? '' : 's'} ago`;
  };

  /**
   * Get time until next auto-save
   */
  const getNextAutoSave = (): string => {
    const elapsed = Date.now() - lastSaveTimestamp;
    const remaining = AUTO_SAVE_INTERVAL - elapsed;

    if (remaining <= 0) return 'Any moment';

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card withBorder padding="md">
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Group gap="xs">
              <IconHistory size={20} />
              <Text size="lg" fw={600}>
                Version History
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              {versions.length} version{versions.length === 1 ? '' : 's'} saved
            </Text>
          </div>

          <Group gap="xs">
            <Tooltip label={`Next auto-save in ${getNextAutoSave()}`}>
              <Badge size="sm" variant="light" leftSection={<IconClock size={12} />}>
                Auto-save: {getNextAutoSave()}
              </Badge>
            </Tooltip>

            <Button
              size="xs"
              leftSection={<IconTag size={14} />}
              onClick={() => setLabelModalOpen(true)}
              disabled={snap.fields.length === 0}
            >
              Save Version
            </Button>
          </Group>
        </Group>

        {/* Version Timeline */}
        {versions.length === 0 ? (
          <Alert color="gray" icon={<IconAlertCircle size={16} />}>
            No versions saved yet. Versions are auto-saved every 5 minutes when changes are made.
          </Alert>
        ) : (
          <ScrollArea h={400} offsetScrollbars>
            <Timeline active={0} bulletSize={24} lineWidth={2}>
              {versions.slice(0, 20).map((version, index) => (
                <Timeline.Item
                  key={version.id}
                  bullet={index === 0 ? <IconCheck size={12} /> : <IconClock size={12} />}
                  title={
                    <Group gap="xs">
                      <Text size="sm" fw={500}>
                        {formatRelativeTime(version.timestamp)}
                      </Text>
                      {version.label && (
                        <Badge size="sm" variant="light" color="blue">
                          {version.label}
                        </Badge>
                      )}
                      {index === 0 && (
                        <Badge size="sm" color="green">
                          Current
                        </Badge>
                      )}
                    </Group>
                  }
                >
                  <Stack gap="xs">
                    <Text size="xs" c="dimmed">
                      {new Date(version.timestamp).toLocaleString()} - {version.changeSummary}
                    </Text>

                    <Text size="xs" c="dimmed">
                      {version.fieldCount} field{version.fieldCount === 1 ? '' : 's'}
                    </Text>

                    <Group gap="xs">
                      <Button size="xs" variant="subtle" onClick={() => setCompareVersion(version)}>
                        Compare
                      </Button>

                      {index > 0 && (
                        <>
                          <Button
                            size="xs"
                            variant="light"
                            leftSection={<IconArrowBack size={14} />}
                            onClick={() => restoreVersion(version)}
                          >
                            Restore
                          </Button>

                          <Tooltip label="Delete this version">
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="red"
                              onClick={() => deleteVersion(version.id)}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </>
                      )}
                    </Group>
                  </Stack>
                </Timeline.Item>
              ))}
            </Timeline>

            {versions.length > 20 && (
              <Text size="xs" c="dimmed" ta="center" mt="md">
                Showing 20 of {versions.length} versions
              </Text>
            )}
          </ScrollArea>
        )}

        {/* Save Version Modal */}
        <Modal
          opened={labelModalOpen}
          onClose={() => setLabelModalOpen(false)}
          title="Save Version"
        >
          <Stack gap="md">
            <TextInput
              label="Version Label"
              placeholder="e.g., v1.0 - Ready for review"
              value={versionLabel}
              onChange={(e) => setVersionLabel(e.target.value)}
              description="Add a descriptive label to identify this version"
            />

            <Group justify="flex-end" gap="xs">
              <Button variant="light" onClick={() => setLabelModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveVersionWithLabel} disabled={!versionLabel.trim()}>
                Save Version
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* Version Comparison Modal */}
        <Modal
          opened={!!compareVersion}
          onClose={() => setCompareVersion(null)}
          title="Version Comparison"
          size="lg"
        >
          {compareVersion && versions.length > 0 && (
            <VersionComparison currentVersion={versions[0]} previousVersion={compareVersion} />
          )}
        </Modal>
      </Stack>
    </Card>
  );
}

// ============================================================================
// VersionComparison Component
// ============================================================================

interface VersionComparisonProps {
  currentVersion: FormVersion;
  previousVersion: FormVersion;
}

function VersionComparison({ currentVersion, previousVersion }: VersionComparisonProps) {
  const changes = compareVersions(currentVersion.fields, previousVersion.fields);

  const addedCount = changes.filter((c) => c.type === 'added').length;
  const removedCount = changes.filter((c) => c.type === 'removed').length;
  const modifiedCount = changes.filter((c) => c.type === 'modified').length;

  /**
   * Get icon for change type
   */
  const getChangeIcon = (type: FieldChange['type']) => {
    switch (type) {
      case 'added':
        return <IconPlus size={14} color="green" />;
      case 'removed':
        return <IconMinus size={14} color="red" />;
      case 'modified':
        return <IconEqual size={14} color="orange" />;
      default:
        return null;
    }
  };

  /**
   * Get badge color for change type
   */
  const getBadgeColor = (type: FieldChange['type']) => {
    switch (type) {
      case 'added':
        return 'green';
      case 'removed':
        return 'red';
      case 'modified':
        return 'orange';
      default:
        return 'gray';
    }
  };

  return (
    <Stack gap="md">
      {/* Comparison Header */}
      <Group justify="space-between">
        <div>
          <Text size="sm" fw={500}>
            Current Version
          </Text>
          <Text size="xs" c="dimmed">
            {new Date(currentVersion.timestamp).toLocaleString()}
          </Text>
          {currentVersion.label && (
            <Badge size="xs" variant="light">
              {currentVersion.label}
            </Badge>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <Text size="sm" fw={500}>
            Comparing To
          </Text>
          <Text size="xs" c="dimmed">
            {new Date(previousVersion.timestamp).toLocaleString()}
          </Text>
          {previousVersion.label && (
            <Badge size="xs" variant="light">
              {previousVersion.label}
            </Badge>
          )}
        </div>
      </Group>

      {/* Summary */}
      <Group gap="md">
        <Badge color="green" variant="light" leftSection={<IconPlus size={12} />}>
          {addedCount} Added
        </Badge>
        <Badge color="red" variant="light" leftSection={<IconMinus size={12} />}>
          {removedCount} Removed
        </Badge>
        <Badge color="orange" variant="light" leftSection={<IconEqual size={12} />}>
          {modifiedCount} Modified
        </Badge>
      </Group>

      {/* Changes List */}
      <ScrollArea h={300} offsetScrollbars>
        <Stack gap="xs">
          {changes
            .filter((c) => c.type !== 'unchanged')
            .map((change) => (
              <Card key={change.fieldId} withBorder padding="xs">
                <Group gap="xs" wrap="nowrap">
                  {getChangeIcon(change.type)}
                  <Badge size="xs" color={getBadgeColor(change.type)}>
                    {change.type}
                  </Badge>
                  <div style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>
                      {change.fieldLabel}
                    </Text>
                    {change.details && (
                      <Text size="xs" c="dimmed">
                        {change.details}
                      </Text>
                    )}
                    {change.newValue && !change.oldValue && <Code>Type: {change.newValue}</Code>}
                    {change.oldValue && !change.newValue && <Code>Type: {change.oldValue}</Code>}
                  </div>
                </Group>
              </Card>
            ))}

          {changes.filter((c) => c.type !== 'unchanged').length === 0 && (
            <Alert color="gray">No differences found between these versions.</Alert>
          )}
        </Stack>
      </ScrollArea>
    </Stack>
  );
}

// ============================================================================
// Exports
// ============================================================================

export { compareVersions, generateChangeSummary };
export type { FormVersion, FieldChange };
