/**
 * Mobile Authentication Service
 * 
 * Handles JWT-based authentication for Capacitor mobile apps
 * Works with NextAuth backend but manages tokens locally
 */

import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthTokens {
  accessToken: string;
  user: AuthUser;
}

class MobileAuthService {
  /**
   * Check if code is running in Capacitor (mobile) environment
   */
  private isMobile(): boolean {
    return typeof window !== 'undefined' && 
           window.location.protocol === 'capacitor:';
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<{ user?: AuthUser; error?: string }> {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const url = `${apiBase}/api/auth/mobile`;
      
      console.log('[MobileAuth] Attempting login to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      console.log('[MobileAuth] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[MobileAuth] Error response:', errorText);
        try {
          const errorJson = JSON.parse(errorText);
          return { error: errorJson.error || 'Login failed' };
        } catch {
          return { error: `Login failed: ${response.status}` };
        }
      }

      const data: AuthTokens = await response.json();
      
      // Store token and user data
      await Preferences.set({ key: TOKEN_KEY, value: data.accessToken });
      await Preferences.set({ key: USER_KEY, value: JSON.stringify(data.user) });
      
      console.log('[MobileAuth] Login successful');
      return { user: data.user };
    } catch (error) {
      console.error('[MobileAuth] Login error:', error);
      return { error: `Network error: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  }

  /**
   * Register new user
   */
  async register(name: string, email: string, password: string): Promise<{ user?: AuthUser; error?: string }> {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      
      // First register the user
      const registerResponse = await fetch(`${apiBase}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      if (!registerResponse.ok) {
        const error = await registerResponse.json().catch(() => ({ error: 'Registration failed' }));
        return { error: error.error || 'Registration failed' };
      }

      // Then login to get token
      return await this.login(email, password);
    } catch (error) {
      console.error('[MobileAuth] Register error:', error);
      return { error: 'Network error' };
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    if (this.isMobile()) {
      await Preferences.remove({ key: TOKEN_KEY });
      await Preferences.remove({ key: USER_KEY });
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }

  /**
   * Get stored auth token
   */
  async getToken(): Promise<string | null> {
    if (this.isMobile()) {
      const { value } = await Preferences.get({ key: TOKEN_KEY });
      return value;
    } else {
      return localStorage.getItem(TOKEN_KEY);
    }
  }

  /**
   * Get stored user data
   */
  async getUser(): Promise<AuthUser | null> {
    if (this.isMobile()) {
      const { value } = await Preferences.get({ key: USER_KEY });
      return value ? JSON.parse(value) : null;
    } else {
      const userStr = localStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  /**
   * Get authorization header for API requests
   */
  async getAuthHeader(): Promise<Record<string, string>> {
    const token = await this.getToken();
    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
      };
    }
    return {};
  }
}

export const mobileAuth = new MobileAuthService();
