'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAppAuth } from '@/app/providers';
import { Modal, Button, Stack, Radio, Group, Text, Alert } from '@mantine/core';
import { cloneSubmission } from '@/lib/api/submissions';

interface UseAsTemplateDialogProps {
  submissionId: string;
  templateId: string;
  isOpen: boolean;
  onClose: () => void;
}

type CloneMode = 'keep_all' | 'structure_only' | 'clear_all';

export function UseAsTemplateDialog({
  submissionId,
  templateId,
  isOpen,
  onClose,
}: UseAsTemplateDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const auth = useAppAuth();
  const [selectedMode, setSelectedMode] = useState<CloneMode>('keep_all');

  const cloneMutation = useMutation({
    mutationFn: async (mode: CloneMode) => {
      const token = auth.getToken ? await auth.getToken() : 'dev-token-123';
      return await cloneSubmission(submissionId, mode, token);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      onClose();
      router.push(`/forms/${templateId}/fill?draftId=${data.id}`);
    },
    onError: () => {
      // Error is displayed in the UI via cloneMutation.isError
    },
  });

  const handleClone = async () => {
    await cloneMutation.mutateAsync(selectedMode);
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title="Use as Template"
      size="md"
      data-testid="dialog-overlay"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <Stack gap="md" data-testid="dialog-content">
        <Text size="sm" c="dimmed">
          Choose how you want to clone this submission:
        </Text>

        <Radio.Group value={selectedMode} onChange={(value) => setSelectedMode(value as CloneMode)}>
          <Stack gap="md">
            <Radio
              value="keep_all"
              label={
                <div>
                  <Text fw={600} size="sm">
                    Keep All Values
                  </Text>
                  <Text size="xs" c="dimmed">
                    Copy all field values. Date, time, and signature fields will be reset.
                  </Text>
                </div>
              }
            />

            <Radio
              value="structure_only"
              label={
                <div>
                  <Text fw={600} size="sm">
                    Structure Only
                  </Text>
                  <Text size="xs" c="dimmed">
                    Keep form structure but clear all field values. Useful for creating a blank
                    template.
                  </Text>
                </div>
              }
            />

            <Radio
              value="clear_all"
              label={
                <div>
                  <Text fw={600} size="sm">
                    Clear All
                  </Text>
                  <Text size="xs" c="dimmed">
                    Start completely fresh. Same template, no pre-filled values.
                  </Text>
                </div>
              }
            />
          </Stack>
        </Radio.Group>

        {cloneMutation.isError && (
          <Alert color="red" title="Clone Failed">
            {cloneMutation.error instanceof Error
              ? cloneMutation.error.message
              : 'Failed to clone submission. Please try again.'}
          </Alert>
        )}

        <Group justify="flex-end" gap="sm" mt="md">
          <Button variant="light" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleClone} loading={cloneMutation.isPending}>
            {cloneMutation.isPending ? 'Creating...' : 'Create Template'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
