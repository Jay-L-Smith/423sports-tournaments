import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { SessionSkeleton } from "@/components/session-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { clientEmailIssue, clientPasswordIssue, plainAuthError } from "@/lib/pbi/auth-errors";
import { enterApp, signInWithEmail } from "@/lib/pbi/email-auth";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSignIn() {
    if (busy) return;
    const emailIssue = clientEmailIssue(email);
    if (emailIssue) {
      setError(emailIssue);
      return;
    }
    const passIssue = clientPasswordIssue(password);
    if (passIssue) {
      setError(passIssue);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signInWithEmail(email.trim().toLowerCase(), password);
      enterApp();
    } catch (err) {
      setError(plainAuthError(err));
      setBusy(false);
    }
  }

  // Keep the form mounted while we submit. Unmounting on isPending wipes the
  // fields and looks like "sign in just emptied the boxes."
  if (isPending && !busy) return <SessionSkeleton />;
  if (user && !busy) return <Navigate to="/" />;

  return (
    <main className="site-splash mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <img src="/logo.png" alt="423Sports" className="mx-auto block w-full max-w-[19rem]" />
        <p className="mt-6 text-sm text-white/60">Email and password</p>
      </div>
      {!authEnabled ? (
        <p className="text-muted">Sign-in is disabled.</p>
      ) : (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void handleSignIn();
          }}
          className="space-y-4 [&_label]:text-white"
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="text"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? (
            <p
              className="rounded-md border border-[#6b5420] bg-[#ffe08a] px-3 py-2 text-sm font-semibold text-[#1a1a1a]"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          <Button type="submit" className="site-cta w-full" size="lg" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-white/70">
        New here?{" "}
        <Link to="/join" className="font-semibold text-white">
          Create an account
        </Link>
      </p>
      <p className="mt-4 text-center text-xs text-white/50">
        The director Admin account is already set up. Sign in — don’t create it again.
      </p>
    </main>
  );
}
