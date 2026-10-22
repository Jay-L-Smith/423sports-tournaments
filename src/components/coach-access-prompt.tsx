import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseCoachAccess } from "@/lib/pbi/coach-request";
import { formatPhoneInput } from "@/lib/utils";

export function CoachAccessPrompt({
  teamName,
  busy,
  title = "Coach access",
  subtitle = "Coach tools turn on as soon as you continue.",
  submitLabel = "Continue",
  error,
  phone,
  email,
  password,
  onTeamName,
  onPhone,
  onEmail,
  onPassword,
  onContinue,
  onBack,
}: {
  teamName: string;
  busy?: boolean;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  error?: string | null;
  phone?: string;
  email?: string;
  password?: string;
  onTeamName: (value: string) => void;
  onPhone?: (value: string) => void;
  onEmail?: (value: string) => void;
  onPassword?: (value: string) => void;
  onContinue: (input: { teamName: string }) => void;
  onBack?: () => void;
}) {
  const [localError, setLocalError] = useState<string | null>(null);
  const account = onPhone != null && onEmail != null && onPassword != null;
  const shown = localError || error;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      const parsed = parseCoachAccess({ teamName });
      setLocalError(null);
      onContinue({ teamName: parsed.teamName });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Check your answers and try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-display text-4xl font-bold uppercase tracking-wide">{title}</h1>
        <p className="text-sm text-muted">{subtitle}</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="coach-team">What team do you coach?</Label>
        <Input
          id="coach-team"
          value={teamName}
          onChange={(e) => onTeamName(e.target.value)}
          placeholder="Tellico 16U"
          autoComplete="organization"
          maxLength={80}
        />
      </div>
      {account ? (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="coach-phone">Cell phone</Label>
            <Input
              id="coach-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={formatPhoneInput(phone ?? "")}
              placeholder="(555) 555-0100"
              onChange={(e) => onPhone(formatPhoneInput(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="coach-email">Email</Label>
            <Input
              id="coach-email"
              type="text"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              value={email}
              onChange={(e) => onEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="coach-password">Password</Label>
            <Input
              id="coach-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => onPassword(e.target.value)}
            />
            <p className="text-xs text-muted">At least 8 characters.</p>
          </div>
        </>
      ) : null}
      {shown ? (
        <p className="rounded-md bg-warn-bg px-3 py-2 text-sm font-medium" role="alert">
          {shown}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? "Saving…" : submitLabel}
      </Button>
      {onBack ? (
        <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
          Back
        </Button>
      ) : null}
    </form>
  );
}
