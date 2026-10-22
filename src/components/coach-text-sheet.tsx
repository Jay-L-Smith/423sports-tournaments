import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AgeFilter, ageListRank, showsEveryAge } from "@/components/age-filter";
import { Button } from "@/components/ui/button";
import { coachTextStatus, openCoachTexts, openReminderTexts, saveCoachWeekendChecks, type CoachTextBatchView, type ReminderTextList } from "@/lib/pbi/api";
import { afterGroupBody, coachGroupSmsHref, coachReminderBody, coachSmsHref, inviteGroupBody, openSms, registrationGroupBody, scheduleGroupBody, coachTextGroups, type CoachTextPerson } from "@/lib/pbi/coach-text";
import type { Season } from "@/lib/pbi/weekends";

const batchLoads = new Map<string, Promise<CoachTextBatchView>>();

function useAskIfSent() {
  const pending = useRef<{ userId: string; name: string } | null>(null);
  const left = useRef(false);
  const [ask, setAsk] = useState<{ userId: string; name: string } | null>(null);

  useEffect(() => {
    function showIfBack() {
      if (document.visibilityState === "hidden" || !left.current || !pending.current) return;
      setAsk(pending.current);
      pending.current = null;
      left.current = false;
    }
    function onVisibility() {
      if (document.visibilityState === "hidden" && pending.current) left.current = true;
      else showIfBack();
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", showIfBack);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", showIfBack);
    };
  }, []);

  function expectReturn(person: { userId: string; name: string }) {
    pending.current = person;
    left.current = false;
    setAsk(null);
    window.setTimeout(() => {
      if (pending.current?.userId !== person.userId || document.visibilityState !== "visible" || left.current) return;
      setAsk(person);
      pending.current = null;
    }, 700);
  }

  return { ask, expectReturn, dismiss: () => setAsk(null) };
}

function SentAsk({
  name,
  onYes,
  onNo,
}: {
  name: string;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <div className="rounded-md bg-warn-bg px-3 py-3">
      <p className="text-sm font-semibold">Did you send the text to {name}?</p>
      <div className="mt-3 flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onNo}>
          Not yet
        </Button>
        <Button type="button" className="flex-1" onClick={onYes}>
          Sent
        </Button>
      </div>
    </div>
  );
}

function loadCoachTextBatch(season: Season, year: number, batchId: number | null, weekendId: number | null) {
  const key = `${season}-${year}-${batchId ?? "new"}-${weekendId ?? "all"}`;
  const existing = batchLoads.get(key);
  if (existing) return existing;
  const promise = openCoachTexts({ data: { season, year, batchId, weekendId } }).finally(() => {
    batchLoads.delete(key);
  });
  batchLoads.set(key, promise);
  return promise;
}

export function EventFinishText({
  season,
  year,
  weekendId,
  onOpen,
  className,
  inline = false,
  noteOnly = false,
  force = false,
}: {
  season: Season;
  year: number;
  weekendId: number;
  onOpen: (batchId: number | null) => void;
  className?: string;
  inline?: boolean;
  noteOnly?: boolean;
  force?: boolean;
}) {
  const status = useQuery({
    queryKey: ["coach-text", season, year],
    queryFn: () => coachTextStatus({ data: { season, year } }),
  });
  const data = status.data;
  const unsent = Boolean(data?.unsentWeekendIds.includes(weekendId));
  if (inline && force) {
    return (
      <Button type="button" variant="outline" size="sm" className={`shrink-0 ${className ?? ""}`} onClick={() => onOpen(null)}>
        Message coaches
      </Button>
    );
  }
  if (!data || !unsent) return null;
  if (inline) {
    return (
      <Button type="button" variant="outline" size="sm" className={`shrink-0 ${className ?? ""}`} onClick={() => onOpen(null)}>
        Message coaches
      </Button>
    );
  }
  if (noteOnly) return <p className={className ? `text-sm ${className}` : "text-sm"}>This weekend hasn't been texted.</p>;
  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      <p className="text-sm">This weekend hasn't been texted.</p>
      <Button type="button" className="w-full" onClick={() => onOpen(null)}>
        Message coaches
      </Button>
    </div>
  );
}

type GroupKind = "reg" | "schedule" | "invite" | "change" | "after" | "custom";
type TrackedKind = "reg" | "schedule" | "invite";

function useGroupSendAsk() {
  const pending = useRef<{ kind: TrackedKind; ids: string[] } | null>(null);
  const left = useRef(false);
  const [ask, setAsk] = useState<{ kind: TrackedKind; ids: string[] } | null>(null);

  useEffect(() => {
    function showIfBack() {
      if (document.visibilityState === "hidden" || !left.current || !pending.current) return;
      setAsk(pending.current);
      pending.current = null;
      left.current = false;
    }
    function onVisibility() {
      if (document.visibilityState === "hidden" && pending.current) left.current = true;
      else showIfBack();
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", showIfBack);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", showIfBack);
    };
  }, []);

  function expectReturn(next: { kind: TrackedKind; ids: string[] }) {
    pending.current = next;
    left.current = false;
    setAsk(null);
    window.setTimeout(() => {
      if (pending.current !== next || document.visibilityState !== "visible" || left.current) return;
      setAsk(next);
      pending.current = null;
    }, 700);
  }

  return { ask, expectReturn, dismiss: () => setAsk(null) };
}

function dotClass(on: boolean) {
  return `h-3.5 w-3.5 rounded-full ${on ? "bg-[#1DB954]" : "bg-[#D5D5D5]"}`;
}

export function CoachTextSheet({
  season,
  year,
  batchId,
  weekendId = null,
  onClose,
}: {
  season: Season;
  year: number;
  batchId: number | null;
  weekendId?: number | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [view, setView] = useState<CoachTextBatchView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ageFilter, setAgeFilter] = useState("All");
  const [kind, setKind] = useState<GroupKind | null>(null);
  const kindNow = useRef<GroupKind | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const groupAsk = useGroupSendAsk();

  useEffect(() => {
    let cancel = false;
    loadCoachTextBatch(season, year, batchId, weekendId)
      .then((next) => {
        if (!cancel) setView(next);
      })
      .catch((err: unknown) => {
        if (!cancel) setError(err instanceof Error ? err.message : "Could not open that list.");
      });
    return () => {
      cancel = true;
    };
  }, [season, year, batchId, weekendId]);

  function close() {
    void queryClient.invalidateQueries({ queryKey: ["coach-text", season, year] });
    onClose();
  }

  if (typeof document === "undefined") return null;
  const focused = weekendId != null ? view?.events.find((event) => event.id === weekendId) : undefined;
  const events = focused ? [focused] : view?.events ?? [];
  const event = events[0];
  const pageLink = event && weekendId != null ? `${window.location.origin}/weekends/${weekendId}` : "";
  const inviteLink = weekendId != null ? `${window.location.origin}/interest?e=${weekendId}` : "";
  const byAgeThenName = (coaches: CoachTextPerson[], byAge: boolean) =>
    [...coaches].sort((a, b) => {
      const name = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      if (!byAge) return name;
      const rank = (coach: CoachTextPerson) =>
        coach.teams.reduce((best, team) => Math.min(best, ageListRank(team.ageGroup ?? "")), 99);
      return rank(a) - rank(b) || name;
    });
  const registeredCoaches = byAgeThenName((view?.coaches ?? []).filter((coach) => coach.registered), true);
  const openCoaches = byAgeThenName(
    (view?.coaches ?? [])
      .filter((coach) => !coach.registered)
      .map((coach) =>
        showsEveryAge(ageFilter)
          ? coach
          : { ...coach, teams: coach.teams.filter((team) => team.ageGroup === ageFilter) },
      )
      .filter((coach) => showsEveryAge(ageFilter) || coach.teams.length > 0),
    showsEveryAge(ageFilter),
  );

  function hasPhone(phone: string | null) {
    return coachGroupSmsHref([phone || ""], "x") != null;
  }

  function choose(next: GroupKind) {
    groupAsk.dismiss();
    if (kindNow.current === next) {
      kindNow.current = null;
      setKind(null);
      setNote("");
      setPicked([]);
      return;
    }
    kindNow.current = next;
    setKind(next);
    if (next === "after" && event) setNote(afterGroupBody(event));
    else setNote("");
    const withPhone = (coaches: CoachTextPerson[]) => coaches.filter((coach) => hasPhone(coach.phone));
    if (next === "invite") {
      setPicked(withPhone(openCoaches).filter((coach) => !coach.invited).map((coach) => coach.userId));
      return;
    }
    const registered = withPhone(registeredCoaches);
    if (next === "reg") setPicked(registered.filter((coach) => !coach.regSent).map((coach) => coach.userId));
    else if (next === "schedule") setPicked(registered.filter((coach) => !coach.scheduleSent).map((coach) => coach.userId));
    else setPicked(registered.map((coach) => coach.userId));
  }

  function textOne(userId: string) {
    const coach = view?.coaches.find((row) => row.userId === userId);
    if (!coach || !hasPhone(coach.phone)) return;
    kindNow.current = "custom";
    setKind("custom");
    setPicked([userId]);
    groupAsk.dismiss();
    const href = coachSmsHref(coach.phone || "", note.trim());
    if (!href) return;
    openSms(href);
  }

  function togglePick(userId: string) {
    const coach = view?.coaches.find((row) => row.userId === userId);
    if (!coach || !hasPhone(coach.phone)) return;
    setPicked((current) => (current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]));
  }

  function togglePaid(userId: string) {
    if (weekendId == null || !view) return;
    const coach = view.coaches.find((row) => row.userId === userId);
    if (!coach) return;
    const paid = !coach.paid;
    setView({ ...view, coaches: view.coaches.map((row) => (row.userId === userId ? { ...row, paid } : row)) });
    void saveCoachWeekendChecks({ data: { weekendId, coachUserIds: [userId], paid } });
  }

  function groupBody() {
    if (!event) return "";
    if (kind === "reg") return registrationGroupBody(event, pageLink);
    if (kind === "schedule") return scheduleGroupBody(event, pageLink);
    if (kind === "invite") return inviteGroupBody(event, inviteLink);
    if (kind === "change") {
      const line = note.trim();
      return line ? `423Sports: Schedule change for ${event.name}.\n\n${line}` : "";
    }
    return note.trim();
  }

  function sendGroup() {
    if (!view || !kind) return;
    const body = groupBody();
    const people = view.coaches.filter((coach) => picked.includes(coach.userId) && hasPhone(coach.phone));
    if (!body || people.length === 0) return;
    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const href = coachGroupSmsHref(people.map((coach) => coach.phone || ""), body, ios);
    if (!href) return;
    if (kind === "reg" || kind === "schedule" || kind === "invite") groupAsk.expectReturn({ kind, ids: people.map((coach) => coach.userId) });
    openSms(href);
  }

  function confirmGroup() {
    if (!view || !groupAsk.ask || weekendId == null) return;
    const { kind: sentKind, ids } = groupAsk.ask;
    setView({
      ...view,
      coaches: view.coaches.map((row) =>
        ids.includes(row.userId)
          ? {
              ...row,
              regSent: sentKind === "reg" ? true : row.regSent,
              scheduleSent: sentKind === "schedule" ? true : row.scheduleSent,
              invited: sentKind === "invite" ? true : row.invited,
            }
          : row,
      ),
    });
    void saveCoachWeekendChecks({
      data: {
        weekendId,
        coachUserIds: ids,
        regSent: sentKind === "reg",
        scheduleSent: sentKind === "schedule",
        invited: sentKind === "invite",
      },
    });
    setPicked((current) => current.filter((id) => !ids.includes(id)));
    groupAsk.dismiss();
  }

  const draft = groupBody();
  const canSend = Boolean(kind && draft && picked.length > 0 && event);

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-scrim sm:items-center" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Message coaches"
        className="flex h-[88dvh] w-full max-w-md flex-col rounded-t-lg border border-line bg-bg text-fg shadow-lg sm:rounded-lg"
        onClick={(eventClick) => eventClick.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="font-display text-2xl font-bold uppercase leading-tight">Message coaches</h2>
          <Button type="button" variant="ghost" className="px-2 text-muted" onClick={close}>
            Close
          </Button>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {error ? <p className="rounded-md bg-warn-bg px-3 py-2 text-sm">{error}</p> : null}
          {!view && !error ? <p className="text-sm text-muted">Loading coaches…</p> : null}
          {view ? (
            <>
              {groupAsk.ask ? (
                <SentAsk
                  name={groupAsk.ask.ids.length === 1 ? "this coach" : `${groupAsk.ask.ids.length} coaches`}
                  onYes={confirmGroup}
                  onNo={groupAsk.dismiss}
                />
              ) : null}
              <div className="grid grid-cols-3 gap-2">
                <TextKind on={kind === "invite"} onClick={() => choose("invite")}>Invite</TextKind>
                <TextKind on={kind === "reg"} onClick={() => choose("reg")}>Registration</TextKind>
                <TextKind on={kind === "schedule"} onClick={() => choose("schedule")}>Schedule</TextKind>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <TextKind on={kind === "change"} onClick={() => choose("change")}>Change</TextKind>
                <TextKind on={kind === "after"} onClick={() => choose("after")}>After</TextKind>
                <TextKind on={kind === "custom"} onClick={() => choose("custom")}>Custom</TextKind>
              </div>
              {kind === "change" || kind === "after" || kind === "custom" ? (
                <textarea
                  value={note}
                  onChange={(eventChange) => setNote(eventChange.target.value)}
                  rows={3}
                  placeholder={kind === "change" ? "What changed?" : kind === "custom" ? "Write the text" : ""}
                  className="min-h-20 w-full rounded-md border border-line bg-surface px-3 py-2 text-base text-fg"
                />
              ) : null}
              {kind ? (
                <Button type="button" className="w-full" disabled={!canSend} onClick={sendGroup}>
                  Text {picked.length === 1 ? "1 coach" : `${picked.length} coaches`}
                </Button>
              ) : null}
              {registeredCoaches.length === 0 && openCoaches.length === 0 && ageFilter === "All" ? (
                <p className="text-sm text-muted">No coaches on the app yet.</p>
              ) : (
                <>
                  {registeredCoaches.length > 0 ? (
                    <section className="space-y-2">
                      <div className="flex items-center justify-between gap-2 px-3">
                        <h3 className="font-display text-lg font-bold uppercase">Registered</h3>
                        <div className="grid w-40 shrink-0 grid-cols-4 text-center text-[9px] font-bold uppercase leading-none text-muted">
                          <span>Reg</span>
                          <span>Paid</span>
                          <span>Roster</span>
                          <span>Sched</span>
                        </div>
                      </div>
                      <ul className="space-y-2">
                        {registeredCoaches.map((coach) => {
                          const phone = hasPhone(coach.phone);
                          const on = picked.includes(coach.userId);
                          return (
                            <li
                              key={coach.userId}
                              className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2"
                              onClick={() => (kind ? togglePick(coach.userId) : textOne(coach.userId))}
                            >
                              {kind ? (
                                <button
                                  type="button"
                                  aria-pressed={on}
                                  aria-label={on ? `Remove ${coach.name}` : `Include ${coach.name}`}
                                  disabled={!phone}
                                  onClick={(eventClick) => {
                                    eventClick.stopPropagation();
                                    togglePick(coach.userId);
                                  }}
                                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${on ? "border-[#1DB954] bg-[#1DB954]" : "border-line bg-white"} disabled:opacity-40`}
                                >
                                  {on ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
                                </button>
                              ) : null}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold">{coach.name}</p>
                                <p className="truncate text-xs text-muted">
                                  {coach.teams.length > 0
                                    ? coach.teams.map((team) => (team.ageGroup ? `${team.name} · ${team.ageGroup}` : team.name)).join(", ")
                                    : "No team"}
                                  {!phone ? " · No cell number" : ""}
                                </p>
                              </div>
                              <div className="grid w-40 shrink-0 grid-cols-4 place-items-center">
                                <span className={dotClass(Boolean(coach.regSent))} />
                                <button type="button" className="grid h-8 w-8 place-items-center" aria-label={coach.paid ? "Paid. Tap to undo." : "Not paid. Tap if they paid."} onClick={(eventClick) => { eventClick.stopPropagation(); togglePaid(coach.userId); }}>
                                  <span className={dotClass(Boolean(coach.paid))} />
                                </button>
                                <span className={dotClass(Boolean(coach.rosterSet))} />
                                <span className={dotClass(Boolean(coach.scheduleSent))} />
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  ) : null}
                  <section className="mt-4 space-y-2">
                    <AgeFilter value={ageFilter} onChange={setAgeFilter} />
                    <div className="flex items-center justify-between gap-2 px-3">
                      <h3 className="font-display text-lg font-bold uppercase">Not registered</h3>
                      <span className="w-16 shrink-0 text-center text-[9px] font-bold uppercase leading-none text-muted">Invited</span>
                    </div>
                    {openCoaches.length === 0 ? (
                      <p className="text-sm text-muted">{ageFilter === "All" ? "No other coaches." : "No coaches in that age."}</p>
                    ) : (
                      <ul className="space-y-2">
                        {openCoaches.map((coach) => {
                          const phone = hasPhone(coach.phone);
                          const on = picked.includes(coach.userId);
                          return (
                            <li
                              key={coach.userId}
                              className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2"
                              onClick={() => (kind ? togglePick(coach.userId) : textOne(coach.userId))}
                            >
                              {kind ? (
                                <button
                                  type="button"
                                  aria-pressed={on}
                                  aria-label={on ? `Remove ${coach.name}` : `Include ${coach.name}`}
                                  disabled={!phone}
                                  onClick={(eventClick) => {
                                    eventClick.stopPropagation();
                                    togglePick(coach.userId);
                                  }}
                                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${on ? "border-[#1DB954] bg-[#1DB954]" : "border-line bg-white"} disabled:opacity-40`}
                                >
                                  {on ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
                                </button>
                              ) : null}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold">{coach.name}</p>
                                <p className="truncate text-xs text-muted">
                                  {coach.teams.length > 0
                                    ? coach.teams.map((team) => (team.ageGroup ? `${team.name} · ${team.ageGroup}` : team.name)).join(", ")
                                    : "No team"}
                                  {!phone ? " · No cell number" : ""}
                                </p>
                              </div>
                              <div className="grid w-16 shrink-0 place-items-center">
                                <span className={dotClass(Boolean(coach.invited))} />
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>
                </>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function TextKind({ on, onClick, children }: { on: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-9 rounded-md border px-2 text-sm font-semibold ${on ? "border-[#1a1a1a] bg-[#1a1a1a] text-white" : "border-line bg-white text-fg"}`}
    >
      {children}
    </button>
  );
}

function reminderChoiceLabel(choice: "interested" | "maybe" | "no" | null): string {
  if (choice === "interested") return "Registered";
  if (choice === "maybe") return "Not sure yet";
  if (choice === "no") return "Not interested";
  return "No response";
}

export function ReminderTextSheet({
  weekendId,
  includeNotInterested,
  onClose,
}: {
  weekendId: number;
  includeNotInterested: boolean;
  onClose: () => void;
}) {
  const [view, setView] = useState<ReminderTextList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState<string[]>([]);
  const [ageFilter, setAgeFilter] = useState("All");
  const sentAsk = useAskIfSent();

  useEffect(() => {
    let cancel = false;
    openReminderTexts({ data: { weekendId, includeNotInterested } })
      .then((next) => {
        if (!cancel) setView(next);
      })
      .catch((err: unknown) => {
        if (!cancel) setError(err instanceof Error ? err.message : "Could not open that list.");
      });
    return () => {
      cancel = true;
    };
  }, [weekendId, includeNotInterested]);

  if (typeof document === "undefined") return null;
  const link = view ? `${window.location.origin}/interest?e=${weekendId}` : "";
  const people: CoachTextPerson[] = (view?.coaches ?? []).map((coach) => ({
    userId: coach.userId,
    name: coach.name,
    phone: coach.phone,
    teams: coach.teams,
    opened: opened.includes(coach.userId),
  }));
  const groups = coachTextGroups(people).filter((group) => showsEveryAge(ageFilter) || group.age === ageFilter);
  const choiceOf = new Map((view?.coaches ?? []).map((coach) => [coach.userId, coach.choice]));

  function textCoach(coach: CoachTextPerson, teamNames: string[]) {
    if (!view) return;
    const choice = choiceOf.get(coach.userId) ?? null;
    const body = coachReminderBody({
      choice,
      name: view.name,
      noteName: view.payName,
      startDate: view.startDate,
      endDate: view.endDate,
      link: choice === "interested" ? `${window.location.origin}/weekends/${weekendId}` : link,
      feeCents: view.teamFeeCents,
      teamNames,
    });
    const href = coachSmsHref(coach.phone || "", body);
    if (!href) return;
    sentAsk.expectReturn({ userId: coach.userId, name: coach.name });
    openSms(href);
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-scrim sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Remind coaches"
        className="flex max-h-[88dvh] w-full max-w-md flex-col rounded-t-lg border border-line bg-bg text-fg shadow-lg sm:rounded-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="font-display text-2xl font-bold uppercase leading-tight">Remind coaches</h2>
          <Button type="button" variant="ghost" className="px-2 text-muted" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="space-y-4 overflow-y-auto px-4 py-3">
          {error ? <p className="rounded-md bg-warn-bg px-3 py-2 text-sm">{error}</p> : null}
          {!view && !error ? <p className="text-sm text-muted">Loading coaches…</p> : null}
          {view ? (
            <>
              {sentAsk.ask ? (
                <SentAsk
                  name={sentAsk.ask.name}
                  onNo={sentAsk.dismiss}
                  onYes={() => {
                    const userId = sentAsk.ask?.userId;
                    if (userId) setOpened((current) => (current.includes(userId) ? current : [...current, userId]));
                    sentAsk.dismiss();
                  }}
                />
              ) : null}
              <p className="text-sm">The note matches what each coach already picked. Tap Text, then Send in Messages.</p>
              <AgeFilter value={ageFilter} onChange={setAgeFilter} />
              {groups.length === 0 ? <p className="text-sm text-muted">{ageFilter === "All" ? "No coaches on the app yet." : "No coaches in that age."}</p> : null}
              {groups.map((group) => (
                <section key={group.age} className="space-y-2">
                  <h3 className="font-display text-lg font-bold uppercase">{group.age}</h3>
                  {group.coaches.map((coach) => {
                    const teams = coach.teams.filter((team) => (group.age === "No age" ? !team.ageGroup : team.ageGroup === group.age));
                    const choice = choiceOf.get(coach.userId) ?? null;
                    const body = coachReminderBody({
                      choice,
                      name: view.name,
                      noteName: view.payName,
                      startDate: view.startDate,
                      endDate: view.endDate,
                      link: choice === "interested" ? `${window.location.origin}/weekends/${weekendId}` : link,
                      feeCents: view.teamFeeCents,
                      teamNames: teams.map((team) => team.name),
                    });
                    const href = coachSmsHref(coach.phone || "", body);
                    return (
                      <div key={`${group.age}-${coach.userId}`} className="flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{coach.name}</p>
                          <p className="truncate text-xs text-muted">
                            {reminderChoiceLabel(choiceOf.get(coach.userId) ?? null)}
                            {teams.length > 0 ? ` · ${teams.map((team) => team.name).join(", ")}` : ""}
                          </p>
                        </div>
                        {href ? (
                          <Button type="button" size="sm" variant={coach.opened ? "outline" : "default"} className="shrink-0 px-3" onClick={() => textCoach(coach, teams.map((team) => team.name))}>
                            {coach.opened ? "Sent" : "Text"}
                          </Button>
                        ) : (
                          <span className="shrink-0 text-xs font-semibold text-muted">No cell number</span>
                        )}
                      </div>
                    );
                  })}
                </section>
              ))}
            </>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
