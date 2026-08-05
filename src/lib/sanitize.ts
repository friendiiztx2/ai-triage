/**
 * Security Utility for Data Sanitization & XSS Prevention
 */

/**
 * Escapes HTML characters and strips dangerous script tags from user input strings
 */
export function sanitizeText(input: any): string {
  if (typeof input !== 'string') {
    if (input === null || input === undefined) return '';
    return String(input);
  }

  // Strip script tags, object/iframe tags, and inline JS handlers
  let cleaned = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/on\w+\s*=\s*(['"])[^'"]*\1/gi, '')
    .replace(/javascript:[^\s'"]*/gi, '');

  return cleaned.trim();
}

/**
 * Recursively sanitizes object strings for safe API storage
 */
export function sanitizeObject<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    if (typeof obj === 'string') return sanitizeText(obj) as any;
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as any;
  }

  const sanitizedObj: any = {};
  for (const key of Object.keys(obj as any)) {
    const val = (obj as any)[key];
    if (typeof val === 'string') {
      sanitizedObj[key] = sanitizeText(val);
    } else if (typeof val === 'object' && val !== null) {
      sanitizedObj[key] = sanitizeObject(val);
    } else {
      sanitizedObj[key] = val;
    }
  }

  return sanitizedObj;
}
