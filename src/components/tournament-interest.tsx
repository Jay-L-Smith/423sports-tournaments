import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { listMyCoachTeams, listMyTournamentResponses, respondToTournament } from "@/lib/pbi/api";
import { formatWeekendRange } from "@/lib/pbi/weekends";

const OPTIONS = [
  { choice: "interested" as const, label: "Register" },
  { choice: "no" as const, label: "Not interested" },
];

const STATUS_NOTE: Record<"interested" | "maybe" | "no" | "undecided", { title: string; body: string }> = {
  interested: {
    title: "Registered",
    body: "Your team is registered for this tournament. The director can take you off.",
  },
  maybe: {
    title: "Not sure yet",
    body: "You're not on this tournament yet. You can change it.",
  },
  no: {
    title: "Not interested",
    body: "Your team is not on this tournament. The director can still add you.",
  },
  undecided: {
    title: "Undecided",
    body: "You haven't picked yet. Tap this tournament to say if your team wants in.",
  },
};

export function TournamentInterest({
  weekendId,
  name,
  startDate,
  endDate,
  outcome,
}: {
  weekendId: number;
  name: string;
  startDate: string;
  endDate: string;
  outcome?: string[];
}) {
  const queryClient = useQueryClient();
  const teamsQuery = useQuery({ queryKey: ["my-teams", "signup"], queryFn: () => listMyCoachTeams() });
  const responseQuery = useQuery({ queryKey: ["tournament-responses"], queryFn: () => listMyTournamentResponses() });
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<"interested" | "maybe" | "no" | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [asked, setAsked] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"interested" | "maybe" | "no" | null>(null);
  const save = useMutation({
    mutationFn: (choice: "interested" | "maybe" | "no") => respondToTournament({ data: { weekendId, choice } }),
    onSuccess: async (result) => {
      setConfirm(null);
      setOpen(false);
      if (result.requested) {
        setAsked(result.reason ?? "the sheet is locked.");
        setNoteOpen(true);
      } else {
        setAsked(null);
        setPicked(result.choice);
        setNoteOpen(true);
      }
      await queryClient.invalidateQueries({ queryKey: ["tournament-responses"] });
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      await queryClient.invalidateQueries({ queryKey: ["weekends"] });
      await queryClient.invalidateQueries({ queryKey: ["weekend"] });
      await queryClient.invalidateQueries({ queryKey: ["schedule"] });
      await queryClient.invalidateQueries({ queryKey: ["my-teams"] });
      await queryClient.invalidateQueries({ queryKey: ["tournament-replies"] });
    },
  });
  const saved = responseQuery.data?.find((row) => row.weekendId === weekendId)?.choice ?? null;
  const current = picked ?? saved;
  const pending = save.isPending ? save.variables : null;
  const selected = pending ?? current;
  const teams = teamsQuery.data ?? [];
  const status = selected === "maybe" ? "Not sure yet" : OPTIONS.find((option) => option.choice === selected)?.label ?? "Undecided";
  const undecided = selected == null;
  const choices = OPTIONS.filter((option) => option.choice !== current);
  function choose(next: "interested" | "maybe" | "no") {
    if (current && next !== current) {
      setConfirm(next);
      return;
    }
    save.mutate(next);
  }
  return (
    <article className={`rounded-lg border border-line px-4 py-4 ${undecided ? "bg-[#f5c518] text-[#1c1c1c]" : "bg-surface"}`}>
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between gap-3 text-left">
        <span className="min-w-0">
          <span className="block font-semibold">{name}</span>
          <span className={`mt-1 block text-sm ${undecided ? "text-[#1c1c1c]/80" : "text-muted"}`}>{formatWeekendRange(startDate, endDate)}</span>
          <span className="mt-2 block text-sm font-bold uppercase tracking-wide">{status}</span>
          <span className={`mt-1 block text-sm font-normal normal-case tracking-normal ${undecided ? "text-[#1c1c1c]/80" : "text-muted"}`}>
            {STATUS_NOTE[selected ?? "undecided"].body}
          </span>
          {outcome?.map((line) => (
            <span key={line} className="mt-1 block text-sm font-semibold normal-case tracking-normal">
              {line}
            </span>
          ))}
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 ${open ? "rotate-180" : ""} ${undecided ? "text-[#1c1c1c]" : "text-muted"}`} aria-hidden />
      </button>
      {open ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {choices.map((option) => (
            <Button
              key={option.choice}
              type="button"
              className="w-full"
              variant={option.choice === "interested" ? "default" : "outline"}
              disabled={save.isPending || (option.choice === "interested" && teams.length === 0)}
              onClick={() => choose(option.choice)}
            >
              {pending === option.choice ? "Saving…" : option.label}
            </Button>
          ))}
          {teams.length === 0 ? <p className="text-sm">Add a team before you can register.</p> : null}
          {save.error instanceof Error ? <p className="text-sm">{save.error.message}</p> : null}
        </div>
      ) : null}
      {noteOpen && (asked || selected) ? (
        <InterestNote choice={selected ?? "interested"} asked={asked} onClose={() => { setNoteOpen(false); setAsked(null); }} />
      ) : null}
      {confirm ? (
        <ConfirmChange
          from={OPTIONS.find((option) => option.choice === current)?.label ?? "your choice"}
          to={OPTIONS.find((option) => option.choice === confirm)?.label ?? "that"}
          busy={save.isPending}
          onYes={() => save.mutate(confirm)}
          onNo={() => setConfirm(null)}
        />
      ) : null}
    </article>
  );
}

function ConfirmChange({
  from,
  to,
  busy,
  onYes,
  onNo,
}: {
  from: string;
  to: string;
  busy: boolean;
  onYes: () => void;
  onNo: () => void;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-scrim p-4" onClick={onNo}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Change your answer"
        className="w-full max-w-md rounded-lg border border-line bg-bg p-4 text-fg shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="font-display text-2xl font-bold uppercase">Are you sure?</h2>
        <p className="mt-3 text-sm">
          You already marked {from}. Change it to {to}?
        </p>
        <Button type="button" className="mt-4 w-full" disabled={busy} onClick={onYes}>
          {busy ? "Saving…" : "Yes, change it"}
        </Button>
        <Button type="button" variant="outline" className="mt-2 w-full" disabled={busy} onClick={onNo}>
          Cancel
        </Button>
      </div>
    </div>,
    document.body,
  );
}

function InterestNote({ choice, asked, onClose }: { choice: "interested" | "maybe" | "no"; asked: string | null; onClose: () => void }) {
  const note = asked
    ? {
        title: "Request sent",
        body: `This tournament is locked because ${asked} The director got a request to add your team.`,
      }
    : STATUS_NOTE[choice];
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-scrim p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={note.title}
        className="w-full max-w-md rounded-lg border border-line bg-bg p-4 text-fg shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="font-display text-2xl font-bold uppercase">{note.title}</h2>
        <p className="mt-3 text-sm">{note.body}</p>
        <Button type="button" className="mt-4 w-full" onClick={onClose}>
          Got it
        </Button>
      </div>
    </div>,
    document.body,
  );
}
