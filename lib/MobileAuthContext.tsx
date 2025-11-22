/**
 * Mobile Auth Context
 *
 * Provides authentication state management for mobile app
 * Falls back to NextAuth for web browser
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { mobileAuth, AuthUser } from './mobileAuth';
import { isNativePlatform } from './httpClient';

interface MobileAuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isMobile: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const MobileAuthContext = createContext<MobileAuthContextType | undefined>(undefined);

// Web-specific provider that uses NextAuth session
function WebAuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    console.log('[MobileAuth] Web session status:', status, 'user:', session?.user);
    setUser(session?.user as AuthUser | null);
  }, [session, status]);

  const logout = async () => {
    try {
      const { signOut } = await import('next-auth/react');
      await signOut({ redirect: false });
      setUser(null);
    } catch (error) {
      console.error('[MobileAuth] Failed to sign out from web session', error);
    }
  };

  return (
    <MobileAuthContext.Provider
      value={{
        user,
        loading: status === 'loading',
        isAuthenticated: !!user,
        isMobile: false,
        login: async () => {
          throw new Error('Use NextAuth signIn for web authentication');
        },
        register: async () => {
          throw new Error('Use API route for web registration');
        },
        logout,
        refreshUser: async () => {
          // NextAuth SessionProvider handles this automatically
        },
      }}
    >
      {children}
    </MobileAuthContext.Provider>
  );
}

// Mobile-specific provider that uses JWT storage
function MobileOnlyAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mobileAuth.getUser().then((storedUser) => {
      console.log('[MobileAuth] Mobile user loaded:', storedUser);
      setUser(storedUser);
      setLoading(false);
    });
  }, []);

  const refreshUser = async () => {
    setLoading(true);
    try {
      const storedUser = await mobileAuth.getUser();
      setUser(storedUser);
    } catch (error) {
      console.error('[MobileAuth] Failed to refresh user', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const result = await mobileAuth.login(email, password);
    if (result.error) {
      throw new Error(result.error);
    }
    if (result.user) {
      setUser(result.user);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    const result = await mobileAuth.register(name, email, password);
    if (result.error) {
      throw new Error(result.error);
    }
    if (result.user) {
      setUser(result.user);
    }
  };

  const logout = async () => {
    await mobileAuth.logout();
    setUser(null);
  };

  return (
    <MobileAuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isMobile: true,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </MobileAuthContext.Provider>
  );
}

// Main provider that delegates to platform-specific provider
export function MobileAuthProvider({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  // Check if we're in mobile platform
  useEffect(() => {
    const mobile = isNativePlatform();
    console.log('[MobileAuth] Platform check:', { mobile });
    setIsMobile(mobile);
  }, []);

  // While detecting platform, provide loading context
  if (isMobile === null) {
    return (
      <MobileAuthContext.Provider
        value={{
          user: null,
          loading: true,
          isAuthenticated: false,
          isMobile: false,
          login: async () => {},
          register: async () => {},
          logout: async () => {},
          refreshUser: async () => {},
        }}
      >
        {children}
      </MobileAuthContext.Provider>
    );
  }

  // Delegate to platform-specific provider
  if (isMobile) {
    return <MobileOnlyAuthProvider>{children}</MobileOnlyAuthProvider>;
  }

  return <WebAuthProvider>{children}</WebAuthProvider>;
}

export function useMobileAuth() {
  const context = useContext(MobileAuthContext);
  if (context === undefined) {
    throw new Error('useMobileAuth must be used within MobileAuthProvider');
  }
  return context;
}
