import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { SessionSkeleton, useAppSession } from "@/components/session-gate";
import { AppShell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RedirectToSignIn } from "@/lib/auth/gates";
import {
  listNotifications,
  listOpenTournaments,
  registerTeam,
  type OpenAge,
  type OpenTournament,
  type RegisteredTeam,
} from "@/lib/pbi/api";
import { formatAgeAvailability, parseTeamRegister } from "@/lib/pbi/weekends";
import { cn } from "@/lib/utils";
import { formatWeekendRange, type AgeGroup } from "@/lib/pbi/weekends";

export const Route = createFileRoute("/teams/new")({ component: RegisterTeamPage });

function RegisterTeamPage() {
  const { user, isPending, profile } = useAppSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [weekendId, setWeekendId] = useState<number | null>(null);
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);
  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const notifQuery = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => listNotifications(),
    enabled: Boolean(user && profile),
  });
  const openQuery = useQuery({
    queryKey: ["open-tournaments"],
    queryFn: () => listOpenTournaments(),
    enabled: Boolean(profile?.homeRole === "coach"),
  });

  const registerMut = useMutation({
    mutationFn: (input: ReturnType<typeof parseTeamRegister>) => registerTeam({ data: input }),
    onSuccess: (team) => {
      queryClient.setQueryData(["my-team", team.id], team);
      queryClient.setQueryData<RegisteredTeam[]>(["my-teams"], (current) => {
        const rest = (current ?? []).filter((row) => row.id !== team.id);
        return [team, ...rest];
      });
      void queryClient.invalidateQueries({ queryKey: ["my-teams"] });
      void queryClient.invalidateQueries({ queryKey: ["open-tournaments"] });
      void navigate({ to: "/teams/$teamId", params: { teamId: String(team.id) } });
    },
  });

  if (isPending) return <SessionSkeleton />;
  if (!user) return <RedirectToSignIn />;
  if (!profile) return <Navigate to="/" />;
  if (profile.homeRole !== "coach") return <Navigate to="/" />;

  const unread = (notifQuery.data ?? []).filter((n) => !n.read).length;
  const tournaments = openQuery.data ?? [];
  const selected = tournaments.find((item) => item.id === weekendId) ?? null;
  const errorText =
    formError ??
    (registerMut.error instanceof Error
      ? registerMut.error.message
      : registerMut.error
        ? "Could not register that team."
        : null);

  function pickTournament(item: OpenTournament) {
    setWeekendId(item.id);
    setAgeGroup(null);
    setFormError(null);
  }

  function pickAge(age: OpenAge) {
    setAgeGroup(age.ageGroup);
    setFormError(null);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    try {
      const parsed = parseTeamRegister({ weekendId, ageGroup, name });
      registerMut.mutate(parsed);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Check the form and try again.");
    }
  }

  return (
    <AppShell homeRole={profile.homeRole} unread={unread}>
      <Link to="/teams" className="text-sm font-semibold text-primary">
        My team
      </Link>
      <h1 className="mt-3 font-display text-4xl font-bold uppercase">Request a team</h1>
      <p className="mt-2 text-sm text-muted">
        Pick a tournament and age. An Admin still has to take you — a request is not a spot.
      </p>

      {openQuery.isPending ? (
        <p className="mt-6 text-sm text-muted">Loading tournaments…</p>
      ) : tournaments.length === 0 ? (
        <p className="mt-6 rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted">
          No tournaments are open to register yet.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {tournaments.map((item) => {
            const on = item.id === weekendId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => pickTournament(item)}
                className={cn(
                  "w-full rounded-lg border px-4 py-4 text-left transition-colors duration-150",
                  on ? "border-pine bg-pine/10" : "border-line bg-surface hover:border-fg/25",
                )}
              >
                <p className="font-display text-2xl font-bold uppercase leading-none">{item.name}</p>
                <p className="mt-2 text-sm font-medium">{formatWeekendRange(item.startDate, item.endDate)}</p>
                <p className="mt-1 text-sm text-muted">
                  {item.approvedCount}/{item.maxTeams} in
                  {item.ages.length > 0
                    ? ` · ${item.ages
                        .map((age) => `${age.ageGroup} ${formatAgeAvailability(age.registered, age.maxTeams, age.open)}`)
                        .join(" · ")}`
                    : ""}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {selected ? (
        <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-lg border border-line bg-surface p-4">
          <p className="font-semibold">{selected.name}</p>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-fg">Age</legend>
            <div className="grid grid-cols-4 gap-2">
              {selected.ages.map((age) => {
                const on = ageGroup === age.ageGroup;
                return (
                  <button
                    key={age.ageGroup}
                    type="button"
                    aria-pressed={on}
                    onClick={() => pickAge(age)}
                    className={cn(
                      "min-h-11 rounded-md border text-sm font-semibold",
                      on
                        ? "border-pine bg-pine text-pine-fg"
                        : "border-line bg-bg text-fg hover:bg-surface",
                    )}
                  >
                    {age.ageGroup}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="space-y-1.5">
            <Label htmlFor="team-name">Team name</Label>
            <Input
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tellico 15U"
              autoComplete="off"
              maxLength={60}
            />
          </div>
          {errorText ? (
            <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
              {errorText}
            </p>
          ) : null}
          <Button type="submit" size="lg" className="w-full" disabled={registerMut.isPending}>
            {registerMut.isPending ? "Sending…" : "Submit for approval"}
          </Button>
        </form>
      ) : null}
    </AppShell>
  );
}
