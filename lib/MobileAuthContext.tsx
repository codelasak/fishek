/**
 * Mobile Auth Context
 * 
 * Provides authentication state management for mobile app
 * Falls back to NextAuth for web browser
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { mobileAuth, AuthUser } from './mobileAuth';

interface MobileAuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isMobile: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const MobileAuthContext = createContext<MobileAuthContextType | undefined>(undefined);

export function MobileAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if running in Capacitor and load user
  useEffect(() => {
    const checkMobile = () => {
      const mobile = typeof window !== 'undefined' && 
                     window.location.protocol === 'capacitor:';
      setIsMobile(mobile);
      return mobile;
    };

    const mobile = checkMobile();

    // Load user from storage (mobile or web)
    if (mobile) {
      mobileAuth.getUser().then((storedUser) => {
        setUser(storedUser);
        setLoading(false);
      });
    } else {
      // For web, we'll import and use NextAuth dynamically
      import('next-auth/react').then(({ useSession: _useSession }) => {
        // Web authentication still uses NextAuth
        // This will be handled by the SessionProvider wrapper
        setLoading(false);
      });
    }
  }, []);

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
        isMobile,
        login,
        register,
        logout,
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
