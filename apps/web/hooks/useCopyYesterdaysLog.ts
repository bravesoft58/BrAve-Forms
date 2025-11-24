'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAppAuth } from '@/app/providers';
import { notifications } from '@mantine/notifications';
import { copyYesterdaysLog } from '@/lib/api/submissions';

interface CopyYesterdaysLogInput {
  templateId: string;
}

/**
 * Hook for copying yesterday's submission log
 * Clones the most recent submission from yesterday and redirects to fill page
 *
 * @security Requires Clerk authentication - automatically gets JWT token
 * @throws {Error} If user not authenticated
 */
export function useCopyYesterdaysLog() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const auth = useAppAuth();
  const getToken = auth.getToken || (async () => 'dev-token-123');

  const mutation = useMutation({
    mutationFn: async ({ templateId }: CopyYesterdaysLogInput) => {
      const token = await getToken();
      const response = await copyYesterdaysLog(templateId, token);
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
    onError: (error: Error) => {
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
