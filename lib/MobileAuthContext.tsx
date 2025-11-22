/**
 * Mobile Auth Context
 * 
 * Provides authentication state management for mobile app
 * Falls back to NextAuth for web browser
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

export function MobileAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check platform and hydrate auth state
  useEffect(() => {
    const checkMobile = () => {
      const mobile = isNativePlatform();
      setIsMobile(mobile);
      return mobile;
    };

    const mobile = checkMobile();
    let isActive = true;
    let cleanup: (() => void) | undefined;

    // Load user from storage (mobile or web)
    if (mobile) {
      mobileAuth.getUser().then((storedUser) => {
        if (!isActive) return;
        setUser(storedUser);
        setLoading(false);
      });
    } else {
      // Web: sync with NextAuth session so dashboard knows the user is authenticated
      const syncSession = async () => {
        try {
          const { getSession } = await import('next-auth/react');
          const session = await getSession();
          if (!isActive) return;
          setUser(session?.user as AuthUser | null);
        } catch (error) {
          console.error('[MobileAuth] Failed to load web session', error);
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };

      syncSession();

      // Keep session fresh on focus/storage changes
      const handleVisibility = () => {
        if (document.visibilityState === 'visible') {
          syncSession();
        }
      };

      window.addEventListener('focus', syncSession);
      window.addEventListener('visibilitychange', handleVisibility);
      window.addEventListener('storage', syncSession);

      cleanup = () => {
        window.removeEventListener('focus', syncSession);
        window.removeEventListener('visibilitychange', handleVisibility);
        window.removeEventListener('storage', syncSession);
      };
    }

    return () => {
      isActive = false;
      cleanup?.();
    };
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
    if (isMobile) {
      await mobileAuth.logout();
      setUser(null);
      return;
    }

    // Web: also clear NextAuth session if present
    try {
      const { signOut } = await import('next-auth/react');
      await signOut({ redirect: false });
    } catch (error) {
      console.error('[MobileAuth] Failed to sign out from web session', error);
    } finally {
      setUser(null);
    }
  };

  return (
    <MobileAuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isMobile,
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

export function useMobileAuth() {
  const context = useContext(MobileAuthContext);
  if (context === undefined) {
    throw new Error('useMobileAuth must be used within MobileAuthProvider');
  }
  return context;
}
