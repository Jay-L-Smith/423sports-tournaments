import { Link } from "@tanstack/react-router";
import { ChevronDown, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { HomeAction } from "@/components/coming-soon";
import { CoachDeniedCard } from "@/components/coach-denied";
import { Button } from "@/components/ui/button";
import type { DirectoryUser, PendingRequest, PendingTeam, Profile, Weekend } from "@/lib/pbi/api";
import { MAX_COACH_REQUESTS } from "@/lib/pbi/coach-request";
import { ROLE_COPY } from "@/lib/pbi/roles";
import { poolScheduleChecks, type ReadyCheck } from "@/lib/pbi/rules";
import { formatAgeGroups, formatWeekendRange } from "@/lib/pbi/weekends";

const ACTIVE_WINDOW_MS = 72 * 60 * 60 * 1000;

function firstPitchMs(weekend: Weekend): number {
  const [y, m, d] = weekend.startDate.split("-").map(Number);
  const [hh, mm] = (weekend.rules.firstPitch || "08:00").split(":").map(Number);
  return new Date(y || 0, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0).getTime();
}

function tournamentEnded(weekend: Weekend, now: Date): boolean {
  const [y, m, d] = weekend.endDate.split("-").map(Number);
  return now.getTime() > new Date(y || 0, (m || 1) - 1, d || 1, 23, 59, 59, 999).getTime();
}

function splitTournaments(weekends: Weekend[], now = new Date()) {
  const active: Weekend[] = [];
  const upcoming: Weekend[] = [];
  const past: Weekend[] = [];
  for (const weekend of weekends) {
    const until = firstPitchMs(weekend) - now.getTime();
    if (tournamentEnded(weekend, now)) past.push(weekend);
    else if (until > ACTIVE_WINDOW_MS) upcoming.push(weekend);
    else active.push(weekend);
  }
  const byPitch = (a: Weekend, b: Weekend) => firstPitchMs(a) - firstPitchMs(b);
  active.sort(byPitch);
  upcoming.sort(byPitch);
  past.sort((a, b) => firstPitchMs(b) - firstPitchMs(a));
  return { active, upcoming, past };
}

function missingFor(weekend: Weekend): ReadyCheck[] {
  return poolScheduleChecks({
    ageGroups: weekend.ageGroups,
    approvedByAge: weekend.approvedByAge ?? {},
    locationCount: weekend.locationCount,
    minTeams: weekend.rules.minTeams,
    hasBracket: weekend.hasBracket,
  }).items.filter((item) => !item.ok && item.id !== "bracket");
}

function MissingDialog({
  weekend,
  items,
  onClose,
}: {
  weekend: Weekend;
  items: ReadyCheck[];
  onClose: () => void;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-scrim p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="missing-dialog-title"
        className="w-full max-w-md rounded-lg border border-line bg-bg p-4 text-fg shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="missing-dialog-title" className="font-display text-2xl font-bold uppercase">
            What's missing
          </h2>
          <Button type="button" variant="ghost" className="px-2 text-muted" onClick={onClose}>
            Close
          </Button>
        </div>
        <p className="mt-1 text-sm text-muted">{weekend.name}</p>
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to={item.to}
                params={{ weekendId: String(weekend.id) }}
                className="block rounded-md bg-warn-bg px-3 py-2 text-sm font-medium"
                onClick={onClose}
              >
                <span className="block">Missing — {item.label}</span>
                <span className="mt-1 block text-xs font-bold uppercase tracking-wide">Open →</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body,
  );
}

function TournamentRows({ items }: { items: Weekend[] }) {
  const [openId, setOpenId] = useState<number | null>(null);
  const open = items.find((weekend) => weekend.id === openId) ?? null;
  const openItems = open ? missingFor(open) : [];
  return (
    <>
      <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
        {items.map((weekend) => {
          const missing = missingFor(weekend);
          return (
            <li key={weekend.id} className="flex items-center">
              <Link
                to="/weekends/$weekendId"
                params={{ weekendId: String(weekend.id) }}
                className="block min-w-0 flex-1 px-4 py-3"
              >
                <p className="truncate font-medium">{weekend.name}</p>
                <p className="text-xs uppercase tracking-wide text-muted">
                  {formatWeekendRange(weekend.startDate, weekend.endDate)}
                  {weekend.ageGroups.length > 0 ? ` · ${formatAgeGroups(weekend.ageGroups)}` : ""}
                </p>
              </Link>
              {missing.length > 0 ? (
                <button
                  type="button"
                  className="mr-3 grid h-10 w-10 shrink-0 place-items-center text-[#b45309]"
                  aria-label={`${missing.length} missing for ${weekend.name}`}
                  onClick={() => setOpenId(weekend.id)}
                >
                  <TriangleAlert className="h-7 w-7" strokeWidth={2.25} />
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
      {open && openItems.length > 0 ? (
        <MissingDialog weekend={open} items={openItems} onClose={() => setOpenId(null)} />
      ) : null}
    </>
  );
}

function CollapsibleTournaments({
  title,
  items,
  empty,
}: {
  title: string;
  items: Weekend[];
  empty: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="space-y-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 text-left"
      >
        <h2 className="font-display text-2xl font-bold uppercase">{title}</h2>
        <span className="grid h-7 min-w-7 place-items-center rounded-full border border-line bg-surface px-2 text-sm font-bold">
          {items.length}
        </span>
        <ChevronDown className={`ml-auto h-5 w-5 transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>
      {open ? (
        items.length === 0 ? (
          <p className="rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted">{empty}</p>
        ) : (
          <TournamentRows items={items} />
        )
      ) : null}
    </section>
  );
}

function StatusBanner({ profile }: { profile: Profile }) {
  if (profile.requestStatus === "pending") {
    const label = profile.requestedRole === "admin" ? "Admin" : "Coach";
    return (
      <Link to="/notifications" className="block rounded-md bg-warn-bg px-4 py-3 text-fg">
        <span className="block font-display text-xl font-bold uppercase">{label} access pending</span>
        <span className="mt-1 block text-sm font-medium">
          An Admin still has to approve {label} tools. You can use Parent tools until then. Tap for status.
        </span>
      </Link>
    );
  }
  if (profile.requestStatus === "denied" && profile.requestedRole === "coach") {
    return <CoachDeniedCard profile={profile} />;
  }
  if (profile.requestStatus === "denied") {
    const label = profile.requestedRole === "admin" ? "Admin" : "Coach";
    return (
      <Link to="/notifications" className="block rounded-md bg-warn-bg px-4 py-3 text-sm font-medium text-fg">
        {label} access was denied. You still have Parent tools. See Notifications.
      </Link>
    );
  }
  return null;
}

function ParentLayout({
  profile,
  greeting,
}: {
  profile: Profile;
  greeting: string;
}) {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-4xl font-bold uppercase">{greeting}</h1>
      <StatusBanner profile={profile} />
      <HomeAction title="My athletes" hint="Coming soon — add the kids you follow." muted />
      <Link to="/schedule" className="block">
        <HomeAction title="Upcoming games" hint="Field, time, and opponent." />
      </Link>
    </div>
  );
}

export function ParentHome({ profile }: { profile: Profile }) {
  return <ParentLayout profile={profile} greeting="Parent home" />;
}

export function AthleteHome() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-4xl font-bold uppercase">Athlete home</h1>
      <HomeAction title="My team" hint="Coming soon — roster and coaches." muted />
      <Link to="/schedule" className="block">
        <HomeAction title="Upcoming games" hint="When and where you play." />
      </Link>
    </div>
  );
}

export function CoachHome({
  teamCount,
  pendingCount,
}: {
  teamCount: number;
  pendingCount: number;
}) {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-4xl font-bold uppercase">Coach home</h1>
      <Link to="/teams" className="block">
        <HomeAction
          title="My team"
          hint={
            teamCount === 0
              ? "Request a spot in a tournament. Admin has to take you."
              : pendingCount > 0
                ? `${teamCount} team${teamCount === 1 ? "" : "s"} · ${pendingCount} waiting for Admin.`
                : `${teamCount} team${teamCount === 1 ? "" : "s"} on the board.`
          }
        />
      </Link>
      <Link to="/schedule" className="block">
        <HomeAction title="Schedule" hint="Fields, times, and the bracket." />
      </Link>
      <HomeAction title="Enter scores" hint="Coming soon." muted />
    </div>
  );
}

export function AdminHome({
  users,
  weekends,
}: {
  users: DirectoryUser[];
  weekends: Weekend[];
}) {
  const { active, upcoming, past } = splitTournaments(weekends);
  return (
    <div className="space-y-10">
      <h1 className="font-display text-4xl font-bold uppercase">Admin home</h1>

      <div className="flex flex-wrap gap-2">
        <Link
          to="/weekends"
          search={{ add: 1 }}
          className="inline-flex min-h-9 items-center rounded-full bg-primary px-4 text-xs font-bold uppercase tracking-[0.08em] text-primary-fg"
        >
          Add tournament
        </Link>
        <Link
          to="/resources"
          className="inline-flex min-h-9 items-center rounded-full border border-line bg-surface px-4 text-xs font-bold uppercase tracking-[0.08em]"
        >
          Resources
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold uppercase">Active tournaments</h2>
        {active.length === 0 ? (
          <p className="rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted">
            None within 72 hours of first pitch.
          </p>
        ) : (
          <TournamentRows items={active} />
        )}
      </section>

      <CollapsibleTournaments
        title="Upcoming tournaments"
        items={upcoming}
        empty="None more than 72 hours out."
      />

      <CollapsibleTournaments title="Past tournaments" items={past} empty="None finished yet." />

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold uppercase">Users</h2>
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
          {users.map((u) => (
            <li key={u.userId} className="px-4 py-3">
              <p className="truncate font-medium">{u.email}</p>
              <p className="text-xs uppercase tracking-wide text-muted">
                {ROLE_COPY[u.homeRole].label}
                {u.requestStatus === "pending" ? " · pending" : ""}
                {u.requestStatus === "denied" ? " · denied" : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function AdminInbox({
  pending,
  pendingTeams,
  busyId,
  busyTeamId,
  onReview,
  onReviewTeam,
}: {
  pending: PendingRequest[];
  pendingTeams: PendingTeam[];
  busyId: number | null;
  busyTeamId: number | null;
  onReview: (id: number, action: "approve" | "deny") => void;
  onReviewTeam: (id: number, action: "approve" | "deny") => void;
}) {
  return (
    <div className="mt-5 space-y-6">
      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold uppercase">Pending teams</h2>
        {pendingTeams.length === 0 ? (
          <p className="rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted">
            No team requests. Coaches submit a team, then you take them or not.
          </p>
        ) : (
          pendingTeams.map((team) => (
            <div key={team.id} className="space-y-3 rounded-lg border border-line bg-surface p-4">
              <div>
                <p className="font-display text-2xl font-bold uppercase leading-none">{team.name}</p>
                <p className="mt-2 text-sm font-medium">
                  {team.ageGroup} · {team.tournamentName}
                </p>
                <p className="mt-1 text-sm text-muted">{team.coachEmail}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="pine"
                  disabled={busyTeamId === team.id}
                  onClick={() => onReviewTeam(team.id, "approve")}
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busyTeamId === team.id}
                  onClick={() => onReviewTeam(team.id, "deny")}
                >
                  Deny
                </Button>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold uppercase">Pending requests</h2>
        {pending.length === 0 ? (
          <p className="rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted">
            No one is waiting. New Coach or Admin sign-ups show up here.
          </p>
        ) : (
          pending.map((req) => (
            <div key={req.id} className="space-y-3 rounded-lg border border-line bg-surface p-4">
              <div>
                <p className="font-semibold">{req.email}</p>
                <p className="text-sm text-muted">
                  Wants {ROLE_COPY[req.requestedRole].label} access
                  {req.requestedRole === "coach" && req.attempt > 1
                    ? ` · request ${req.attempt} of ${MAX_COACH_REQUESTS}`
                    : ""}
                </p>
                {req.teamName ? (
                  <p className="mt-2 text-sm">
                    <span className="font-medium">Team:</span> {req.teamName}
                  </p>
                ) : null}
                {req.reason ? (
                  <p className="mt-1 text-sm">
                    <span className="font-medium">Why:</span> {req.reason}
                  </p>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="pine"
                  disabled={busyId === req.id}
                  onClick={() => onReview(req.id, "approve")}
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busyId === req.id}
                  onClick={() => onReview(req.id, "deny")}
                >
                  Deny
                </Button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export function PendingAsParentHome({ profile }: { profile: Profile }) {
  return <ParentLayout profile={profile} greeting="You're in" />;
}
