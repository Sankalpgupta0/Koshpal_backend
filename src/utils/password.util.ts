/**
 * Generate a random password
 * @param length - Length of the password (default: 10)
 * @returns Random password string
 */
export function generateRandomPassword(length = 10): string {
  return Math.random().toString(36).slice(-length);
}
