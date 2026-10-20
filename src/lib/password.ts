/**
 * Password Security Utility
 * Provides secure bcrypt hashing, password verification, and automatic hash migration.
 */
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Checks if a stored password string is already a valid bcrypt hash
 */
export function isBcryptHash(val: string): boolean {
  if (!val || typeof val !== 'string') return false;
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(val);
}

/**
 * Hashes a plaintext password using bcrypt with 10 salt rounds
 */
export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(plainText, salt);
}

/**
 * Verifies a plaintext password against a stored string (bcrypt hash or legacy plaintext).
 * Also returns `needsRehash: true` if the stored password was legacy plaintext and should be upgraded.
 */
export async function verifyPassword(
  plainText: string,
  storedValue: string | null | undefined
): Promise<{ valid: boolean; needsRehash: boolean }> {
  if (!plainText || !storedValue) {
    return { valid: false, needsRehash: false };
  }

  const trimmedPlain = plainText.trim();
  const trimmedStored = storedValue.trim();

  // If already a bcrypt hash, compare using bcrypt
  if (isBcryptHash(trimmedStored)) {
    const isMatch = await bcrypt.compare(trimmedPlain, trimmedStored);
    return { valid: isMatch, needsRehash: false };
  }

  // Legacy plaintext match
  const isMatch = trimmedPlain === trimmedStored;
  return {
    valid: isMatch,
    needsRehash: isMatch, // If it matched as legacy plaintext, flag for auto-migration
  };
}
