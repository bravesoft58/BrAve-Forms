import { useState, useCallback } from 'react';

interface QueueItem {
  id: string;
  type: string;
  payload: any;
  priority: 'high' | 'medium' | 'low';
  retryCount: number;
  maxRetries: number;
  timestamp: Date;
}

interface OfflineQueueHook {
  queueSize: number;
  isProcessing: boolean;
  addToQueue: (item: Omit<QueueItem, 'id'>) => Promise<void>;
  retryFailedItems: () => Promise<void>;
  clearQueue: () => void;
}

export function useOfflineQueue(): OfflineQueueHook {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addToQueue = useCallback(async (item: Omit<QueueItem, 'id'>) => {
    const queueItem: QueueItem = {
      ...item,
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    setQueue(prev => [...prev, queueItem]);
  }, []);

  const retryFailedItems = useCallback(async () => {
    setIsProcessing(true);
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsProcessing(false);
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  return {
    queueSize: queue.length,
    isProcessing,
    addToQueue,
    retryFailedItems,
    clearQueue,
  };
}