import { createFileRoute, Navigate } from "@tanstack/react-router";
import { SessionSkeleton, useAppSession } from "@/components/session-gate";
import { AppShell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { UserButton, RedirectToSignIn } from "@/lib/auth/gates";
import { ROLE_COPY } from "@/lib/pbi/roles";

export const Route = createFileRoute("/account")({ component: AccountPage });

function AccountPage() {
  const { user, isPending, profile } = useAppSession();

  if (isPending) return <SessionSkeleton />;
  if (!user) return <RedirectToSignIn />;
  if (!profile) return <Navigate to="/" />;

  const pendingLabel =
    profile.requestStatus === "pending"
      ? `${profile.requestedRole === "admin" ? "Admin" : "Coach"} · waiting`
      : null;

  return (
    <AppShell homeRole={profile.homeRole} pendingLabel={pendingLabel}>
      <h1 className="font-display text-4xl font-bold uppercase">Account</h1>
      <div className="mt-5 space-y-4 rounded-lg border border-line bg-surface p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Email</p>
          <p className="mt-1 font-medium">{profile.email || user.primaryEmail || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Home</p>
          <p className="mt-1 font-medium">{ROLE_COPY[profile.homeRole].label}</p>
        </div>
        {profile.requestStatus !== "none" ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Requested</p>
            <p className="mt-1 font-medium">
              {ROLE_COPY[profile.requestedRole].label} · {profile.requestStatus}
            </p>
          </div>
        ) : null}
        <div className="border-t border-line pt-4">
          <UserButton />
        </div>
      </div>
      <p className="mt-4 text-sm text-muted">
        Tournament tools (rosters, brackets, scores) are not in this first slice.
      </p>
      <Button variant="ghost" className="mt-2 px-0 text-muted" disabled>
        More settings coming soon
      </Button>
    </AppShell>
  );
}
