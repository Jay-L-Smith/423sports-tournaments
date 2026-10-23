import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CoachAccessPrompt } from "@/components/coach-access-prompt";
import { CoachLoginNotices } from "@/components/coach-login-notices";
import { BrandLockup } from "@/components/brand";
import {
  AdminHome,
  AthleteHome,
  CoachHome,
  ParentHome,
  PendingAsParentHome,
  ScheduleLoading,
} from "@/components/homes";
import { RolePicker } from "@/components/role-picker";
import { SessionSkeleton, useAppSession } from "@/components/session-gate";
import { AppShell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { PublicLanding } from "@/components/public-landing";
import { SHOW_PUBLIC_LANDING } from "@/lib/pbi/public-landing";
import {
  completeOnboarding,
  listSeasonCards,
  listWeekends,
} from "@/lib/pbi/api";
import type { Role } from "@/lib/pbi/roles";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { sheet?: "in" | "up" } => ({
    sheet: search.sheet === "up" ? "up" : search.sheet === "in" ? "in" : undefined,
  }),
  component: Home,
});

function Home() {
  const { user, isPending, profile, refetchProfile } = useAppSession();
  const navigate = useNavigate();
  const [onboardError, setOnboardError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [coachAsk, setCoachAsk] = useState(false);
  const [adminAsk, setAdminAsk] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [adminName, setAdminName] = useState("");

  const seasonsQuery = useQuery({
    queryKey: ["season-cards"],
    queryFn: () => listSeasonCards(),
    enabled: Boolean(profile?.homeRole === "admin"),
  });
  const weekendsQuery = useQuery({
    queryKey: ["weekends"],
    queryFn: () => listWeekends(),
    enabled: Boolean(profile?.homeRole === "admin"),
  });

  if (isPending) return <SessionSkeleton />;
  if (!user) return SHOW_PUBLIC_LANDING ? <PublicLanding /> : <RedirectToSignIn />;

  if (!profile) {
    async function finish(role: Role, access?: { teamName?: string; name?: string }) {
      setBusy(true);
      setOnboardError(null);
      try {
        await completeOnboarding({
          data: {
            role,
            teamName: access?.teamName,
            name: access?.name,
          },
        });
        await refetchProfile();
      } catch (err) {
        setOnboardError(err instanceof Error ? err.message : "Could not save your role.");
        setBusy(false);
      }
    }
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-10">
        <div className="mb-8">
          <BrandLockup subtitle="One more step" />
        </div>
        {busy ? (
          <SessionSkeleton />
        ) : coachAsk ? (
          <CoachAccessPrompt
            teamName={teamName}
            onTeamName={setTeamName}
            onContinue={(access) => void finish("coach", access)}
            onBack={() => setCoachAsk(false)}
          />
        ) : adminAsk ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!adminName.trim()) {
                setOnboardError("Enter your name.");
                return;
              }
              void finish("admin", { name: adminName.trim() });
            }}
          >
            <h1 className="font-display text-4xl font-bold uppercase">Admin account</h1>
            <p className="text-sm text-muted">Your name shows on the administrator list, with your email under it.</p>
            <div className="space-y-1.5">
              <Label htmlFor="admin-name">Name</Label>
              <Input id="admin-name" autoComplete="name" value={adminName} onChange={(event) => setAdminName(event.target.value)} placeholder="Alex Rivera" />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              Continue
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setAdminAsk(false)}>
              Back
            </Button>
          </form>
        ) : (
          <RolePicker
            title="What is your role?"
            subtitle="This sets the home screen you see."
            onPick={(role) => {
              if (role === "coach") {
                setCoachAsk(true);
                return;
              }
              if (role === "admin") {
                setAdminAsk(true);
                return;
              }
              void finish(role);
            }}
          />
        )}
        {onboardError ? (
          <p className="mt-4 rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
            {onboardError}
          </p>
        ) : null}
        <Button variant="ghost" className="mt-6" onClick={() => void navigate({ to: "/login" })}>
          Use a different account
        </Button>
      </main>
    );
  }

  const pendingLabel =
    profile.requestStatus === "pending" && profile.homeRole !== "coach" && profile.homeRole !== "admin"
      ? `${profile.requestedRole === "admin" ? "Admin" : "Coach"} · waiting`
      : null;

  let body: React.ReactNode;
  if (profile.homeRole === "admin") {
    body =
      weekendsQuery.isPending || seasonsQuery.isPending ? (
        <ScheduleLoading />
      ) : (
        <AdminHome
          weekends={weekendsQuery.data ?? []}
          seasons={seasonsQuery.data?.cards ?? []}
          rollover={seasonsQuery.data?.rollover ?? null}
        />
      );
  } else if (profile.homeRole === "coach") {
    body = (
      <>
        <CoachHome />
        {profile.isSuperuser || profile.coachPreview ? null : <CoachLoginNotices />}
      </>
    );
  } else if (profile.homeRole === "athlete") {
    body = <AthleteHome />;
  } else if (profile.requestStatus === "pending") {
    body = <PendingAsParentHome profile={profile} />;
  } else {
    body = <ParentHome profile={profile} />;
  }

  return (
    <AppShell homeRole={profile.homeRole} pendingLabel={pendingLabel} contained={profile.homeRole === "coach"}>
      {body}
    </AppShell>
  );
}
