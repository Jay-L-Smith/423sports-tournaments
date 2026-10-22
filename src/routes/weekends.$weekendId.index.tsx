import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SectionLink, WeekendAdminFrame, bumpWeekend } from "@/components/weekend-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MondayDateInput } from "@/components/monday-date-input";
import { CoachTextSheet, EventFinishText, ReminderTextSheet } from "@/components/coach-text-sheet";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  deleteWeekend,
  listWeekends,
  promoteTournament,
  resolveSeedConflict,
  updateAnnouncedEvent,
  type Weekend,
  type WeekendDetail,
} from "@/lib/pbi/api";
import { ELIMINATION_LABELS } from "@/lib/pbi/rules";
import {
  AGE_GROUPS,
  formatAgeGroups,
  formatTeamFee,
  formatWeekdayLong,
  formatWeekendRange,
  neededToFinish,
  seasonFromDate,
} from "@/lib/pbi/weekends";

export const Route = createFileRoute("/weekends/$weekendId/")({
  component: TournamentHubPage,
});

function EventEditForm({
  detail,
  hosted,
  onClose,
}: {
  detail: WeekendDetail;
  hosted: Weekend[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(detail.name);
  const [startDate, setStartDate] = useState(detail.startDate);
  const [endDate, setEndDate] = useState(detail.endDate);
  const [formError, setFormError] = useState<string | null>(null);
  const [matchAsk, setMatchAsk] = useState(false);
  const outside = hosted.filter((item) => item.startDate < startDate || item.endDate > endDate);
  const save = useMutation({
    mutationFn: (matchTournaments: boolean) =>
      updateAnnouncedEvent({
        data: {
          weekendId: detail.id,
          name: name.trim(),
          startDate,
          endDate,
          matchTournaments,
        },
      }),
    onSuccess: async () => {
      bumpWeekend(queryClient, detail.id);
      await queryClient.invalidateQueries({ queryKey: ["schedule"] });
      await queryClient.invalidateQueries({ queryKey: ["season-cards"] });
      await queryClient.invalidateQueries({ queryKey: ["season-plan"] });
      onClose();
    },
  });
  function submit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (outside.length > 0) {
      setMatchAsk(true);
      return;
    }
    setMatchAsk(false);
    save.mutate(false);
  }
  const errorText = formError ?? (save.error instanceof Error ? save.error.message : save.error ? "Could not save that event." : null);
  const matchNames = outside.map((item) => item.name).join(", ");
  const matchDays = startDate === endDate ? formatWeekdayLong(startDate) : `${formatWeekdayLong(startDate)}–${formatWeekdayLong(endDate)}`;
  return (
    <form noValidate onSubmit={submit} className="space-y-3">
      <label className="block space-y-1 text-sm font-semibold">
        Name
        <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} autoComplete="off" />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block space-y-1 text-sm font-semibold">
          First day
          <MondayDateInput
            value={startDate}
            withWeekday
            onChange={(next) => {
              setMatchAsk(false);
              setStartDate(next);
              if (endDate && next && endDate < next) setEndDate(next);
            }}
          />
        </label>
        <label className="block space-y-1 text-sm font-semibold">
          Last day
          <MondayDateInput
            value={endDate}
            min={startDate}
            withWeekday
            onChange={(next) => {
              setMatchAsk(false);
              setEndDate(next);
            }}
          />
        </label>
      </div>
      {matchAsk && outside.length > 0 ? (
        <div className="rounded-md bg-warn-bg px-3 py-2 text-sm">
          <p>
            {matchNames} would fall outside these dates. Change {outside.length === 1 ? "that tournament" : "those tournaments"} to {matchDays} so{" "}
            {outside.length === 1 ? "it matches" : "they match"} this event?
          </p>
          <p className="mt-1 text-muted">Games on a day that no longer fits move onto the new first or last day.</p>
          <div className="mt-3 flex flex-col gap-2">
            <Button type="button" disabled={save.isPending} onClick={() => save.mutate(true)}>
              {save.isPending ? "Saving…" : "Change the tournament dates"}
            </Button>
            <Button type="button" variant="outline" disabled={save.isPending} onClick={() => setMatchAsk(false)}>
              Leave the tournament dates
            </Button>
          </div>
        </div>
      ) : null}
      {errorText && !matchAsk ? (
        <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
          {errorText}
        </p>
      ) : null}
      {matchAsk ? null : (
        <Button type="submit" className="w-full" disabled={save.isPending || !name.trim() || !startDate || endDate < startDate}>
          {save.isPending ? "Saving…" : "Save"}
        </Button>
      )}
      <Button type="button" variant="ghost" className="w-full" disabled={save.isPending} onClick={onClose}>
        Cancel
      </Button>
    </form>
  );
}

function ageBreakdown(counts: Record<string, number> | undefined) {
  const known = AGE_GROUPS.filter((age) => (counts?.[age] ?? 0) > 0).map((age) => ({
    age,
    n: counts?.[age] ?? 0,
  }));
  const rest = Object.entries(counts ?? {})
    .filter(([age, count]) => count > 0 && !AGE_GROUPS.includes(age as (typeof AGE_GROUPS)[number]))
    .map(([age, n]) => ({ age, n }));
  return [...known, ...rest];
}

function fieldHint(teams: number, saved: number) {
  const need = teams >= 8 ? 2 : 1;
  if (saved === 0) return need === 1 ? "Add 1 field" : "Add 2 fields";
  if (saved < need) return `Need ${need} · ${saved} saved`;
  if (saved > need) return `Uses ${need} of ${saved}`;
  return need === 1 ? "1 field" : "2 fields";
}

function teamCountTone(count: number) {
  return count > 0 ? "text-[#3f8f5a]" : "text-[#b0893e]";
}

function fieldCountTone(teams: number, saved: number) {
  const need = teams >= 8 ? 2 : 1;
  return saved >= need ? "text-[#3f8f5a]" : "text-[#b0893e]";
}

function staffHintTone(hint: string) {
  return hint === "Staff set" ? "text-[#3f8f5a]" : "text-[#b0893e]";
}

function TournamentHubPage() {
  const { weekendId } = Route.useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const id = Number.parseInt(weekendId, 10);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteStep, setDeleteStep] = useState<"sure" | "notice" | null>(null);
  const confirmRef = useRef<HTMLDivElement>(null);
  const [editingEvent, setEditingEvent] = useState(false);
  const [coachText, setCoachText] = useState<{ batchId: number | null; weekendId: number } | null>(null);
  const [remindHold, setRemindHold] = useState<{ userId: string; name: string; teams: string[] }[] | null>(null);
  const [remindTexts, setRemindTexts] = useState<boolean | null>(null);
  const seedMut = useMutation({
    mutationFn: (input: { action: "keep" | "reseed"; confirm?: boolean }) =>
      resolveSeedConflict({ data: { weekendId: id, ...input } }),
    onSuccess: () => bumpWeekend(queryClient, id),
  });
  const deleteMut = useMutation({
    mutationFn: (notify: boolean) => deleteWeekend({ data: { weekendId: id, notify } }),
    onSuccess: async () => {
      await navigate({ to: "/" });
      await queryClient.invalidateQueries({ queryKey: ["weekends"] });
      await queryClient.invalidateQueries({ queryKey: ["season-cards"] });
      await queryClient.invalidateQueries({ queryKey: ["season-plan"] });
      await queryClient.invalidateQueries({ queryKey: ["my-schedule"] });
      await queryClient.invalidateQueries({ queryKey: ["my-teams"] });
    },
  });
  useEffect(() => {
    if (!confirmDelete && !deleteStep) return;
    confirmRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [confirmDelete, deleteStep]);
  const promoteMut = useMutation({
    mutationFn: (includeNotInterested: boolean) => promoteTournament({ data: { weekendId: id, includeNotInterested } }),
    onSuccess: async (result, includeNotInterested) => {
      if (result.blocked) {
        setRemindHold(result.notInterested);
        return;
      }
      setRemindHold(null);
      setRemindTexts(includeNotInterested);
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
  const weekendsQuery = useQuery({
    queryKey: ["weekends"],
    queryFn: () => listWeekends(),
  });

  return (
    <WeekendAdminFrame weekendId={weekendId} backTo="list" hideBack contained>
      {({ detail, readOnly, goBack }) => {
        const announced = detail.lifecycle === "announced";
        const textSeason =
          detail.season && detail.seasonYear ? { season: detail.season, year: detail.seasonYear } : seasonFromDate(detail.startDate);
        const error =
          (seedMut.error instanceof Error && seedMut.error.message) ||
          (deleteMut.error instanceof Error && deleteMut.error.message) ||
          (promoteMut.error instanceof Error && promoteMut.error.message) ||
          null;
        const hosted = (weekendsQuery.data ?? [])
          .filter(
            (weekend) =>
              weekend.id !== detail.id &&
              weekend.lifecycle !== "announced" &&
              weekend.startDate >= detail.startDate &&
              weekend.endDate <= detail.endDate,
          )
          .sort((a, b) => a.name.localeCompare(b.name));
        const flyer = detail.flyer ?? weekendsQuery.data?.find((item) => item.id === detail.id)?.flyer ?? null;
        return (
          <div className={flyer && !announced ? "flex h-full min-h-0 flex-col" : "h-full min-h-0 overflow-y-auto overscroll-y-contain"}>
            {announced ? (
            <div>
              <button type="button" onClick={goBack} className="text-sm font-semibold text-primary">
                Back
              </button>
              {editingEvent && !readOnly ? (
                <EventEditForm detail={detail} hosted={hosted} onClose={() => setEditingEvent(false)} />
              ) : (
                <>
                  <div className="mt-2 flex items-start justify-between gap-3">
                    <h1 className="font-display text-3xl font-bold uppercase leading-none">{detail.name}</h1>
                    {!readOnly ? (
                      <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setEditingEvent(true)}>
                        Edit
                      </Button>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm font-medium leading-tight">
                    {formatWeekendRange(detail.startDate, detail.endDate)}
                    {detail.teamFeeCents != null ? ` · ${formatTeamFee(detail.teamFeeCents)} per team` : ""}
                  </p>
                </>
              )}
            </div>
            ) : (
              <TournamentHero
                detail={detail}
                flyer={flyer}
                onBack={goBack}
                holdGameInfo={readOnly && !detail.sheetLocked}
                message={
                  textSeason && !readOnly ? (
                    <EventFinishText
                      season={textSeason.season}
                      year={textSeason.year}
                      weekendId={detail.id}
                      inline
                      force
                      className="h-7 min-h-0 rounded-full border-white/85 bg-transparent px-2.5 py-0 text-[11px] font-bold leading-none tracking-[0.06em] text-white hover:bg-white/10"
                      onOpen={(batchId) => setCoachText({ batchId, weekendId: detail.id })}
                    />
                  ) : null
                }
              />
            )}
            <div className={!readOnly && (remindHold || promoteMut.data || announced) ? "mt-3 space-y-3" : "hidden"}>
              {!readOnly && remindHold ? (
                <div className="rounded-md bg-warn-bg p-3">
                  <p className="text-sm font-semibold">
                    {remindHold.length === 1 ? "1 coach said maybe next time." : `${remindHold.length} coaches said maybe next time.`}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {remindHold.map((coach) => (
                      <li key={coach.userId} className="text-sm">
                        {coach.name}
                        {coach.teams.length > 0 ? <span className="text-muted"> · {coach.teams.join(", ")}</span> : null}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-sm">Sending anyway texts them that spots are still open if they change their mind, and puts that note in the app.</p>
                  <div className="mt-3 flex gap-2">
                    <Button type="button" variant="outline" className="flex-1" disabled={promoteMut.isPending} onClick={() => setRemindHold(null)}>
                      Don't send
                    </Button>
                    <Button type="button" className="flex-1" disabled={promoteMut.isPending} onClick={() => promoteMut.mutate(true)}>
                      {promoteMut.isPending ? "Sending…" : "Send anyway"}
                    </Button>
                  </div>
                </div>
              ) : !readOnly && promoteMut.data ? (
                <p className="text-sm text-muted">
                  {promoteMut.data.sent === 0 ? "No coaches on the app yet." : "Reminder is in the app. Send each text from the list."}
                </p>
              ) : null}
              {!readOnly && announced ? (
                <section className="space-y-2">
                  <div className="flex items-baseline gap-3">
                    <h2 className="font-display text-xl font-bold uppercase">Tournaments</h2>
                    <Link to="/weekends" search={{ add: 1, announce: detail.id }} className="text-sm font-medium text-[#2f89e6]">
                      {hosted.length === 0 ? "Create a Tournament" : "Create another Tournament"}
                    </Link>
                  </div>
                  {hosted.length === 0 ? (
                    <p className="text-sm text-muted">No tournaments for these dates yet.</p>
                  ) : (
                    <ul className={hosted.length > 1 ? "grid grid-cols-2 gap-2" : "space-y-2"}>
                      {hosted.map((weekend) => {
                        const ages = ageBreakdown(weekend.approvedByAge);
                        const needs = neededToFinish(weekend);
                        const teams = weekend.approvedCount === 1 ? "1 team" : `${weekend.approvedCount} teams`;
                        return (
                          <li key={weekend.id}>
                            <Link
                              to="/weekends/$weekendId"
                              params={{ weekendId: String(weekend.id) }}
                              className="block h-full rounded-lg border border-line bg-surface px-2.5 py-2.5"
                            >
                              <span className="block text-sm font-semibold leading-tight">{weekend.name}</span>
                              <span className="mt-1 block text-xs text-muted">{teams}</span>
                              {ages.length > 0 ? (
                                <span className="mt-1.5 flex flex-wrap gap-1">
                                  {ages.map((item) => (
                                    <span key={item.age} className="rounded bg-sheet-surface px-1.5 py-0.5 text-[11px] font-semibold">
                                      {item.age} <span className="text-muted">{item.n}</span>
                                    </span>
                                  ))}
                                </span>
                              ) : null}
                              {needs.length > 0 ? (
                                <span className="mt-1.5 block text-[11px] font-semibold leading-tight text-[#c9a227]">{needs.join(" · ")}</span>
                              ) : null}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              ) : null}
            </div>

            {!readOnly && detail.placeConflict ? (
              <div className="mt-4 rounded-md border border-line bg-surface p-3">
                <p className="text-sm font-semibold">A pool score can move a frozen seed.</p>
                <p className="mt-1 text-xs text-muted">Keep the original seeds, or reseed. Reseed asks again if bracket games already have a result.</p>
                <div className="mt-3 flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" disabled={seedMut.isPending} onClick={() => seedMut.mutate({ action: "keep" })}>
                    Keep original
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    disabled={seedMut.isPending}
                    onClick={() =>
                      seedMut.mutate({
                        action: "reseed",
                        confirm: seedMut.error instanceof Error && seedMut.error.message.includes("Confirm"),
                      })
                    }
                  >
                    {seedMut.error instanceof Error && seedMut.error.message.includes("Confirm") ? "Reseed anyway" : "Reseed"}
                  </Button>
                </div>
              </div>
            ) : null}

            {error ? (
              <p className="mt-3 rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
                {error}
              </p>
            ) : null}

            <div className={announced ? "" : flyer ? "-mx-4 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain bg-[#f7f6f4] px-4 pb-6 pt-2" : "-mx-4 flex flex-col bg-[#f7f6f4] px-4 pb-8 pt-3"}>
              {announced ? null : (
                <nav className="grid w-full grid-cols-2 gap-2" aria-label="Tournament sections">
                  <SectionLink
                    to="/weekends/$weekendId/edit"
                    weekendId={weekendId}
                    title="Details"
                    hint={detail.teamFeeCents == null ? "Name, dates, age, fee" : `${formatTeamFee(detail.teamFeeCents)} per team`}
                  />
                  <SectionLink
                    to="/weekends/$weekendId/rules"
                    weekendId={weekendId}
                    title="Rules"
                    hint={ELIMINATION_LABELS[detail.rules.elimination]}
                  />
                  <SectionLink
                    to="/weekends/$weekendId/teams"
                    weekendId={weekendId}
                    title="Teams"
                    hint={detail.approvedCount === 0 ? "No teams yet" : `${detail.approvedCount}/${detail.maxTeams} in`}
                    hintClassName={teamCountTone(detail.approvedCount)}
                  />
                  <SectionLink
                    to="/weekends/$weekendId/locations"
                    weekendId={weekendId}
                    title="Fields"
                    hint={fieldHint(detail.approvedCount, detail.locations.length)}
                    hintClassName={fieldCountTone(detail.approvedCount, detail.locations.length)}
                  />
                  {!readOnly ? (
                    <SectionLink
                      to="/weekends/$weekendId/staff"
                      weekendId={weekendId}
                      title="Staff"
                      hint={detail.staffHint}
                      hintClassName={staffHintTone(detail.staffHint)}
                    />
                  ) : null}
                  <SectionLink
                    to="/weekends/$weekendId/eligibility"
                    weekendId={weekendId}
                    title="Eligibility"
                    hint={detail.ageGroups.length > 0 ? formatAgeGroups(detail.ageGroups) : "Age chart"}
                  />
                </nav>
              )}

              {readOnly ? null : announced ? (
                deleteStep === "sure" ? (
                  <div ref={confirmRef} className="mt-6 rounded-md bg-warn-bg p-3">
                    <p className="text-sm font-semibold">Delete this event?</p>
                    <p className="mt-1 text-sm text-muted">This takes {detail.name} off the schedule. You can put it back for 7 days. After that, it is gone.</p>
                    <div className="mt-3 flex gap-2">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setDeleteStep(null)}>
                        Keep it
                      </Button>
                      <Button type="button" variant="danger" className="flex-1" onClick={() => setDeleteStep("notice")}>
                        Yes, delete it
                      </Button>
                    </div>
                  </div>
                ) : deleteStep === "notice" ? (
                  <div ref={confirmRef} className="mt-6 rounded-md bg-warn-bg p-3">
                    <p className="text-sm font-semibold">Send every coach a notice that this weekend was cancelled?</p>
                    <div className="mt-3 flex flex-col gap-2">
                      <Button type="button" variant="danger" disabled={deleteMut.isPending} onClick={() => deleteMut.mutate(true)}>
                        {deleteMut.isPending ? "Deleting…" : "Send notice"}
                      </Button>
                      <Button type="button" variant="outline" disabled={deleteMut.isPending} onClick={() => deleteMut.mutate(false)}>
                        Delete without a notice
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button type="button" variant="ghost" className="mt-4 w-full text-muted" onClick={() => setDeleteStep("sure")}>
                    Delete event
                  </Button>
                )
              ) : confirmDelete ? (
                <div ref={confirmRef} className="mt-6 rounded-md bg-warn-bg p-3">
                  <p className="text-sm font-semibold">Delete {detail.name}?</p>
                  <p className="mt-1 text-sm text-muted">Teams, the bracket, and scores come off the board. You can put it back for 7 days. After that, it is gone.</p>
                  <div className="mt-3 flex gap-2">
                    <Button type="button" variant="outline" className="flex-1" disabled={deleteMut.isPending} onClick={() => setConfirmDelete(false)}>
                      Keep it
                    </Button>
                    <Button type="button" variant="danger" className="flex-1" disabled={deleteMut.isPending} onClick={() => deleteMut.mutate(false)}>
                      {deleteMut.isPending ? "Deleting…" : "Delete"}
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="mt-2 w-full py-1.5 text-center text-[13px] font-bold uppercase tracking-[0.14em] text-[#8d8d8d]"
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete tournament
                </button>
              )}
            </div>
            {!readOnly && coachText && textSeason ? (
              <CoachTextSheet
                season={textSeason.season}
                year={textSeason.year}
                batchId={coachText.batchId}
                weekendId={coachText.weekendId}
                onClose={() => setCoachText(null)}
              />
            ) : null}
            {!readOnly && remindTexts != null ? (
              <ReminderTextSheet weekendId={detail.id} includeNotInterested={remindTexts} onClose={() => setRemindTexts(null)} />
            ) : null}
          </div>
        );
      }}
    </WeekendAdminFrame>
  );
}

function TournamentHero({
  detail,
  flyer,
  onBack,
  message,
  holdGameInfo,
}: {
  detail: WeekendDetail;
  flyer: string | null;
  onBack: () => void;
  message: ReactNode;
  holdGameInfo: boolean;
}) {
  const [held, setHeld] = useState(false);
  const gameInfo = holdGameInfo ? (
    <button type="button" onClick={() => setHeld(true)} className="hub-game mt-3.5 flex w-full items-center justify-center">
      GAME INFO
    </button>
  ) : (
    <Link
      to="/bracket/$weekendId"
      params={{ weekendId: String(detail.id) }}
      search={{ live: false }}
      className="hub-game mt-3.5 flex w-full items-center justify-center"
    >
      GAME INFO
    </Link>
  );
  return (
    <div className={`hub-hero relative -mx-4 overflow-hidden px-5 text-white ${flyer ? "hub-hero-flyer flex min-h-0 flex-1 flex-col" : "pt-1"}`}>
      {flyer ? (
        <>
          <img src={flyer} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center" />
        </>
      ) : null}
      {flyer ? (
        <>
          <div className="absolute inset-x-0 top-0 z-[1] bg-gradient-to-b from-black/80 via-black/45 to-transparent px-5 pb-10 pt-1">
            <div className="flex items-center justify-between gap-3">
              <button type="button" onClick={onBack} className="text-[15px] font-semibold text-[#7eb6ff]">
                Back
              </button>
              {message}
            </div>
            <h1 className="mt-1 text-[26px] font-extrabold uppercase leading-[1.05] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">{detail.name}</h1>
            <p className="mt-0.5 text-[14px] text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
              {formatWeekendRange(detail.startDate, detail.endDate)}
              {detail.teamFeeCents != null ? ` · ${formatTeamFee(detail.teamFeeCents)} per team` : ""}
            </p>
            <p className="mt-0.5 text-[14px] text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
              {formatAgeGroups(detail.ageGroups) || "No ages yet"} · {detail.approvedCount}/{detail.maxTeams} in
            </p>
          </div>
          <div className="absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-black/85 via-black/50 to-transparent px-5 pb-2 pt-10">
            {gameInfo}
            <p className="mt-1.5 text-center text-[11px] font-semibold tracking-[0.22em] text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
              STANDINGS · SCORES · BRACKET
            </p>
          </div>
        </>
      ) : (
        <div>
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={onBack} className="text-[15px] font-semibold text-[#7eb6ff]">
              Back
            </button>
            {message}
          </div>
          <h1 className="mt-2.5 text-[34px] font-extrabold uppercase leading-[1.05] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">{detail.name}</h1>
          <p className="mt-1 text-[15px] text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
            {formatWeekendRange(detail.startDate, detail.endDate)}
            {detail.teamFeeCents != null ? ` · ${formatTeamFee(detail.teamFeeCents)} per team` : ""}
          </p>
          <p className="mt-2 text-[15px] text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
            {formatAgeGroups(detail.ageGroups) || "No ages yet"} · {detail.approvedCount}/{detail.maxTeams} in
          </p>
          <img src="/wordmark.png" alt="" className="mx-auto mt-3.5 block w-[168px] bg-transparent" />
          {gameInfo}
          <p className="mb-4 mt-2.5 text-center text-[11px] font-semibold tracking-[0.22em] text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
            STANDINGS · SCORES · BRACKET
          </p>
        </div>
      )}
      {held ? (
        <ConfirmDialog
          okOnly
          text="Pool play, standings, and the bracket will show once this tournament is locked."
          onNo={() => setHeld(false)}
          onYes={() => setHeld(false)}
        />
      ) : null}
    </div>
  );
}
