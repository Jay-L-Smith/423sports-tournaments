import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { SessionSkeleton, useAppSession } from "@/components/session-gate";
import { AppShell } from "@/components/shell";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { listMyTeams } from "@/lib/pbi/api";
import { formatAgeGroups, formatWeekendRange, teamStatusLabel } from "@/lib/pbi/weekends";

export const Route = createFileRoute("/teams/")({ component: MyTeamsPage });

function MyTeamsPage() {
  const { user, isPending, profile } = useAppSession();

  const teamsQuery = useQuery({
    queryKey: ["my-teams"],
    queryFn: () => listMyTeams(),
    enabled: Boolean(profile?.homeRole === "coach"),
  });

  if (isPending) return <SessionSkeleton />;
  if (!user) return <RedirectToSignIn />;
  if (!profile) return <Navigate to="/" />;
  if (profile.homeRole !== "coach") return <Navigate to="/" />;

  const teams = teamsQuery.data ?? [];

  return (
    <AppShell homeRole={profile.homeRole}>
      <h1 className="font-display text-4xl font-bold uppercase">My team</h1>
      <p className="mt-2 text-sm text-muted">Request a spot. You are not in until an Admin takes you.</p>

      <Link
        to="/teams/new"
        className="mt-6 flex min-h-14 w-full items-center justify-center rounded-md bg-primary px-5 text-lg font-semibold text-primary-fg"
      >
        Request a team
      </Link>

      <section className="mt-8 space-y-3">
        {teamsQuery.isPending ? (
          <p className="text-sm text-muted">Loading your teams…</p>
        ) : teams.length === 0 ? (
          <p className="rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted">
            No team yet. Request a spot in an upcoming tournament.
          </p>
        ) : (
          teams.map((team) => (
            <Link
              key={team.id}
              to="/teams/$teamId"
              params={{ teamId: String(team.id) }}
              className="block rounded-lg border border-line bg-surface px-4 py-4 transition-colors duration-150 hover:border-fg/25"
            >
              <h2 className="font-display text-2xl font-bold uppercase leading-none">{team.name}</h2>
              <p className="mt-2 text-sm font-medium">
                {team.ageGroup} · {team.tournamentName}
              </p>
              <p className="mt-1 text-sm font-semibold text-primary">{teamStatusLabel(team.status)}</p>
              <p className="mt-1 text-sm text-muted">
                {team.playerCount === 0
                  ? "No roster yet"
                  : `${team.playerCount} player${team.playerCount === 1 ? "" : "s"}`}
                {team.locations.length > 0
                  ? ` · ${formatAgeGroups(team.locations.map((loc) => loc.name))}`
                  : ""}
              </p>
            </Link>
          ))
        )}
      </section>
    </AppShell>
  );
}
