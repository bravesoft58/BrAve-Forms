import React, { ReactNode } from 'react';

interface MobileStoreProviderProps {
  children: ReactNode;
}

export function MobileStoreProvider({ children }: MobileStoreProviderProps) {
  return <>{children}</>;
}