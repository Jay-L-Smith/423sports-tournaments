/** Same key the auth client uses for live-preview bearer tokens. */
export const BEARER_KEY = "grok-auth.bearer-token";

function decodeToken(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function asToken(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return decodeToken(trimmed);
}

function tokenFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const rec = payload as {
    token?: unknown;
    session?: { token?: unknown };
    data?: { token?: unknown; session?: { token?: unknown } };
  };
  return (
    asToken(rec.token) ??
    asToken(rec.session?.token) ??
    asToken(rec.data?.token) ??
    asToken(rec.data?.session?.token)
  );
}

/**
 * Prefer the signed `set-auth-token` header (cookie value with HMAC) over the
 * unsigned JSON `token` field. Either works with the bearer plugin, but the
 * header matches what the OAuth popup stores.
 */
export function extractSessionToken(payload: unknown, headerToken?: string | null): string | null {
  const header = asToken(headerToken);
  const body = tokenFromPayload(payload);
  if (header?.includes(".")) return header;
  if (body?.includes(".")) return body;
  return header ?? body;
}

/**
 * Email sign-up/sign-in returns a session token. In the live preview iframe
 * cookies are partitioned, so we stash the token the same way OAuth popup does.
 */
export function rememberSessionToken(payload: unknown, headerToken?: string | null): string {
  const token = extractSessionToken(payload, headerToken);
  if (!token) throw new Error("Could not stay signed in. Try again.");
  if (typeof window === "undefined") return token;
  try {
    window.sessionStorage.setItem(BEARER_KEY, token);
    if (window.sessionStorage.getItem(BEARER_KEY) !== token) {
      throw new Error("This browser blocked keeping you signed in. Try again.");
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("This browser blocked")) throw err;
    throw new Error("This browser blocked keeping you signed in. Try again.");
  }
  return token;
}

/** Full load so Better Auth's session store boots with the bearer already saved. */
export function enterApp(): void {
  if (typeof window === "undefined") return;
  window.location.replace("/");
}
