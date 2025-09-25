import React, { ReactNode } from 'react';

interface OfflineProviderProps {
  children: ReactNode;
}

export function OfflineProvider({ children }: OfflineProviderProps) {
  return <>{children}</>;
}