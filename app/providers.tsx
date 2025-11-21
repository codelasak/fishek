'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { FamilyProvider } from '@/lib/FamilyContext';
import { MobileAuthProvider } from '@/lib/MobileAuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MobileAuthProvider>
        <FamilyProvider>{children}</FamilyProvider>
      </MobileAuthProvider>
    </SessionProvider>
  );
}
