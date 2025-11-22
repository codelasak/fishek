import { Transaction, Category } from '../types';
import { mobileAuth } from '@/lib/mobileAuth';

// Use environment variable for API base URL
// In development: always uses relative /api (same server)
// In production mobile (Capacitor): uses deployed backend URL from NEXT_PUBLIC_API_URL
const getApiBase = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

  // Capacitor: always prefer configured backend (relative URLs break under capacitor://)
  if (typeof window !== 'undefined' && window.location.protocol === 'capacitor:') {
    if (apiUrl) return `${apiUrl}/api`;
    // Fallback to production backend to avoid capacitor://localhost fetch failures
    console.warn('[apiClient] NEXT_PUBLIC_API_URL missing; falling back to production backend URL');
    return 'https://fishek.coolify.fennaver.tech/api';
  }

  // Server-side: always use relative path
  if (typeof window === 'undefined') return '/api';
  
  // Client-side in development: use relative path
  // Client-side in production mobile: use NEXT_PUBLIC_API_URL if set
  // Only use NEXT_PUBLIC_API_URL if it's explicitly set and we're not on localhost
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname.includes('192.168.');
  
  // If running on localhost, always use relative API
  if (isLocalhost) return '/api';
  
  // Otherwise, use configured URL or relative path
  return apiUrl ? `${apiUrl}/api` : '/api';
};

const API_BASE = getApiBase();

/**
 * Check if running in Capacitor mobile environment
 */
const isMobile = () => {
  return typeof window !== 'undefined' && 
         window.location.protocol === 'capacitor:';
};

/**
 * Get headers with authentication token for mobile
 */
const getHeaders = async (additionalHeaders: Record<string, string> = {}) => {
  const baseHeaders = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };

  // In mobile, add Bearer token
  if (isMobile()) {
    const authHeader = await mobileAuth.getAuthHeader();
    return { ...baseHeaders, ...authHeader };
  }

  // In web, cookies handle auth automatically
  return baseHeaders;
};

// Transactions API
export const transactionsApi = {
  getAll: async (): Promise<Transaction[]> => {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE}/transactions`, { 
      headers,
      credentials: isMobile() ? 'omit' : 'include', 
    });
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },

  getById: async (id: string): Promise<Transaction | null> => {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      headers,
      credentials: isMobile() ? 'omit' : 'include',
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch transaction');
    return res.json();
  },

  create: async (transaction: Transaction): Promise<void> => {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers,
      credentials: isMobile() ? 'omit' : 'include',
      body: JSON.stringify(transaction),
    });
    if (!res.ok) throw new Error('Failed to create transaction');
  },

  delete: async (id: string): Promise<void> => {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'DELETE',
      headers,
      credentials: isMobile() ? 'omit' : 'include',
    });
    if (!res.ok) throw new Error('Failed to delete transaction');
  },
};

// Categories API
export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE}/categories`, {
      headers,
      credentials: isMobile() ? 'omit' : 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  create: async (category: Omit<Category, 'id' | 'currentSpent'>): Promise<Category> => {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers,
      credentials: isMobile() ? 'omit' : 'include',
      body: JSON.stringify(category),
    });
    if (!res.ok) throw new Error('Failed to create category');
    return res.json();
  },

  update: async (category: Category): Promise<void> => {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE}/categories/${category.id}`, {
      method: 'PUT',
      headers,
      credentials: isMobile() ? 'omit' : 'include',
      body: JSON.stringify(category),
    });
    if (!res.ok) throw new Error('Failed to update category');
  },

  delete: async (id: string): Promise<void> => {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
      headers,
      credentials: isMobile() ? 'omit' : 'include',
    });
    if (!res.ok) throw new Error('Failed to delete category');
  },
};

// Stats API
export const statsApi = {
  getDashboard: async () => {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE}/stats`, {
      headers,
      credentials: isMobile() ? 'omit' : 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },
};
