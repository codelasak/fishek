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
  const { data: session, status } = useSession();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if running in Capacitor
  useEffect(() => {
    const checkMobile = () => {
      const mobile = typeof window !== 'undefined' && 
                     window.location.protocol === 'capacitor:';
      setIsMobile(mobile);
      return mobile;
    };

    const mobile = checkMobile();

    // Load user from storage if mobile
    if (mobile) {
      mobileAuth.getUser().then((storedUser) => {
        setUser(storedUser);
        setLoading(false);
      });
    } else {
      // Web: use NextAuth session
      if (status !== 'loading') {
        if (session?.user) {
          setUser({
            id: session.user.id as string,
            email: session.user.email as string,
            name: session.user.name as string,
          });
        }
        setLoading(false);
      }
    }
  }, [session, status]);

  const login = async (email: string, password: string) => {
    try {
      const user = await mobileAuth.login(email, password);
      setUser(user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const user = await mobileAuth.register(email, password, name);
      setUser(user);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
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
