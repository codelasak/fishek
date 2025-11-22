/**
 * Unified HTTP Client
 * 
 * Uses CapacitorHttp for native mobile requests (more reliable, better CORS handling)
 * Falls back to standard fetch for web requests
 */

import { CapacitorHttp, HttpResponse, HttpOptions } from '@capacitor/core';
import { Capacitor } from '@capacitor/core';

/**
 * Check if running in native Capacitor environment
 */
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

export interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  credentials?: RequestCredentials;
}

export interface Response<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
  ok: boolean;
}

/**
 * Unified HTTP request function
 * Uses CapacitorHttp on native platforms, fetch on web
 */
export async function httpRequest<T = any>(options: RequestOptions): Promise<Response<T>> {
  const { url, method = 'GET', headers = {}, body, credentials } = options;

  // Use CapacitorHttp for native platforms (iOS/Android)
  if (isNativePlatform()) {
    try {
      const httpOptions: HttpOptions = {
        url,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        ...(body && { data: body }),
        // Increase timeouts for slower connections
        readTimeout: 30000,
        connectTimeout: 30000,
      };

      console.log(`[httpClient] Native request to: ${url}`);
      console.log(`[httpClient] Request headers:`, httpOptions.headers);
      
      const response: HttpResponse = await CapacitorHttp.request(httpOptions);

      console.log(`[httpClient] Native response status: ${response.status}`);

      return {
        data: response.data,
        status: response.status,
        headers: response.headers || {},
        ok: response.status >= 200 && response.status < 300,
      };
    } catch (error) {
      console.error('[httpClient] Native request error:', error);
      // Return a failed response instead of throwing
      return {
        data: { error: error instanceof Error ? error.message : 'Network request failed' } as T,
        status: 0,
        headers: {},
        ok: false,
      };
    }
  }

  // Use standard fetch for web
  try {
    console.log(`[httpClient] Web request to: ${url}`);
    
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      ...(credentials && { credentials }),
      ...(body && { body: JSON.stringify(body) }),
    };

    const response = await fetch(url, fetchOptions);

    console.log(`[httpClient] Web response status: ${response.status}`);

    let data: any;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      data,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      ok: response.ok,
    };
  } catch (error) {
    console.error('[httpClient] Web request error:', error);
    return {
      data: { error: error instanceof Error ? error.message : 'Network request failed' } as T,
      status: 0,
      headers: {},
      ok: false,
    };
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const http = {
  get: <T = any>(url: string, headers?: Record<string, string>, credentials?: RequestCredentials): Promise<Response<T>> => {
    return httpRequest<T>({ url, method: 'GET', headers, credentials });
  },

  post: <T = any>(url: string, body: any, headers?: Record<string, string>, credentials?: RequestCredentials): Promise<Response<T>> => {
    return httpRequest<T>({ url, method: 'POST', body, headers, credentials });
  },

  put: <T = any>(url: string, body: any, headers?: Record<string, string>, credentials?: RequestCredentials): Promise<Response<T>> => {
    return httpRequest<T>({ url, method: 'PUT', body, headers, credentials });
  },

  delete: <T = any>(url: string, headers?: Record<string, string>, credentials?: RequestCredentials): Promise<Response<T>> => {
    return httpRequest<T>({ url, method: 'DELETE', headers, credentials });
  },

  patch: <T = any>(url: string, body: any, headers?: Record<string, string>, credentials?: RequestCredentials): Promise<Response<T>> => {
    return httpRequest<T>({ url, method: 'PATCH', body, headers, credentials });
  },
};
