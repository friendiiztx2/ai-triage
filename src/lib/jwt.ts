/**
 * Cryptographic Token Engine (Edge & Node.js Compatible)
 * Uses Web Crypto HMAC-SHA256 for secure session signing and verification.
 */

export interface AuthTokenPayload {
  id: string;
  email: string;
  name: string;
  role: 'system_admin' | 'super_admin' | 'admin' | 'staff' | string;
  company_id: string | null;
  company_name?: string | null;
  permissions?: string[];
  iat: number;
  exp: number; // Expiration timestamp in seconds
}

/**
 * SECURITY: Tokens are signed and verified ONLY with SESSION_SECRET from the environment.
 * Public or hard-coded values (Supabase anon keys, in-source defaults) must never be used,
 * because anyone who knows them could forge an admin token.
 *
 * - Production: SESSION_SECRET is required (min 32 chars). Without it, login fails and
 *   every token is rejected.
 * - Local development only (NODE_ENV !== 'production'): a fixed dev-only secret is used
 *   so `npm run dev` keeps working. It is never accepted in production builds.
 */
const DEV_ONLY_SECRET = 'sift-ai-local-development-only-secret-do-not-use-in-prod';
const MIN_SECRET_LENGTH = 32;
const isProduction = process.env.NODE_ENV === 'production';

function resolveSigningSecret(): string | null {
  const envSecret = process.env.SESSION_SECRET?.trim();
  if (envSecret && envSecret.length >= MIN_SECRET_LENGTH) return envSecret;

  if (envSecret) {
    console.error(`[Security] SESSION_SECRET must be at least ${MIN_SECRET_LENGTH} characters.`);
  }
  if (isProduction) {
    console.error('[Security] SESSION_SECRET is missing or too short. All sessions will be rejected.');
    return null;
  }

  console.warn('[Security] SESSION_SECRET not set — using a dev-only secret. Set it in .env.local.');
  return DEV_ONLY_SECRET;
}

const SIGNING_SECRET = resolveSigningSecret();

function strToUint8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function uint8ToStr(buf: Uint8Array): string {
  return new TextDecoder().decode(buf);
}

function bufToBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlToBuf(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

const keyCache = new Map<string, CryptoKey>();
async function getCryptoKeyForSecret(secret: string): Promise<CryptoKey> {
  const existing = keyCache.get(secret);
  if (existing) return existing;
  const imported = await crypto.subtle.importKey(
    'raw',
    strToUint8(secret) as any,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  keyCache.set(secret, imported);
  return imported;
}

/**
 * Creates a signed JWT-like HMAC token (valid for 7 days by default)
 */
export async function createAuthToken(
  user: Omit<AuthTokenPayload, 'iat' | 'exp'>,
  expiresInSeconds: number = 7 * 24 * 60 * 60 // 7 days
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: AuthTokenPayload = {
    ...user,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const payloadStr = JSON.stringify(payload);
  const dataPart = bufToBase64Url(strToUint8(payloadStr).buffer as ArrayBuffer);

  if (!SIGNING_SECRET) {
    throw new Error('Server misconfigured: SESSION_SECRET is not set');
  }
  const key = await getCryptoKeyForSecret(SIGNING_SECRET);
  const signature = await crypto.subtle.sign('HMAC', key, strToUint8(dataPart) as any);
  const sigPart = bufToBase64Url(signature);

  return `${dataPart}.${sigPart}`;
}

/**
 * Verifies a token's HMAC signature against SESSION_SECRET and checks expiration.
 * Returns the verified payload or null if invalid/tampered/expired.
 */
export async function verifyAuthToken(token: string | undefined | null): Promise<AuthTokenPayload | null> {
  if (!token || typeof token !== 'string') return null;
  if (!SIGNING_SECRET) return null;

  const parts = token.trim().split('.');
  if (parts.length !== 2) return null;

  const [dataPart, sigPart] = parts;

  try {
    const sigBytes = base64UrlToBuf(sigPart);
    const dataBytes = strToUint8(dataPart);

    const key = await getCryptoKeyForSecret(SIGNING_SECRET);
    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes as any, dataBytes as any);

    if (!isValid) {
      return null;
    }

    const jsonStr = uint8ToStr(base64UrlToBuf(dataPart));
    const payload = JSON.parse(jsonStr) as AuthTokenPayload;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now > payload.exp) {
      return null; // Expired
    }

    return payload;
  } catch (err) {
    return null;
  }
}
