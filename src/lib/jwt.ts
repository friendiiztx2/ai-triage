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

const DEFAULT_SECRET = 'sift-ai-fallback-secure-signing-key-32ch-min!';
const SIGNING_SECRET = process.env.SESSION_SECRET || DEFAULT_SECRET;

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

let cachedKey: CryptoKey | null = null;
async function getCryptoKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  cachedKey = await crypto.subtle.importKey(
    'raw',
    strToUint8(SIGNING_SECRET) as any,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  return cachedKey;
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

  const key = await getCryptoKey();
  const signature = await crypto.subtle.sign('HMAC', key, strToUint8(dataPart) as any);
  const sigPart = bufToBase64Url(signature);

  return `${dataPart}.${sigPart}`;
}

/**
 * Verifies a token's HMAC signature and checks expiration.
 * Returns the verified payload or null if invalid/tampered/expired.
 */
export async function verifyAuthToken(token: string | undefined | null): Promise<AuthTokenPayload | null> {
  if (!token || typeof token !== 'string') return null;

  const parts = token.trim().split('.');
  if (parts.length !== 2) return null;

  const [dataPart, sigPart] = parts;

  try {
    const key = await getCryptoKey();
    const sigBytes = base64UrlToBuf(sigPart);
    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes as any, strToUint8(dataPart) as any);

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
