/**
 * Generate a unique invite code for families
 * Format: XXX-XXXX-XXX (e.g., ABC-DEFG-HIJ)
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded similar chars
  const segments = [3, 4, 3]; // XXX-XXXX-XXX format

  return segments
    .map((length) => {
      return Array.from({ length }, () =>
        chars.charAt(Math.floor(Math.random() * chars.length))
      ).join('');
    })
    .join('-');
}

/**
 * Validate invite code format
 */
export function isValidInviteCode(code: string): boolean {
  return /^[A-Z2-9]{3}-[A-Z2-9]{4}-[A-Z2-9]{3}$/.test(code);
}
