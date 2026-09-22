import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseCoachAccess } from "@/lib/pbi/coach-request";
import { cn } from "@/lib/utils";

export function CoachAccessPrompt({
  teamName,
  reason,
  busy,
  title = "Coach access",
  subtitle = "An Admin reviews this before Coach tools turn on. Parent tools still work while you wait.",
  submitLabel = "Continue",
  onTeamName,
  onReason,
  onContinue,
  onBack,
}: {
  teamName: string;
  reason: string;
  busy?: boolean;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  onTeamName: (value: string) => void;
  onReason: (value: string) => void;
  onContinue: (input: { teamName: string; reason: string }) => void;
  onBack?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      const parsed = parseCoachAccess({ teamName, reason });
      setError(null);
      onContinue(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check your answers and try again.");
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
          autoComplete="off"
          maxLength={80}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="coach-reason">Why are you requesting access?</Label>
        <textarea
          id="coach-reason"
          value={reason}
          onChange={(e) => onReason(e.target.value)}
          placeholder="I coach this team and need to register for tournaments."
          maxLength={280}
          rows={4}
          className={cn(
            "min-h-24 w-full rounded-md border border-line bg-surface px-3 py-3 text-base text-fg",
            "placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          )}
        />
      </div>
      {error ? (
        <p className="rounded-md bg-warn-bg px-3 py-2 text-sm font-medium" role="alert">
          {error}
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
