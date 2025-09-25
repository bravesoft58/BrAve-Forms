import React, { ReactNode, useEffect } from 'react';

interface CapacitorProviderProps {
  children: ReactNode;
}

export function CapacitorProvider({ children }: CapacitorProviderProps) {
  useEffect(() => {
    // Capacitor platform detection and initialization
    console.log('Capacitor provider initialized');
  }, []);

  return <>{children}</>;
}