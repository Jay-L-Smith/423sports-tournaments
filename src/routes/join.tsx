import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BrandLockup } from "@/components/brand";
import { CoachSignupForm, type SignupTeam } from "@/components/coach-signup-form";
import { RolePicker } from "@/components/role-picker";
import { SessionSkeleton, useAppSession } from "@/components/session-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authEnabled } from "@/lib/auth/client";
import { checkSignupOpen, claimAddedCoach, completeOnboarding, previewCoachSignup, searchJoinableTeams, type JoinableTeam, type SignupPreview } from "@/lib/pbi/api";
import { clientEmailIssue, clientPasswordIssue, plainAuthError } from "@/lib/pbi/auth-errors";
import { enterApp, signInWithEmail, signUpWithEmail } from "@/lib/pbi/email-auth";
import { ROLE_COPY, type Role } from "@/lib/pbi/roles";
import { formatPhoneInput } from "@/lib/utils";

type JoinSearch = { role?: string; invite?: number };

export const Route = createFileRoute("/join")({
  validateSearch: (search: Record<string, unknown>): JoinSearch => ({
    role: typeof search.role === "string" ? search.role : undefined,
    invite:
      typeof search.invite === "number"
        ? search.invite
        : typeof search.invite === "string" && /^\d+$/.test(search.invite)
          ? Number(search.invite)
          : undefined,
  }),
  component: Join,
});

function Join() {
  const navigate = useNavigate();
  const { user, isPending, profile } = useAppSession();
  const { role: roleParam, invite: inviteParam } = Route.useSearch();
  const chosenRole: Role | null = roleParam === "coach" || roleParam === "admin" ? roleParam : null;
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [club, setClub] = useState("");
  const [teams, setTeams] = useState<SignupTeam[]>([{ name: "", ageGroup: "" }]);
  const [door, setDoor] = useState<"ask" | "join" | "create">("ask");
  const [joinQuery, setJoinQuery] = useState("");
  const [joinHits, setJoinHits] = useState<JoinableTeam[]>([]);
  const [pickedJoinId, setPickedJoinId] = useState<number | null>(null);
  const [allowDifferent, setAllowDifferent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [claim, setClaim] = useState<Extract<SignupPreview, { kind: "claim" }> | null>(null);

  useEffect(() => {
    if (door !== "join" || joinQuery.trim().length < 2) {
      setJoinHits([]);
      return;
    }
    let stop = false;
    const timer = setTimeout(() => {
      void searchJoinableTeams({ data: { query: joinQuery.trim() } })
        .then((hits) => {
          if (!stop) setJoinHits(hits);
        })
        .catch(() => {
          if (!stop) setJoinHits([]);
        });
    }, 250);
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [door, joinQuery]);

  async function handleCreate(forceDifferent = false) {
    if (!chosenRole || busy) return;
    if ((chosenRole === "coach" || chosenRole === "admin") && !name.trim()) {
      setError("Enter your name.");
      return;
    }
    if (chosenRole === "coach" && door === "ask") {
      setError("Pick whether your team is already on here, or you are setting it up.");
      return;
    }
    if (chosenRole === "coach" && door === "join" && pickedJoinId == null) {
      setError("Tap the team you are joining.");
      return;
    }
    if (chosenRole === "coach" && door === "create" && teams.some((team) => !team.name.trim() || !team.ageGroup)) {
      setError("Enter a team name and an age.");
      return;
    }
    const emailIssue = clientEmailIssue(email);
    if (emailIssue) {
      setError(emailIssue);
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Enter a cell phone.");
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
      if (chosenRole === "coach") {
        const preview = await previewCoachSignup({ data: { email: normalized, phone } });
        if (preview.kind === "taken" || preview.kind === "conflict") {
          setError(preview.message);
          setBusy(false);
          return;
        }
        if (preview.kind === "claim") {
          setClaim(preview);
          setBusy(false);
          return;
        }
        if (door === "create" && !allowDifferent && !forceDifferent) {
          const hits = await searchJoinableTeams({ data: { query: teams[0]?.name ?? "" } });
          if (hits.length > 0) {
            setJoinHits(hits);
            setError(`${hits[0].name} · ${hits[0].ageGroup} · ${hits[0].coachName} is already on here.`);
            setBusy(false);
            return;
          }
        }
      }
      await checkSignupOpen({ data: { email: normalized, phone } });
      await signUpWithEmail(normalized, password, name.trim());
      await completeOnboarding({
        data: {
          role: chosenRole,
          name: name.trim(),
          teams: chosenRole === "coach" && door === "create" ? teams : undefined,
          joinTeamId: chosenRole === "coach" && door === "join" ? pickedJoinId : undefined,
          club: chosenRole === "coach" ? club : undefined,
          inviteId: chosenRole === "coach" ? inviteParam : undefined,
          phone,
        },
      });
      enterApp();
    } catch (err) {
      setError(plainAuthError(err));
      setBusy(false);
    }
  }

  async function confirmClaim() {
    if (!claim || busy) return;
    setBusy(true);
    setError(null);
    const normalized = email.trim().toLowerCase();
    try {
      const claimed = await claimAddedCoach({
        data: {
          confirm: true,
          userId: claim.userId,
          email: normalized,
          phone,
          password,
          name: name.trim(),
          club,
          inviteId: inviteParam,
        },
      });
      await signInWithEmail(claimed.email, password);
      enterApp();
    } catch (err) {
      setError(plainAuthError(err));
      setClaim(null);
      setBusy(false);
    }
  }

  function declineClaim() {
    if (!claim) return;
    const which = claim.matched === "email" ? "email" : claim.matched === "phone" ? "phone" : "phone and email";
    setError(`That ${which} is already on a coach we added. Use a different one, or ask the director to fix it.`);
    setClaim(null);
  }

  if (isPending && !busy) return <SessionSkeleton />;
  if (user && profile && !busy) return <Navigate to="/" />;

  if (!chosenRole) {
    return (
      <main className="site-splash mx-auto flex min-h-dvh max-w-md flex-col px-5 pt-10">
        <img src="/logo.png" alt="423Sports" className="mx-auto mb-8 block w-full max-w-[19rem]" />
        <RolePicker
          appearance="splash"
          title="What type of account would you like to create?"
          subtitle=""
          blurbs={{
            coach: "Head coach or assistant. Roster, schedule, and scores.",
            admin: "Run the tournament. Teams, fields, and the bracket.",
          }}
          onPick={(role) => {
            void navigate({ to: "/join", search: { role, invite: inviteParam } });
          }}
        />
        <p className="mt-8 text-center text-sm text-white/70">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-white">
            Sign in
          </Link>
        </p>
      </main>
    );
  }

  const copy = ROLE_COPY[chosenRole];

  if (chosenRole === "coach") {
    return (
      <main className="site-splash mx-auto flex min-h-dvh max-w-md flex-col px-5 pt-10">
        <img src="/logo.png" alt="423Sports" className="mx-auto mb-8 block w-full max-w-[19rem]" />
        <CoachSignupForm
          name={name}
          phone={phone}
          email={email}
          club={club}
          password={password}
          teams={teams}
          door={door}
          joinQuery={joinQuery}
          joinHits={joinHits}
          pickedJoinId={pickedJoinId}
          busy={busy}
          error={error}
          appearance="splash"
          steps
          onName={setName}
          onPhone={setPhone}
          onEmail={setEmail}
          onClub={setClub}
          onPassword={setPassword}
          onTeams={setTeams}
          onDoor={(next) => {
            setDoor(next);
            setError(null);
            setAllowDifferent(false);
          }}
          onJoinQuery={(value) => {
            setJoinQuery(value);
            setPickedJoinId(null);
          }}
          onPickJoin={(id) => {
            const team = joinHits.find((hit) => hit.id === id);
            setPickedJoinId(id);
            if (team) setJoinQuery(`${team.name} · ${team.ageGroup}`);
          }}
          onSubmit={() => void handleCreate()}
        />
        {door === "create" && error?.includes("already on here") ? (
          <div className="mt-3 space-y-2">
            <Button type="button" className="w-full" onClick={() => { setDoor("join"); setJoinQuery(teams[0]?.name ?? ""); setError(null); }}>
              Join that team
            </Button>
            <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={() => void handleCreate(true)}>
              This is a different team
            </Button>
          </div>
        ) : null}
        <p className="mt-8 text-center text-sm text-white/70">
          <Link to="/join" search={{ role: undefined }} className="font-semibold text-white">
            Change role
          </Link>
        </p>
        {claim ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-md rounded-lg bg-white p-4 text-fg">
              <h2 className="font-display text-2xl font-bold uppercase leading-tight">
                {claim.matched === "email"
                  ? "This email is already on a coach we added."
                  : claim.matched === "phone"
                    ? "This phone is already on a coach we added."
                    : "This phone and email are already on a coach we added."}
              </h2>
              <p className="mt-3 font-semibold">{claim.name || "Coach"}</p>
              {claim.teams.length === 0 ? (
                <p className="text-sm text-muted">No team yet</p>
              ) : (
                claim.teams.map((team) => (
                  <p key={`${team.name}-${team.ageGroup}`} className="text-sm">
                    {team.name} · {team.ageGroup}
                  </p>
                ))
              )}
              <p className="mt-3 text-sm">Is this you?</p>
              <Button type="button" className="mt-4 w-full" disabled={busy} onClick={() => void confirmClaim()}>
                {busy ? "Saving…" : "Yes, that's my team"}
              </Button>
              <Button type="button" variant="outline" className="mt-2 w-full" disabled={busy} onClick={declineClaim}>
                No, that's not me
              </Button>
            </div>
          </div>
        ) : null}
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8">
        <BrandLockup />
        <p className="mt-4 text-sm text-muted">Create a {copy.label} account</p>
      </div>
      {chosenRole === "admin" ? (
        <p className="mb-4 rounded-md bg-warn-bg px-3 py-2 text-sm">
          {copy.label} tools stay off until an Admin approves. You’ll use Parent tools until then.
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
            <Label htmlFor="name">Name</Label>
            <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Cell phone</Label>
            <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" value={formatPhoneInput(phone)} onChange={(e) => setPhone(formatPhoneInput(e.target.value))} placeholder="(555) 555-0100" />
          </div>
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
              placeholder="name@email.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
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
