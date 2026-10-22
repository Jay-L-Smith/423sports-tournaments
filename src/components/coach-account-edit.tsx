import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { CoachSignupForm, type SignupTeam } from "@/components/coach-signup-form";
import { Button } from "@/components/ui/button";
import { getMyCoachAccount, updateMyCoachAccount, changeMyPassword } from "@/lib/pbi/api";
import { clientEmailIssue, clientPasswordIssue } from "@/lib/pbi/auth-errors";
import { Input } from "@/components/ui/input";
import type { AgeGroup } from "@/lib/pbi/weekends";

export function EditAccountButton() {
  const [open, setOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="outline" className="w-full" onClick={() => setOpen(true)}>
        Edit account
      </Button>
      <Button type="button" variant="outline" className="w-full" onClick={() => setPasswordOpen(true)}>
        Change password
      </Button>
      {open ? <EditAccountCard onClose={() => setOpen(false)} /> : null}
      {passwordOpen ? <ChangePasswordCard onClose={() => setPasswordOpen(false)} /> : null}
    </>
  );
}

function EditAccountCard({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const accountQuery = useQuery({ queryKey: ["my-coach-account"], queryFn: () => getMyCoachAccount() });
  const account = accountQuery.data;
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-scrim p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit account"
        className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-lg border border-line bg-bg p-4 text-fg shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-end">
          <button type="button" aria-label="Close" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-md text-muted">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        {accountQuery.isPending ? (
          <p className="text-sm text-muted">Loading your account…</p>
        ) : accountQuery.isError ? (
          <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
            {accountQuery.error instanceof Error ? accountQuery.error.message : "Could not load your account."}
          </p>
        ) : account ? (
          <EditAccountForm
            account={account}
            onSaved={async () => {
              await queryClient.invalidateQueries({ queryKey: ["my-coach-account"] });
              await queryClient.invalidateQueries({ queryKey: ["profile"] });
              await queryClient.invalidateQueries({ queryKey: ["my-squads"] });
              await queryClient.invalidateQueries({ queryKey: ["my-teams"] });
              onClose();
            }}
          />
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

function EditAccountForm({
  account,
  onSaved,
}: {
  account: { name: string; phone: string; email: string; club: string; teams: { name: string; ageGroup: string }[] };
  onSaved: () => void;
}) {
  const [name, setName] = useState(account.name);
  const [phone, setPhone] = useState(account.phone);
  const [email, setEmail] = useState(account.email);
  const [club, setClub] = useState(account.club);
  const [teams, setTeams] = useState<SignupTeam[]>(
    account.teams.length > 0
      ? account.teams.map((team) => ({ name: team.name, ageGroup: team.ageGroup as AgeGroup }))
      : [{ name: "", ageGroup: "" }],
  );
  const [error, setError] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: () => updateMyCoachAccount({ data: { name, phone, email, club, teams } }),
    onSuccess: () => onSaved(),
  });

  function submit() {
    if (!name.trim()) {
      setError("Enter your name.");
      return;
    }
    if (teams.some((team) => !team.name.trim() || !team.ageGroup)) {
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
    setError(null);
    save.mutate();
  }

  return (
    <CoachSignupForm
      name={name}
      phone={phone}
      email={email}
      club={club}
      password=""
      teams={teams}
      busy={save.isPending}
      error={error || (save.error instanceof Error ? save.error.message : null)}
      onName={setName}
      onPhone={setPhone}
      onEmail={setEmail}
      onClub={setClub}
      onPassword={() => undefined}
      onTeams={setTeams}
      onSubmit={submit}
      submitLabel="Update account"
      busyLabel="Updating account…"
      showPassword={false}
    />
  );
}

function ChangePasswordCard({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: () => changeMyPassword({ data: { password } }),
    onSuccess: () => onClose(),
  });
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-scrim p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Change password"
        className="w-full max-w-md rounded-lg border border-line bg-bg p-4 text-fg shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold uppercase">Change password</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-md text-muted">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const issue = clientPasswordIssue(password);
            if (issue) {
              setError(issue);
              return;
            }
            if (password !== confirm) {
              setError("Those passwords don’t match.");
              return;
            }
            setError(null);
            save.mutate();
          }}
        >
          <label className="block space-y-1 text-sm font-semibold">
            New password
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" />
            <span className="block text-xs font-normal text-muted">At least 8 characters.</span>
          </label>
          <label className="block space-y-1 text-sm font-semibold">
            Confirm password
            <Input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" />
          </label>
          {error || save.error instanceof Error ? (
            <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
              {error || (save.error instanceof Error ? save.error.message : "")}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Update password"}
          </Button>
        </form>
      </div>
    </div>,
    document.body,
  );
}
