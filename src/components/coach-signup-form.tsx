import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AGE_GROUPS, type AgeGroup } from "@/lib/pbi/weekends";
import { formatPhoneInput } from "@/lib/utils";
import { clientEmailIssue } from "@/lib/pbi/auth-errors";

export type SignupTeam = { name: string; ageGroup: AgeGroup | "" };
export type JoinHit = { id: number; name: string; ageGroup: string; coachName: string };

export function CoachSignupForm({
  name,
  phone,
  email,
  club,
  password,
  teams,
  busy,
  error,
  onName,
  onPhone,
  onEmail,
  onClub,
  onPassword,
  onTeams,
  onSubmit,
  submitLabel = "Create account",
  busyLabel = "Creating account…",
  passwordHint = "At least 8 characters.",
  showPassword = true,
  door,
  onDoor,
  joinQuery = "",
  onJoinQuery,
  joinHits = [],
  pickedJoinId = null,
  onPickJoin,
  appearance = "plain",
  steps = false,
}: {
  name: string;
  phone: string;
  email: string;
  club: string;
  password: string;
  teams: SignupTeam[];
  busy: boolean;
  error: string | null;
  onName: (value: string) => void;
  onPhone: (value: string) => void;
  onEmail: (value: string) => void;
  onClub: (value: string) => void;
  onPassword: (value: string) => void;
  onTeams: (value: SignupTeam[]) => void;
  onSubmit: () => void;
  submitLabel?: string;
  busyLabel?: string;
  passwordHint?: string;
  showPassword?: boolean;
  door?: "ask" | "join" | "create";
  onDoor?: (door: "ask" | "join" | "create") => void;
  joinQuery?: string;
  onJoinQuery?: (value: string) => void;
  joinHits?: JoinHit[];
  pickedJoinId?: number | null;
  onPickJoin?: (id: number) => void;
  appearance?: "plain" | "splash";
  steps?: boolean;
}) {
  const splash = appearance === "splash";
  const [step, setStep] = useState<1 | 2>(steps ? 1 : 2);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [stepError, setStepError] = useState<string | null>(null);
  const label = splash ? "block space-y-1 text-sm font-semibold text-white" : "block space-y-1 text-sm font-semibold";
  const field = splash ? "h-11 border-white/20 bg-white text-[#1a1a1a]" : undefined;

  function onForm(event: FormEvent) {
    event.preventDefault();
    if (steps && step === 1) {
      const emailIssue = clientEmailIssue(email);
      if (emailIssue) {
        setStepError(emailIssue);
        return;
      }
      if (showPassword && password.length < 8) {
        setStepError("Password needs at least 8 characters.");
        return;
      }
      if (showPassword && confirmPassword !== password) {
        setStepError("Those passwords don’t match.");
        return;
      }
      setStepError(null);
      setStep(2);
      return;
    }
    onSubmit();
  }

  const details = step === 2 || !steps;

  return (
    <form onSubmit={onForm} className={splash ? "space-y-3" : "space-y-4"}>
      <h1 className={splash ? "text-3xl font-bold tracking-tight text-white" : "font-display text-4xl font-bold uppercase tracking-wide"}>
        Coach account
      </h1>
      {steps && step === 2 ? (
        <button type="button" className="text-sm font-semibold text-white/70" onClick={() => setStep(1)}>
          {email.trim()} · change
        </button>
      ) : null}
      {steps && step === 1 ? (
        <label className={label}>
          Email
          <Input className={field} value={email} onChange={(event) => onEmail(event.target.value)} inputMode="email" autoCapitalize="none" autoCorrect="off" autoComplete="email" placeholder="name@email.com" />
        </label>
      ) : null}
      {!steps ? (
        <label className={label}>
          Name
          <Input className={field} value={name} onChange={(event) => onName(event.target.value)} autoComplete="name" />
        </label>
      ) : null}
      {details ? (
        <>
          <label className={label}>
            Cell phone
            <Input className={field} value={formatPhoneInput(phone)} onChange={(event) => onPhone(formatPhoneInput(event.target.value))} inputMode="tel" autoComplete="tel" placeholder="(555) 555-0100" />
          </label>
          <label className={label}>
            {steps ? "Name" : "Email"}
            {steps ? (
              <Input className={field} value={name} onChange={(event) => onName(event.target.value)} autoComplete="name" />
            ) : (
              <Input className={field} value={email} onChange={(event) => onEmail(event.target.value)} inputMode="email" autoCapitalize="none" autoCorrect="off" autoComplete="email" placeholder="name@email.com" />
            )}
          </label>
          <label className={label}>
            Organization
            <Input className={field} value={club} onChange={(event) => onClub(event.target.value)} placeholder="Optional" />
          </label>
          <div className="space-y-2">
            <p className={splash ? "text-sm font-semibold text-white" : "text-sm font-semibold"}>Team</p>
            {door === "ask" ? (
              <div className="space-y-2">
                <Button type="button" className="w-full" onClick={() => onDoor?.("join")}>
                  My team is already on here
                </Button>
                <Button type="button" variant="outline" className={splash ? "w-full border-white/30 bg-transparent text-white" : "w-full"} onClick={() => onDoor?.("create")}>
                  I’m setting this team up
                </Button>
              </div>
            ) : null}
            {door === "join" ? (
              <div className="space-y-2">
                <Input className={field} value={joinQuery} aria-label="Search team" placeholder="Team name" onChange={(event) => onJoinQuery?.(event.target.value)} />
                {pickedJoinId != null ? null : joinHits.length === 0 ? (
                  <p className={splash ? "text-sm text-white/60" : "text-sm text-muted"}>Type the team name. A missed letter still finds it. This does not make a new team.</p>
                ) : (
                  joinHits.map((team) => (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => onPickJoin?.(team.id)}
                      className={`block w-full rounded-md border px-3 py-2 text-left text-sm ${pickedJoinId === team.id ? "border-white bg-white text-[#1a1a1a]" : splash ? "border-white/20 text-white" : "border-line"}`}
                    >
                      <span className="font-semibold">{team.name} · {team.ageGroup}</span>
                      <span className={`mt-0.5 block ${pickedJoinId === team.id ? "text-[#3a3a3a]" : splash ? "text-white/60" : "text-muted"}`}>{team.coachName}</span>
                    </button>
                  ))
                )}
                <button type="button" className={splash ? "text-sm font-semibold text-white" : "text-sm font-semibold text-primary"} onClick={() => onDoor?.("ask")}>
                  Back
                </button>
              </div>
            ) : null}
            {door === "create" || door == null ? (
              <>
                {teams.map((team, index) => (
                  <div key={index} className="grid grid-cols-[1fr_5.5rem] gap-2">
                    <Input
                      className={field}
                      value={team.name}
                      aria-label="Team name"
                      placeholder="Team name"
                      onChange={(event) => onTeams(teams.map((row, i) => (i === index ? { ...row, name: event.target.value } : row)))}
                    />
                    <select
                      aria-label="Age"
                      value={team.ageGroup}
                      onChange={(event) =>
                        onTeams(teams.map((row, i) => (i === index ? { ...row, ageGroup: event.target.value as AgeGroup | "" } : row)))
                      }
                      className="h-11 rounded-md border border-line bg-white px-2 text-sm text-[#1a1a1a]"
                    >
                      <option value="">Age</option>
                      {AGE_GROUPS.map((age) => (
                        <option key={age} value={age}>
                          {age}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                <Button type="button" variant="outline" className={splash ? "w-full border-white/30 bg-transparent text-white" : "w-full"} onClick={() => onTeams([...teams, { name: "", ageGroup: "" }])}>
                  Add another team
                </Button>
                {door === "create" ? (
                  <button type="button" className={splash ? "text-sm font-semibold text-white" : "text-sm font-semibold text-primary"} onClick={() => onDoor?.("ask")}>
                    Back
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        </>
      ) : null}
      {showPassword && (step === 1 || !steps) ? (
        <label className={label}>
          Password
          <Input className={field} type="password" value={password} onChange={(event) => onPassword(event.target.value)} autoComplete="new-password" />
          <span className={splash ? "block text-xs font-normal text-white/50" : "block text-xs font-normal text-muted"}>{passwordHint}</span>
        </label>
      ) : null}
      {showPassword && (step === 1 || !steps) ? (
        <label className={label}>
          Confirm password
          <Input className={field} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" />
        </label>
      ) : null}
      {stepError || error ? (
        <p className="rounded-md bg-[#ffe08a] px-3 py-2 text-sm font-medium text-[#1a1a1a]" role="alert">
          {step === 1 && stepError ? stepError : error}
        </p>
      ) : null}
      <Button type="submit" size="lg" className={splash ? "site-cta !mt-8 w-full" : "w-full"} disabled={busy || (details && door === "ask")}>
        {busy ? busyLabel : steps && step === 1 ? "Continue" : door === "join" ? "Ask to join" : submitLabel}
      </Button>
    </form>
  );
}