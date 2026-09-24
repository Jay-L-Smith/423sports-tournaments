import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CoachAccessPrompt } from "@/components/coach-access-prompt";
import { BrandLockup } from "@/components/brand";
import {
  AdminHome,
  AthleteHome,
  CoachHome,
  ParentHome,
  PendingAsParentHome,
} from "@/components/homes";
import { RolePicker } from "@/components/role-picker";
import { SessionSkeleton, useAppSession } from "@/components/session-gate";
import { AppShell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { RedirectToSignIn } from "@/lib/auth/gates";
import {
  completeOnboarding,
  listDirectory,
  listMyTeams,
  listWeekends,
} from "@/lib/pbi/api";
import type { Role } from "@/lib/pbi/roles";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { user, isPending, profile, refetchProfile } = useAppSession();
  const navigate = useNavigate();
  const [onboardError, setOnboardError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [coachAsk, setCoachAsk] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [reason, setReason] = useState("");

  const directoryQuery = useQuery({
    queryKey: ["directory"],
    queryFn: () => listDirectory(),
    enabled: Boolean(profile?.homeRole === "admin"),
  });
  const weekendsQuery = useQuery({
    queryKey: ["weekends"],
    queryFn: () => listWeekends(),
    enabled: Boolean(profile?.homeRole === "admin"),
  });
  const myTeamsQuery = useQuery({
    queryKey: ["my-teams"],
    queryFn: () => listMyTeams(),
    enabled: Boolean(profile?.homeRole === "coach"),
  });

  if (isPending) return <SessionSkeleton />;
  if (!user) return <RedirectToSignIn />;

  if (!profile) {
    async function finish(role: Role, access?: { teamName: string; reason: string }) {
      setBusy(true);
      setOnboardError(null);
      try {
        await completeOnboarding({
          data: {
            role,
            teamName: access?.teamName,
            reason: access?.reason,
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
            reason={reason}
            onTeamName={setTeamName}
            onReason={setReason}
            onContinue={(access) => void finish("coach", access)}
            onBack={() => setCoachAsk(false)}
          />
        ) : (
          <RolePicker
            title="What is your role?"
            subtitle="This sets the home screen you see."
            onPick={(role) => {
              if (role === "coach") {
                setCoachAsk(true);
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
    profile.requestStatus === "pending"
      ? `${profile.requestedRole === "admin" ? "Admin" : "Coach"} · waiting`
      : null;

  let body: React.ReactNode;
  if (profile.homeRole === "admin") {
    body = (
      <AdminHome
        users={directoryQuery.data ?? []}
        weekends={weekendsQuery.data ?? []}
      />
    );
  } else if (profile.homeRole === "coach") {
    body = (
      <CoachHome
        teamCount={myTeamsQuery.data?.length ?? 0}
        pendingCount={(myTeamsQuery.data ?? []).filter((team) => team.status === "pending").length}
      />
    );
  } else if (profile.homeRole === "athlete") {
    body = <AthleteHome />;
  } else if (profile.requestStatus === "pending") {
    body = <PendingAsParentHome profile={profile} />;
  } else {
    body = <ParentHome profile={profile} />;
  }

  return (
    <AppShell homeRole={profile.homeRole} pendingLabel={pendingLabel}>
      {body}
    </AppShell>
  );
}
