'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { FamilyProvider } from '@/lib/FamilyContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <FamilyProvider>{children}</FamilyProvider>
    </SessionProvider>
  );
}
