import { neon, NeonQueryFunction } from '@neondatabase/serverless';

// Get database URL from environment
const getDatabaseUrl = (): string => {
  // Try different environment variable access methods
  const url = (typeof process !== 'undefined' && process.env?.DATABASE_URL) || '';

  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  return url;
};

// Create a SQL client instance
export const sql: NeonQueryFunction<boolean, boolean> = neon(getDatabaseUrl());
