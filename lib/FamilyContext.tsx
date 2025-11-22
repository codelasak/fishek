'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { familiesApi } from '@/services/apiClient';

export type FamilyMode = 'personal' | 'family';

export interface FamilyInfo {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  createdAt: string;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

interface FamilyContextType {
  mode: FamilyMode;
  activeFamily: FamilyInfo | null;
  families: FamilyInfo[];
  isLoading: boolean;
  setMode: (mode: FamilyMode) => void;
  setActiveFamily: (family: FamilyInfo | null) => void;
  refreshFamilies: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<FamilyMode>('personal');
  const [activeFamily, setActiveFamilyState] = useState<FamilyInfo | null>(null);
  const [families, setFamilies] = useState<FamilyInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load families on mount
  useEffect(() => {
    loadFamilies();
  }, []);

  // Load saved mode and active family from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedMode = localStorage.getItem('fishek_family_mode') as FamilyMode;
    const savedFamilyId = localStorage.getItem('fishek_active_family_id');

    if (savedMode) {
      setModeState(savedMode);
    }

    if (savedMode === 'family' && savedFamilyId && families.length > 0) {
      const family = families.find((f) => f.id === savedFamilyId);
      if (family) {
        setActiveFamilyState(family);
      } else {
        // Family not found, reset to personal
        setModeState('personal');
        setActiveFamilyState(null);
      }
    }
  }, [families]);

  const loadFamilies = async () => {
    try {
      setIsLoading(true);
      const data = await familiesApi.getAll();
      setFamilies(data.families || []);
    } catch (error) {
      console.error('Error loading families:', error);
      setFamilies([]);
    } finally {
      setIsLoading(false);
    }
  };

  const setMode = (newMode: FamilyMode) => {
    setModeState(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fishek_family_mode', newMode);
    }

    if (newMode === 'personal') {
      setActiveFamilyState(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fishek_active_family_id');
      }
    }
  };

  const setActiveFamily = (family: FamilyInfo | null) => {
    setActiveFamilyState(family);
    if (typeof window === 'undefined') return;
    
    if (family) {
      setModeState('family');
      localStorage.setItem('fishek_family_mode', 'family');
      localStorage.setItem('fishek_active_family_id', family.id);
    } else {
      setModeState('personal');
      localStorage.setItem('fishek_family_mode', 'personal');
      localStorage.removeItem('fishek_active_family_id');
    }
  };

  const refreshFamilies = async () => {
    await loadFamilies();
  };

  return (
    <FamilyContext.Provider
      value={{
        mode,
        activeFamily,
        families,
        isLoading,
        setMode,
        setActiveFamily,
        refreshFamilies,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  const context = useContext(FamilyContext);
  if (context === undefined) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
}
