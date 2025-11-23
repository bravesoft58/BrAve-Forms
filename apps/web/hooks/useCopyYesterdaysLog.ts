'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { copyYesterdaysLog } from '@/lib/api/submissions';

interface CopyYesterdaysLogInput {
  templateId: string;
}

/**
 * Hook for copying yesterday's submission log
 * Clones the most recent submission from yesterday and redirects to fill page
 */
export function useCopyYesterdaysLog() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ templateId }: CopyYesterdaysLogInput) => {
      const response = await copyYesterdaysLog(templateId);
      return response;
    },
    onSuccess: (data) => {
      // Invalidate submissions list
      queryClient.invalidateQueries({ queryKey: ['submissions'] });

      notifications.show({
        title: "Yesterday's log copied!",
        message: 'Continue filling from where you left off',
        color: 'green',
      });

      // Redirect to fill page with draft ID
      router.push(`/dashboard/forms/${data.templateId}/fill?draftId=${data.id}`);
    },
    onError: (error: any) => {
      const errorMessage = error.message?.toLowerCase() || '';
      if (errorMessage.includes('not found') || errorMessage.includes('no submission found')) {
        notifications.show({
          title: 'No submission found for yesterday',
          message: 'Start a new form instead',
          color: 'yellow',
        });
      } else {
        notifications.show({
          title: "Failed to copy yesterday's log",
          message: error.message || 'Please try again',
          color: 'red',
        });
      }
    },
  });

  return mutation;
}
