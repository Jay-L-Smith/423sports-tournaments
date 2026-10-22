import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAppSession } from "@/components/session-gate";
import { Button } from "@/components/ui/button";
import { listMyCoachTeams, listNotifications, markNotificationsRead, respondToTournament, type NotificationItem } from "@/lib/pbi/api";
import { coachTourFinished } from "@/lib/coach-tour-flag";
import { clearCoachNotices, coachNoticesArmed } from "@/lib/pbi/login-notices";
import { coachTournamentBucket } from "@/lib/pbi/notices";

export function CoachLoginNotices() {
  const { user } = useAppSession();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const armed = coachNoticesArmed();
  const notifQuery = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => listNotifications(),
    enabled: Boolean(user && armed),
  });
  const teamsQuery = useQuery({
    queryKey: ["my-teams", user?.id],
    queryFn: () => listMyCoachTeams(),
    enabled: Boolean(user && armed),
  });
  const fresh = (notifQuery.data ?? []).filter((item) => !item.read && coachTournamentBucket(item));

  const [tourDone, setTourDone] = useState(false);
  useEffect(() => {
    setTourDone(coachTourFinished(user?.id));
    const onDone = () => setTourDone(true);
    window.addEventListener("pbi-coach-tour-done", onDone);
    return () => window.removeEventListener("pbi-coach-tour-done", onDone);
  }, [user?.id]);

  useEffect(() => {
    if (!tourDone || !armed || !notifQuery.isSuccess) return;
    if (fresh.length === 0) {
      clearCoachNotices();
      setOpen(false);
      return;
    }
    setOpen(true);
  }, [tourDone, armed, notifQuery.isSuccess, fresh.length]);

  function close() {
    const seen = fresh.filter((item) => coachTournamentBucket(item) === "change").map((item) => item.id);
    clearCoachNotices();
    setOpen(false);
    if (seen.length === 0 || !user) return;
    queryClient.setQueryData<NotificationItem[]>(["notifications", user.id], (current) =>
      (current ?? []).map((item) => (seen.includes(item.id) ? { ...item, read: true } : item)),
    );
    void markNotificationsRead({ data: { ids: seen } });
  }

  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-scrim p-4" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="New notifications"
        className="max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-lg border border-line bg-bg p-4 text-fg shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-2xl font-bold uppercase">New notifications</h2>
          <button type="button" aria-label="Close" onClick={close} className="grid h-11 w-11 place-items-center rounded-md text-muted">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <ul className="mt-4 space-y-3">
          {fresh.map((item) => (
            <li key={item.id} className="rounded-lg border border-line bg-surface px-3 py-3">
              <p className="font-semibold">{item.title}</p>
              <p className="mt-1 text-sm text-muted">{item.body}</p>
              {coachTournamentBucket(item) === "new" && item.weekendId != null ? (
                <NoticeChoices weekendId={item.weekendId} hasTeam={(teamsQuery.data ?? []).length > 0} />
              ) : null}
            </li>
          ))}
        </ul>
        <Button type="button" className="mt-4 w-full" onClick={close}>
          Got it
        </Button>
      </div>
    </div>,
    document.body,
  );
}

function NoticeChoices({ weekendId, hasTeam }: { weekendId: number; hasTeam: boolean }) {
  const queryClient = useQueryClient();
  const [asked, setAsked] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: (choice: "interested" | "maybe" | "no") => respondToTournament({ data: { weekendId, choice } }),
    onSuccess: async (result) => {
      if (result.requested) setAsked(result.reason ?? "the sheet is locked.");
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      await queryClient.invalidateQueries({ queryKey: ["tournament-responses"] });
      await queryClient.invalidateQueries({ queryKey: ["my-interest"] });
      await queryClient.invalidateQueries({ queryKey: ["weekends"] });
    },
  });
  const options = [
    { choice: "interested" as const, label: "Register" },
    { choice: "no" as const, label: "Not interested" },
  ];
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {options.map((option) => (
        <Button
          key={option.choice}
          type="button"
          variant={option.choice === "interested" ? "default" : "outline"}
          className="w-full"
          disabled={save.isPending || (option.choice === "interested" && !hasTeam)}
          onClick={() => save.mutate(option.choice)}
        >
          {save.isPending && save.variables === option.choice ? "Saving…" : option.label}
        </Button>
      ))}
      {asked ? (
        <p className="rounded-md bg-warn-bg px-3 py-2 text-sm">
          This tournament is locked because {asked} The director got a request to add your team.
        </p>
      ) : null}
      {save.error instanceof Error ? <p className="text-sm">{save.error.message}</p> : null}
    </div>
  );
}
