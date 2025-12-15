import * as crypto from 'crypto';

/**
 * Generate a secure random password with uppercase, lowercase, numbers and special characters
 * @param length - Length of the password (default: 12)
 * @returns Random secure password string
 */
export function generateRandomPassword(length = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialChars = '!@#$%^&*';
  const allChars = uppercase + lowercase + numbers + specialChars;

  // Ensure at least one of each type
  let password = '';
  password += uppercase[crypto.randomInt(0, uppercase.length)];
  password += lowercase[crypto.randomInt(0, lowercase.length)];
  password += numbers[crypto.randomInt(0, numbers.length)];
  password += specialChars[crypto.randomInt(0, specialChars.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(0, allChars.length)];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => crypto.randomInt(0, 3) - 1)
    .join('');
}
