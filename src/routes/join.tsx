import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CoachAccessPrompt } from "@/components/coach-access-prompt";
import { BrandLockup } from "@/components/brand";
import { RolePicker } from "@/components/role-picker";
import { SessionSkeleton, useAppSession } from "@/components/session-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authEnabled } from "@/lib/auth/client";
import { completeOnboarding } from "@/lib/pbi/api";
import { clientEmailIssue, clientPasswordIssue, plainAuthError } from "@/lib/pbi/auth-errors";
import { enterApp, signUpWithEmail } from "@/lib/pbi/email-auth";
import { isRole, ROLE_COPY, type Role } from "@/lib/pbi/roles";

type JoinSearch = { role?: string };

export const Route = createFileRoute("/join")({
  validateSearch: (search: Record<string, unknown>): JoinSearch => ({
    role: typeof search.role === "string" ? search.role : undefined,
  }),
  component: Join,
});

function Join() {
  const navigate = useNavigate();
  const { user, isPending, profile } = useAppSession();
  const { role: roleParam } = Route.useSearch();
  const chosenRole: Role | null = roleParam && isRole(roleParam) ? roleParam : null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [reason, setReason] = useState("");
  const [coachReady, setCoachReady] = useState(false);

  async function handleCreate() {
    if (!chosenRole || busy) return;
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
    const normalized = email.trim().toLowerCase();
    try {
      await signUpWithEmail(normalized, password, ROLE_COPY[chosenRole].label);
      await completeOnboarding({
        data: {
          role: chosenRole,
          teamName: chosenRole === "coach" ? teamName : undefined,
          reason: chosenRole === "coach" ? reason : undefined,
        },
      });
      enterApp();
    } catch (err) {
      setError(plainAuthError(err));
      setBusy(false);
    }
  }

  if (isPending && !busy) return <SessionSkeleton />;
  if (user && profile && !busy) return <Navigate to="/" />;

  if (!chosenRole) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-white px-4 py-10 text-fg">
        <div className="mb-8">
          <BrandLockup />
        </div>
        <RolePicker
          title="What is your role?"
          subtitle="Pick one to create an account."
          onPick={(role) => {
            void navigate({ to: "/join", search: { role } });
          }}
        />
        <p className="mt-8 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary">
            Sign in
          </Link>
        </p>
      </main>
    );
  }

  const copy = ROLE_COPY[chosenRole];

  if (chosenRole === "coach" && !coachReady) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-white px-4 py-10 text-fg">
        <div className="mb-8">
          <BrandLockup />
        </div>
        <CoachAccessPrompt
          teamName={teamName}
          reason={reason}
          onTeamName={setTeamName}
          onReason={setReason}
          onContinue={() => setCoachReady(true)}
        />
        <p className="mt-6 text-center text-sm text-muted">
          <Link to="/join" search={{ role: undefined }} className="font-semibold text-primary">
            Change role
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8">
        <BrandLockup />
        <p className="mt-4 text-sm text-muted">Create a {copy.label} account</p>
      </div>
      {chosenRole === "coach" || chosenRole === "admin" ? (
        <p className="mb-4 rounded-md bg-warn-bg px-3 py-2 text-sm">
          {copy.label} tools stay off until an Admin approves. You’ll use Parent tools until then.
        </p>
      ) : null}
      {chosenRole === "coach" ? (
        <p className="mb-4 text-sm text-muted">
          Team: <span className="font-medium text-fg">{teamName}</span>
        </p>
      ) : null}
      {!authEnabled ? (
        <p className="text-muted">Sign-in is disabled.</p>
      ) : (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void handleCreate();
          }}
          className="space-y-4"
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-muted">At least 8 characters.</p>
          </div>
          {error ? (
            <p className="rounded-md bg-warn-bg px-3 py-2 text-sm font-medium" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? "Creating account…" : "Create account"}
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary">
          Sign in
        </Link>
        {" · "}
        <Link to="/join" search={{ role: undefined }} className="font-semibold text-primary">
          Change role
        </Link>
      </p>
    </main>
  );
}
