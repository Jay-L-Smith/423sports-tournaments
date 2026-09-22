import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  listNotifications,
  listPendingRequests,
  listPendingTeams,
  listWeekends,
  reviewRequest,
  reviewTeam,
  type DirectoryUser,
  type PendingRequest,
  type PendingTeam,
} from "@/lib/pbi/api";
import type { Role } from "@/lib/pbi/roles";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { user, isPending, profile, refetchProfile } = useAppSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [onboardError, setOnboardError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [coachAsk, setCoachAsk] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [reason, setReason] = useState("");

  const notifQuery = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => listNotifications(),
    enabled: Boolean(user && profile),
  });
  const unread = (notifQuery.data ?? []).filter((n) => !n.read).length;

  const pendingQuery = useQuery({
    queryKey: ["pending-requests"],
    queryFn: () => listPendingRequests(),
    enabled: Boolean(profile?.homeRole === "admin"),
  });
  const directoryQuery = useQuery({
    queryKey: ["directory"],
    queryFn: () => listDirectory(),
    enabled: Boolean(profile?.homeRole === "admin"),
  });
  const pendingTeamsQuery = useQuery({
    queryKey: ["pending-teams"],
    queryFn: () => listPendingTeams(),
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

  const reviewMut = useMutation({
    mutationFn: (input: { id: number; action: "approve" | "deny" }) =>
      reviewRequest({ data: input }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["pending-requests"] });
      await queryClient.cancelQueries({ queryKey: ["directory"] });
      const previousPending = queryClient.getQueryData<PendingRequest[]>(["pending-requests"]);
      const previousDirectory = queryClient.getQueryData<DirectoryUser[]>(["directory"]);
      const target = previousPending?.find((req) => req.id === input.id);
      queryClient.setQueryData<PendingRequest[]>(
        ["pending-requests"],
        (current) => (current ?? []).filter((req) => req.id !== input.id),
      );
      if (target) {
        queryClient.setQueryData<DirectoryUser[]>(["directory"], (current) =>
          (current ?? []).map((row) =>
            row.userId === target.userId
              ? {
                  ...row,
                  homeRole: input.action === "approve" ? target.requestedRole : "parent",
                  requestStatus: input.action === "approve" ? "approved" : "denied",
                }
              : row,
          ),
        );
      }
      return { previousPending, previousDirectory };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previousPending) {
        queryClient.setQueryData(["pending-requests"], ctx.previousPending);
      }
      if (ctx?.previousDirectory) {
        queryClient.setQueryData(["directory"], ctx.previousDirectory);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["pending-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["directory"] });
    },
  });

  const reviewTeamMut = useMutation({
    mutationFn: (input: { id: number; action: "approve" | "deny" }) => reviewTeam({ data: input }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["pending-teams"] });
      const previous = queryClient.getQueryData<PendingTeam[]>(["pending-teams"]);
      queryClient.setQueryData<PendingTeam[]>(
        ["pending-teams"],
        (current) => (current ?? []).filter((team) => team.id !== input.id),
      );
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["pending-teams"], ctx.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["pending-teams"] });
      void queryClient.invalidateQueries({ queryKey: ["weekends"] });
    },
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
        pending={pendingQuery.data ?? []}
        pendingTeams={pendingTeamsQuery.data ?? []}
        users={directoryQuery.data ?? []}
        weekendCount={weekendsQuery.data?.length ?? 0}
        busyId={reviewMut.isPending ? (reviewMut.variables?.id ?? null) : null}
        busyTeamId={reviewTeamMut.isPending ? (reviewTeamMut.variables?.id ?? null) : null}
        onReview={(id, action) => reviewMut.mutate({ id, action })}
        onReviewTeam={(id, action) => reviewTeamMut.mutate({ id, action })}
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
    <AppShell homeRole={profile.homeRole} pendingLabel={pendingLabel} unread={unread}>
      {reviewMut.error || reviewTeamMut.error ? (
        <p className="mb-3 rounded-md bg-warn-bg px-3 py-2 text-sm">
          {reviewMut.error instanceof Error
            ? reviewMut.error.message
            : reviewTeamMut.error instanceof Error
              ? reviewTeamMut.error.message
              : "Could not update that request."}
        </p>
      ) : null}
      {body}
    </AppShell>
  );
}
