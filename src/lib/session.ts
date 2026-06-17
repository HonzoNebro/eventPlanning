const ACCESS_COOKIE = 'event_access';
const ADMIN_COOKIE = 'event_admin';

interface AccessSession {
  groupId: string;
  participantId?: string;
  issuedAt: number;
}

async function hmac(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function encodeBase64Url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return atob(padded);
}

export async function signSession(secret: string, session: AccessSession): Promise<string> {
  const payload = encodeBase64Url(JSON.stringify(session));
  return `${payload}.${await hmac(secret, payload)}`;
}

export async function readSession(secret: string, value: string | undefined): Promise<AccessSession | null> {
  if (!value) return null;
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return null;
  if ((await hmac(secret, payload)) !== signature) return null;
  try {
    return JSON.parse(decodeBase64Url(payload)) as AccessSession;
  } catch {
    return null;
  }
}

export function accessCookieName(): string {
  return ACCESS_COOKIE;
}

export function adminCookieName(): string {
  return ADMIN_COOKIE;
}

export function defaultSecret(platform: App.Platform | undefined): string {
  return platform?.env.SESSION_SECRET || 'local-dev-secret-change-me';
}
