import { authClient } from "@/lib/auth/client";
import { plainAuthError } from "./auth-errors";
import { enterApp, rememberSessionToken } from "./capture-session";

type AuthResult = { data?: unknown; error?: unknown };

function captureAuthResponse(ctx: { data: unknown; response: Response }): void {
  rememberSessionToken(ctx.data, ctx.response.headers.get("set-auth-token"));
}

async function confirmSession(): Promise<void> {
  const session = await authClient.getSession();
  if (session.error || !session.data?.user) {
    throw new Error("Could not stay signed in. Try again.");
  }
}

function throwIfError(result: AuthResult): void {
  if (result.error) throw new Error(plainAuthError(result.error));
}

export { enterApp };

export async function signInWithEmail(email: string, password: string): Promise<void> {
  let captured = false;
  const result = await authClient.signIn.email({
    email,
    password,
    fetchOptions: {
      onSuccess(ctx) {
        captureAuthResponse(ctx);
        captured = true;
      },
    },
  });
  throwIfError(result);
  if (!captured) rememberSessionToken(result.data);
  await confirmSession();
}

export async function signUpWithEmail(email: string, password: string, name: string): Promise<void> {
  let captured = false;
  const result = await authClient.signUp.email({
    email,
    password,
    name,
    fetchOptions: {
      onSuccess(ctx) {
        captureAuthResponse(ctx);
        captured = true;
      },
    },
  });
  throwIfError(result);
  if (!captured) rememberSessionToken(result.data);
  await confirmSession();
}
