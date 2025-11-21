'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { FamilyProvider } from '@/lib/FamilyContext';
import { MobileAuthProvider } from '@/lib/MobileAuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
  // Check if running in Capacitor
  const isMobile = typeof window !== 'undefined' && window.location.protocol === 'capacitor:';

  // Don't use SessionProvider in Capacitor to avoid AuthError
  if (isMobile) {
    return (
      <MobileAuthProvider>
        <FamilyProvider>{children}</FamilyProvider>
      </MobileAuthProvider>
    );
  }

  // Web: Use SessionProvider + MobileAuthProvider (for compatibility)
  return (
    <SessionProvider>
      <MobileAuthProvider>
        <FamilyProvider>{children}</FamilyProvider>
      </MobileAuthProvider>
    </SessionProvider>
  );
}
