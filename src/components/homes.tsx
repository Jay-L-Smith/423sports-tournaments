import { Link } from "@tanstack/react-router";
import { HomeAction } from "@/components/coming-soon";
import { CoachDeniedCard } from "@/components/coach-denied";
import { Button } from "@/components/ui/button";
import type { DirectoryUser, PendingRequest, PendingTeam, Profile } from "@/lib/pbi/api";
import { MAX_COACH_REQUESTS } from "@/lib/pbi/coach-request";
import { ROLE_COPY } from "@/lib/pbi/roles";

function StatusBanner({ profile }: { profile: Profile }) {
  if (profile.requestStatus === "pending") {
    const label = profile.requestedRole === "admin" ? "Admin" : "Coach";
    return (
      <Link
        to="/notifications"
        className="block rounded-md bg-warn-bg px-4 py-3 text-fg"
      >
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
      <Link
        to="/notifications"
        className="block rounded-md bg-warn-bg px-4 py-3 text-sm font-medium text-fg"
      >
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
      <Link to="/notifications" className="block">
        <HomeAction title="Notifications" hint="Approvals and later, game changes." />
      </Link>
      <Link to="/account" className="block">
        <HomeAction title="Account" hint="Email, role, and sign out." />
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
      <Link to="/notifications" className="block">
        <HomeAction title="Notifications" hint="Game changes will land here." />
      </Link>
      <Link to="/account" className="block">
        <HomeAction title="Account" hint="Email, role, and sign out." />
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
      <Link to="/notifications" className="block">
        <HomeAction title="Notifications" hint="Approvals and later, game changes." />
      </Link>
      <Link to="/account" className="block">
        <HomeAction title="Account" hint="Email, role, and sign out." />
      </Link>
    </div>
  );
}

export function AdminHome({
  pending,
  pendingTeams,
  users,
  weekendCount,
  busyId,
  busyTeamId,
  onReview,
  onReviewTeam,
}: {
  pending: PendingRequest[];
  pendingTeams: PendingTeam[];
  users: DirectoryUser[];
  weekendCount: number;
  busyId: number | null;
  busyTeamId: number | null;
  onReview: (id: number, action: "approve" | "deny") => void;
  onReviewTeam: (id: number, action: "approve" | "deny") => void;
}) {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-bold uppercase">Admin home</h1>

      <Link to="/weekends" className="block">
        <HomeAction
          title="Add/Edit Tournaments"
          hint={
            weekendCount === 0
              ? "Create a tournament — name, dates, ages."
              : `${weekendCount} tournament${weekendCount === 1 ? "" : "s"} on the board.`
          }
        />
      </Link>

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

      <Link to="/notifications" className="block">
        <HomeAction title="Notifications" hint="Status notes for your account." />
      </Link>
      <Link to="/account" className="block">
        <HomeAction title="Account" hint="Email, role, and sign out." />
      </Link>
    </div>
  );
}

export function PendingAsParentHome({ profile }: { profile: Profile }) {
  const label = profile.requestedRole === "admin" ? "Admin" : "Coach";
  return <ParentLayout profile={profile} greeting="You're in" />;
}
