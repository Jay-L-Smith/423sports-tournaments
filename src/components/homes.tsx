import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { FieldBand } from "@/components/field-band";
import { HomeAction } from "@/components/coming-soon";
import { CoachDeniedCard } from "@/components/coach-denied";
import { Button } from "@/components/ui/button";
import { EventAgeInterest } from "@/components/event-age-interest";
import { archivePlanningYear, listDeletedWeekends, listMyCoachTeams, listMyTeams, listMyTournamentResponses, listSeasonCards, listTournamentRoster, listWeekends, restoreWeekend, type DeletedWeekend, type PendingRequest, type PendingTeam, type Profile, type RegisteredTeam, type SeasonCard, type SeasonRollover, type Weekend } from "@/lib/pbi/api";
import { seasonLabel, defaultSeasonWindow, formatAgeGroups, formatMonthDay, formatSeasonSpan, formatTeamFee, formatWeekendRange, FIRST_SEASON_YEAR, isoDateFromLocal, neededToFinish, addDays, registrationClosed, suggestTournamentName, tournamentPastAt, type Season } from "@/lib/pbi/weekends";
import { MAX_COACH_REQUESTS } from "@/lib/pbi/coach-request";
import { ROLE_COPY } from "@/lib/pbi/roles";
import { formatPhoneInput } from "@/lib/utils";

function tournamentPast(weekend: Weekend, now: Date): boolean {
  return tournamentPastAt(weekend.endDate, now);
}

function tournamentLive(weekend: Weekend): boolean {
  return weekend.sheetLocked || weekend.hasScoredGame || weekend.hasChampion;
}

function adminBoardStatus(weekend: Weekend, now: Date): "past" | "live" | "ready" | "needs" | null {
  if (weekend.lifecycle === "announced") return null;
  if (tournamentPast(weekend, now)) return "past";
  if (tournamentLive(weekend)) return "live";
  if (neededToFinish(weekend).length > 0) return "needs";
  return "ready";
}


function StatusBanner({ profile }: { profile: Profile }) {
  if (profile.requestStatus === "pending") {
    const label = profile.requestedRole === "admin" ? "Admin" : "Coach";
    return (
      <Link to="/notifications" className="block rounded-md bg-warn-bg px-4 py-3 text-fg">
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
      <Link to="/notifications" className="block rounded-md bg-warn-bg px-4 py-3 text-sm font-medium text-fg">
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
    </div>
  );
}

export function ScheduleLoading() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center" role="status" aria-live="polite">
      <p className="font-display text-sm font-bold uppercase tracking-[0.22em]">Loading</p>
      <div className="mt-3 h-1 w-36 overflow-hidden rounded-full bg-black/15">
        <div className="schedule-load-bar h-full w-1/3 rounded-full bg-[#1c1c1c]" />
      </div>
    </div>
  );
}

export function CoachHome() {
  const seasonsQuery = useQuery({ queryKey: ["season-cards"], queryFn: () => listSeasonCards() });
  const weekendsQuery = useQuery({ queryKey: ["weekends"], queryFn: () => listWeekends() });
  const teamsQuery = useQuery({ queryKey: ["my-teams"], queryFn: () => listMyTeams() });
  const signupQuery = useQuery({ queryKey: ["my-teams", "signup"], queryFn: () => listMyCoachTeams() });
  const repliesQuery = useQuery({ queryKey: ["tournament-responses"], queryFn: () => listMyTournamentResponses() });
  if (seasonsQuery.isPending || weekendsQuery.isPending || teamsQuery.isPending || signupQuery.isPending || repliesQuery.isPending) return <ScheduleLoading />;
  const declined = (repliesQuery.data ?? []).filter((row) => row.choice === "no").map((row) => row.weekendId);
  const coachAges = (signupQuery.data ?? []).map((team) => team.ageGroup).filter((age): age is string => Boolean(age));
  return (
    <AdminCalendarHome
      weekends={weekendsQuery.data ?? []}
      seasons={seasonsQuery.data?.cards ?? []}
      rollover={null}
      readOnly
      teams={teamsQuery.data ?? []}
      declined={declined}
      coachAges={coachAges}
    />
  );
}

function fallbackSeasonCards(): SeasonCard[] {
  return cardsForYear(FIRST_SEASON_YEAR, []);
}

function cardsForYear(year: number, existing: SeasonCard[]): SeasonCard[] {
  const have = existing.filter((card) => card.year === year);
  return (["spring", "summer", "fall"] as const).map((season) => {
    const saved = have.find((card) => card.season === season);
    if (saved) return saved;
    const window = defaultSeasonWindow(season, year);
    return {
      season,
      year,
      label: seasonLabel(season),
      startDate: window.startDate,
      endDate: window.endDate,
      windowLabel: formatSeasonSpan(window.startDate, window.endDate),
      announcedCount: 0,
      pastDeadline: false,
      deadlineCopy: "",
    };
  });
}

function scheduleYears(planningYear: number, weekends: Weekend[]): number[] {
  const found = new Set<number>([planningYear, planningYear + 1]);
  for (const weekend of weekends) {
    const fromDate = Number(weekend.startDate.slice(0, 4));
    if (weekend.seasonYear && weekend.seasonYear >= FIRST_SEASON_YEAR) found.add(weekend.seasonYear);
    if (fromDate >= FIRST_SEASON_YEAR && fromDate < 2100) found.add(fromDate);
  }
  return [...found].sort((a, b) => b - a);
}

function inSeasonWindow(weekend: Weekend, start: string, end: string) {
  return Boolean(start && end) && weekend.startDate <= end && weekend.endDate >= start;
}

export function ArchiveYearPrompt({ rollover }: { rollover: SeasonRollover }) {
  const queryClient = useQueryClient();
  const [sure, setSure] = useState(false);
  const archive = useMutation({
    mutationFn: () => archivePlanningYear(),
    onSuccess: async () => {
      setSure(false);
      await queryClient.invalidateQueries({ queryKey: ["season-cards"] });
      await queryClient.invalidateQueries({ queryKey: ["season-plan"] });
      await queryClient.invalidateQueries({ queryKey: ["weekends"] });
    },
  });
  if (!rollover) return null;
  const error = archive.error instanceof Error ? archive.error.message : null;
  return (
    <div className="space-y-3 rounded-lg border border-line bg-warn-bg px-3 py-3" role="status">
      <p className="text-sm font-semibold">
        Fall ended {formatMonthDay(rollover.fallEnd)}. Archive {rollover.year} and open {rollover.nextYear}?
      </p>
      <p className="text-sm text-muted">
        {rollover.year} stays saved. It comes off these calendars. {rollover.nextYear} starts empty.
      </p>
      {error ? <p className="text-sm">{error}</p> : null}
      {sure ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={archive.isPending} onClick={() => archive.mutate()}>
            {archive.isPending ? "Archiving…" : `Yes, archive ${rollover.year}`}
          </Button>
          <Button type="button" variant="outline" disabled={archive.isPending} onClick={() => setSure(false)}>
            Not yet
          </Button>
        </div>
      ) : (
        <Button type="button" onClick={() => setSure(true)}>
          Archive {rollover.year}
        </Button>
      )}
    </div>
  );
}


const HOME_WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

const SCHEDULE_VIEW_KEY = "pbi-schedule-view";

type SavedSchedule = {
  year: number | null;
  seasonKey: string;
  focusMonth: string | null;
  countMonth: string | null;
};

function readScheduleView(): SavedSchedule | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SCHEDULE_VIEW_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedSchedule;
    if (!parsed || typeof parsed.seasonKey !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function AdminHome({ weekends, seasons, rollover }: { weekends: Weekend[]; seasons: SeasonCard[]; rollover: SeasonRollover }) {
  return <AdminCalendarHome weekends={weekends} seasons={seasons} rollover={rollover} />;
}

function AdminCalendarHome({
  weekends,
  seasons,
  rollover,
  readOnly = false,
  teams = [],
  declined = [],
  coachAges = [],
}: {
  weekends: Weekend[];
  seasons: SeasonCard[];
  rollover: SeasonRollover;
  readOnly?: boolean;
  teams?: RegisteredTeam[];
  declined?: number[];
  coachAges?: string[];
}) {
  const cards = [...(seasons.length > 0 ? seasons : fallbackSeasonCards())].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const planningYear = cards[0]?.year ?? FIRST_SEASON_YEAR;
  const savedView = readScheduleView();
  const [browseYear, setBrowseYear] = useState<number | null>(savedView?.year ?? null);
  const year = browseYear ?? planningYear;
  const viewCards = cardsForYear(year, cards);
  const years = scheduleYears(planningYear, weekends);
  const today = isoDateFromLocal(new Date());
  const open = viewCards.find((card) => today >= card.startDate && today <= card.endDate) ?? viewCards[0];
  const [seasonKey, setSeasonKey] = useState(savedView?.seasonKey || (open ? `${open.season}-${open.year}` : ""));
  const [focusMonth, setFocusMonth] = useState<string | null>(savedView?.focusMonth ?? null);
  const [countMonth, setCountMonth] = useState<string | null>(savedView?.countMonth ?? null);
  useEffect(() => {
    sessionStorage.setItem(SCHEDULE_VIEW_KEY, JSON.stringify({ year: browseYear, seasonKey, focusMonth, countMonth }));
  }, [browseYear, seasonKey, focusMonth, countMonth]);
  const onCountMonth = useCallback((month: string) => setCountMonth(month), []);
  const card = viewCards.find((item) => `${item.season}-${item.year}` === seasonKey) ?? viewCards[0];
  const seasonIndex = card ? viewCards.findIndex((item) => item.season === card.season && item.year === card.year) : -1;
  function openSeason(item: SeasonCard, month: string | null) {
    setSeasonKey(`${item.season}-${item.year}`);
    setFocusMonth(month);
    const key = month ?? (today >= item.startDate && today <= item.endDate ? today : item.startDate).slice(0, 7);
    setCountMonth(key);
  }
  function chooseYear(next: number) {
    const nextCards = cardsForYear(next, cards);
    const match = nextCards.find((item) => item.season === card?.season) ?? nextCards[0];
    if (!match) return;
    const month = today.slice(5, 7);
    const stamp = `${next}-${month}-01`;
    setBrowseYear(next === planningYear ? null : next);
    setSeasonKey(`${match.season}-${match.year}`);
    setFocusMonth(stamp >= match.startDate && stamp <= match.endDate ? `${next}-${month}` : match.startDate.slice(0, 7));
    setCountMonth(stamp >= match.startDate && stamp <= match.endDate ? `${next}-${month}` : match.startDate.slice(0, 7));
  }
  const shownMonth =
    countMonth ?? (card ? (today >= card.startDate && today <= card.endDate ? today : card.startDate).slice(0, 7) : null);
  return (
    <div className={readOnly ? "flex h-full min-h-0 flex-1 flex-col pt-4" : "-mt-2 flex min-h-[calc(100dvh-11rem)] flex-col"}>
      <div className={readOnly ? "shrink-0" : "space-y-3"}>
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-4xl font-bold uppercase leading-none">Schedule</h1>
          {readOnly ? (
            <YearMenu year={year} years={years} onYear={chooseYear} />
          ) : (
            <SeasonDashboard weekends={weekends} cards={viewCards} monthKey={shownMonth} layout="grid" readOnly={readOnly} teams={teams} />
          )}
        </div>
        {readOnly ? null : (
        <div className="grid grid-cols-3 gap-1">
          {viewCards.map((item) => {
            const on = card?.season === item.season && card.year === item.year;
            return (
              <button
                key={`${item.season}-${item.year}`}
                type="button"
                onClick={() => openSeason(item, null)}
                className={`rounded-full px-1 py-0.5 text-center text-sm font-bold uppercase ${on ? "bg-fg text-bg" : "text-muted"}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        )}
        {readOnly ? null : <ArchiveYearPrompt rollover={rollover} />}
      </div>
      {readOnly ? (
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-4">
          {card ? (
            <HomeMonth
              key={`${card.season}-${card.year}-${focusMonth ?? "open"}`}
              startDate={card.startDate}
              endDate={card.endDate}
              weekends={weekends}
              season={card.season}
              year={card.year}
              initialMonth={focusMonth}
              readOnly={readOnly}
              teams={teams}
              declined={declined}
              coachAges={coachAges}
              years={years}
              onYear={chooseYear}
              onMonth={onCountMonth}
              canPrev={seasonIndex > 0}
              canNext={seasonIndex >= 0 && seasonIndex < viewCards.length - 1}
              onEdge={(dir) => {
                const next = viewCards[seasonIndex + dir];
                if (!next) return;
                openSeason(next, dir > 0 ? next.startDate.slice(0, 7) : next.endDate.slice(0, 7));
              }}
            />
          ) : null}
        </div>
      ) : (
        <>
          {card ? (
            <HomeMonth
              key={`${card.season}-${card.year}-${focusMonth ?? "open"}`}
              startDate={card.startDate}
              endDate={card.endDate}
              weekends={weekends}
              season={card.season}
              year={card.year}
              initialMonth={focusMonth}
              readOnly={readOnly}
              teams={teams}
              declined={declined}
              coachAges={coachAges}
              years={years}
              onYear={chooseYear}
              onMonth={onCountMonth}
              canPrev={seasonIndex > 0}
              canNext={seasonIndex >= 0 && seasonIndex < viewCards.length - 1}
              onEdge={(dir) => {
                const next = viewCards[seasonIndex + dir];
                if (!next) return;
                openSeason(next, dir > 0 ? next.startDate.slice(0, 7) : next.endDate.slice(0, 7));
              }}
            />
          ) : null}
          <FieldBand src="/photos/field-diamond.jpg" />
        </>
      )}
    </div>
  );
}

function HomeMonth({
  startDate,
  endDate,
  weekends,
  season,
  year,
  initialMonth,
  readOnly = false,
  teams = [],
  declined = [],
  coachAges = [],
  years,
  onYear,
  onMonth,
  canPrev,
  canNext,
  onEdge,
}: {
  startDate: string;
  endDate: string;
  weekends: Weekend[];
  season: Season;
  year: number;
  initialMonth: string | null;
  readOnly?: boolean;
  teams?: RegisteredTeam[];
  declined?: number[];
  coachAges?: string[];
  years?: number[];
  onYear?: (year: number) => void;
  onMonth?: (month: string) => void;
  canPrev: boolean;
  canNext: boolean;
  onEdge: (dir: -1 | 1) => void;
}) {
  const navigate = useNavigate();
  const today = isoDateFromLocal(new Date());
  const [monthKey, setMonthKey] = useState(() => initialMonth ?? (today >= startDate && today <= endDate ? today : startDate).slice(0, 7));
  const [picked, setPicked] = useState<string | null>(null);
  const [eventPopup, setEventPopup] = useState<Weekend | null>(null);
  const [cardName, setCardName] = useState("");
  const [cardStart, setCardStart] = useState("");
  const [cardEnd, setCardEnd] = useState("");
  const [pastOpen, setPastOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);
  const months = homeMonths(startDate, endDate);
  const visible = months.find((month) => homeMonthKey(month) === monthKey) ?? months[0] ?? null;
  const cells = visible ? homeMonthCells(visible.year, visible.month) : [];
  const monthIndex = visible ? months.findIndex((month) => homeMonthKey(month) === homeMonthKey(visible)) : -1;
  const scheduled = weekends
    .filter((weekend) => weekend.startDate <= endDate && weekend.endDate >= startDate)
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id - b.id);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const monthKeyVisible = visible ? homeMonthKey(visible) : "";
  const monthEvents = scheduled.filter(
    (weekend) =>
      weekend.lifecycle !== "announced" &&
      weekend.startDate.slice(0, 7) <= monthKeyVisible &&
      weekend.endDate.slice(0, 7) >= monthKeyVisible,
  );
  const shown = picked
    ? monthEvents.filter((weekend) => weekend.startDate <= picked && weekend.endDate >= picked)
    : monthEvents;
  const boardNow = new Date();
  const active = shown.filter((event) => adminBoardStatus(event, boardNow) !== "past");
  const past = shown.filter((event) => adminBoardStatus(event, boardNow) === "past");
  const monthName = visible
    ? new Date(visible.year, visible.month - 1, 1).toLocaleDateString("en-US", { month: "long" })
    : "this month";

  useEffect(() => {
    if (monthKeyVisible) onMonth?.(monthKeyVisible);
  }, [monthKeyVisible, onMonth]);

  useEffect(() => {
    if (!picked) return;
    const yearKey = String(year);
    const thisYear = weekends.filter((weekend) => weekend.seasonYear === year || weekend.startDate.startsWith(yearKey));
    const inSeason = thisYear.filter((weekend) => weekend.season === season);
    setCardName(suggestTournamentName(season, year, thisYear.map((weekend) => weekend.name), inSeason.length));
    setCardStart(picked);
    setCardEnd(addDays(picked, 1));
  }, [picked, season, year, weekends]);

  function openCreate() {
    void navigate({
      to: "/weekends",
      search: {
        add: 1,
        name: cardName.trim(),
        start: cardStart,
        end: cardEnd,
        season,
        year,
      },
    });
  }

  function stepMonth(dir: -1 | 1) {
    const following = months[monthIndex + dir];
    if (!following) {
      onEdge(dir);
      return;
    }
    setMonthKey(homeMonthKey(following));
    setPicked(null);
  }

  function openCoachEvent(event: Weekend) {
    if (coachIsIn(event.id, teams)) {
      void navigate({ to: "/weekends/$weekendId", params: { weekendId: String(event.id) } });
      return;
    }
    setEventPopup(event);
  }

  if (readOnly) {
    const events = weekends.filter(
      (weekend) => weekend.lifecycle !== "announced" && Number(weekend.startDate.slice(0, 4)) === year,
    );
    const passed = new Set(declined);
    const buckets = {
      registered: [] as Weekend[][],
      open: [] as Weekend[][],
      skipped: [] as Weekend[][],
      past: [] as Weekend[][],
    };
    for (const group of groupCoachEvents(events)) {
      const spot = coachGroupSpot(group, teams, passed, boardNow);
      if (spot) buckets[spot].push(group);
    }
    const byStart = (a: Weekend[], b: Weekend[]) => groupStart(a).localeCompare(groupStart(b));
    buckets.registered.sort(byStart);
    buckets.open.sort(byStart);
    buckets.skipped.sort(byStart);
    buckets.past.sort((a, b) => groupStart(b).localeCompare(groupStart(a)));
    const current = [...buckets.registered, ...buckets.open, ...buckets.skipped].sort(byStart);
    return (
      <div className="space-y-5">
        {current.length === 0 ? (
          <p className="text-sm text-muted">Nothing open right now.</p>
        ) : (
          <div data-tour="events">
            <CoachEventList groups={current} teams={teams} declined={passed} coachAges={coachAges} onOpen={openCoachEvent} />
          </div>
        )}
        {buckets.past.length > 0 ? (
          <CoachFold
            title="Past"
            count={buckets.past.length}
            empty=""
            open={pastOpen}
            onToggle={() => setPastOpen((value) => !value)}
            tone="bg-transparent"
          >
            <CoachEventList groups={buckets.past} teams={teams} declined={passed} coachAges={coachAges} onOpen={openCoachEvent} />
          </CoachFold>
        ) : null}
        {eventPopup ? <CoachEventDialog event={eventPopup} onClose={() => setEventPopup(null)} /> : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visible ? (
        <section
          data-tour={readOnly ? "calendar" : undefined}
          className="touch-pan-y"
          onPointerDown={(event) => {
            if (event.pointerType === "mouse" && event.button !== 0) return;
            swipe.current = { x: event.clientX, y: event.clientY };
          }}
          onPointerUp={(event) => {
            const start = swipe.current;
            swipe.current = null;
            if (!start) return;
            const dx = event.clientX - start.x;
            const dy = event.clientY - start.y;
            if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
            swiped.current = true;
            stepMonth(dx < 0 ? 1 : -1);
          }}
          onPointerCancel={() => {
            swipe.current = null;
          }}
        >
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Previous month" disabled={monthIndex <= 0 && !canPrev} onClick={() => stepMonth(-1)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-fg disabled:text-muted/40">
              <ChevronLeft className="h-6 w-6" aria-hidden />
            </button>
            <h2 className="relative z-20 flex min-w-0 flex-1 items-baseline justify-center gap-2 font-display text-2xl font-bold uppercase leading-none">
              <span>{monthName}</span>
              {onYear && years && years.length > 1 ? (
                <button
                  type="button"
                  aria-expanded={yearOpen}
                  aria-label={`Year ${visible.year}. Choose another year.`}
                  onClick={() => setYearOpen((open) => !open)}
                  className="inline-flex items-center gap-0.5"
                >
                  {visible.year}
                  <ChevronDown className={`h-4 w-4 ${yearOpen ? "rotate-180" : ""}`} aria-hidden />
                </button>
              ) : (
                <span>{visible.year}</span>
              )}
              {yearOpen && onYear && years ? (
                <ul className="absolute left-1/2 top-full z-30 mt-2 w-28 -translate-x-1/2 overflow-hidden rounded-lg border border-line bg-white py-1 text-base normal-case shadow-[0_10px_24px_rgba(0,0,0,0.16)]">
                  {years.map((item) => (
                    <li key={item}>
                      <button
                        type="button"
                        className={`block w-full px-3 py-1.5 text-center ${item === visible.year ? "font-bold text-fg" : "font-semibold text-muted"}`}
                        onClick={() => {
                          setYearOpen(false);
                          onYear(item);
                        }}
                      >
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </h2>
            <button type="button" aria-label="Next month" disabled={(monthIndex < 0 || monthIndex >= months.length - 1) && !canNext} onClick={() => stepMonth(1)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-fg disabled:text-muted/40">
              <ChevronRight className="h-6 w-6" aria-hidden />
            </button>
          </div>
          {yearOpen ? (
            <button type="button" aria-label="Close years" className="fixed inset-0 z-10" onClick={() => setYearOpen(false)} />
          ) : null}
          <div className="mt-1 grid grid-cols-7 gap-1 text-center text-xs font-bold uppercase text-muted">
            {HOME_WEEKDAYS.map((label, index) => (
              <span key={`${label}-${index}`}>{label}</span>
            ))}
          </div>
          <div className="mt-2 grid h-[16.25rem] grid-cols-7 grid-rows-6 gap-1">
            {cells.map((cell) => {
              const inside = cell.inMonth && cell.iso >= startDate && cell.iso <= endDate;
              const tone = cell.inMonth ? homeDayTone(cell.iso, scheduled, today, readOnly, teams) : null;
              const isPicked = cell.iso === picked;
              const fill =
                tone === "past"
                  ? "bg-[#5c5c5c] text-white"
                  : tone === "live"
                    ? "bg-[#2ea44f] text-white"
                    : tone === "ready" || tone === "attending" || tone === "final"
                    ? "bg-[#2f89e6] text-white"
                      : tone === "needs" || tone === "posted" || tone === "event"
                        ? "bg-[#f5c518] text-[#1c1c1c]"
                        : isPicked
                          ? "bg-surface text-fg"
                          : inside
                            ? "bg-surface text-fg"
                            : "text-muted";
              return (
                <button
                  key={cell.iso}
                  type="button"
                  disabled={!cell.inMonth}
                  aria-hidden={!cell.inMonth}
                  aria-pressed={isPicked}
                  onClick={() => {
                    if (swiped.current) {
                      swiped.current = false;
                      return;
                    }
                    if (picked === cell.iso) {
                      setPicked(null);
                      return;
                    }
                    setPicked(cell.iso);
                  }}
                  className={`flex h-full min-h-0 items-center justify-center rounded-md text-sm font-semibold ${fill} ${
                    !cell.inMonth ? "invisible" : isPicked ? "ring-2 ring-[#1c1c1c]" : ""
                  }`}
                >
                  {Number(cell.iso.slice(8, 10))}
                </button>
              );
            })}
          </div>
          <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-muted">
            {readOnly ? (
              <>
                <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-[#f5c518]" aria-hidden />Tournaments</li>
                <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-[#2f89e6]" aria-hidden />Attending</li>
                <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-[#2ea44f]" aria-hidden />Live</li>
                <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-[#5c5c5c]" aria-hidden />Past</li>
              </>
            ) : (
              <>
                <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-[#f5c518]" aria-hidden />Needs work</li>
                <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-[#2f89e6]" aria-hidden />Ready</li>
                <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-[#2ea44f]" aria-hidden />Live</li>
                <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-[#5c5c5c]" aria-hidden />Past</li>
              </>
            )}
          </ul>
        </section>
      ) : (
        <p className="text-sm text-muted">This season has no months yet.</p>
      )}

      <section data-tour={readOnly ? "events" : undefined} className="space-y-3">
        {shown.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line bg-surface px-4 py-4 text-sm text-muted">
            {picked
              ? readOnly
                ? "Nothing scheduled this day."
                : "Nothing this day yet."
              : readOnly
                ? `Nothing in ${monthName} yet.`
                : `Nothing in ${monthName} yet. Tap a day to add one.`}
          </p>
        ) : readOnly ? (
          <>
            {active.map((event) => coachEventCard(event, teams, today, () => {
              const registered = teams.some((team) => team.weekendId === event.id && team.status === "approved");
              if (registered) {
                void navigate({ to: "/weekends/$weekendId", params: { weekendId: String(event.id) } });
                return;
              }
              setEventPopup(event);
            }))}
            {past.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-white/80 bg-white/25 shadow-[0_8px_18px_rgba(28,28,28,0.12)] backdrop-blur-[2px]">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-3 text-left"
                  aria-expanded={pastOpen}
                  onClick={() => setPastOpen((open) => !open)}
                >
                  <span className="flex items-center gap-2 font-display text-xl font-bold uppercase">
                    <span className="h-3.5 w-3.5 rounded-full bg-[#5c5c5c]" aria-hidden />
                    Past · {past.length}
                  </span>
                  <ChevronDown className={`h-5 w-5 transition ${pastOpen ? "rotate-180" : ""}`} aria-hidden />
                </button>
                {pastOpen ? (
                  <div className="space-y-2 border-t border-black/10 bg-black/[0.04] px-2 py-2">
                    {past.map((event) => coachEventCard(event, teams, today, () => {
                      const registered = teams.some((team) => team.weekendId === event.id && team.status === "approved");
                      if (registered) {
                        void navigate({ to: "/weekends/$weekendId", params: { weekendId: String(event.id) } });
                        return;
                      }
                      setEventPopup(event);
                    }))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <>
            {active.map((event) => adminEventCard(event, today))}
            {past.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-white/80 bg-white/25 shadow-[0_8px_18px_rgba(28,28,28,0.12)] backdrop-blur-[2px]">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-3 text-left"
                  aria-expanded={pastOpen}
                  onClick={() => setPastOpen((open) => !open)}
                >
                  <span className="flex items-center gap-2 font-display text-xl font-bold uppercase">
                    <span className="h-3.5 w-3.5 rounded-full bg-[#5c5c5c]" aria-hidden />
                    Past · {past.length}
                  </span>
                  <ChevronDown className={`h-5 w-5 transition ${pastOpen ? "rotate-180" : ""}`} aria-hidden />
                </button>
                {pastOpen ? (
                  <div className="space-y-2 border-t border-black/10 bg-black/[0.04] px-2 py-2">
                    {past.map((event) => adminEventCard(event, today))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        )}
        {!readOnly && picked ? (
          <Button type="button" className="w-full" disabled={!cardName.trim() || !cardStart || cardEnd < cardStart} onClick={openCreate}>
            {shown.length === 0 ? "Add a tournament" : "Add another tournament"}
          </Button>
        ) : null}
        {readOnly ? null : <RecentlyDeleted startDate={startDate} endDate={endDate} />}
      </section>
      {eventPopup ? (
        <CoachEventDialog
          event={eventPopup}
          onClose={() => setEventPopup(null)}
        />
      ) : null}
    </div>
  );
}

function RecentlyDeleted({ startDate, endDate }: { startDate: string; endDate: string }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["deleted-weekends"], queryFn: () => listDeletedWeekends() });
  const restore = useMutation({
    mutationFn: (weekendId: number) => restoreWeekend({ data: { weekendId } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["deleted-weekends"] });
      await queryClient.invalidateQueries({ queryKey: ["weekends"] });
      await queryClient.invalidateQueries({ queryKey: ["season-cards"] });
      await queryClient.invalidateQueries({ queryKey: ["season-plan"] });
      await queryClient.invalidateQueries({ queryKey: ["my-schedule"] });
      await queryClient.invalidateQueries({ queryKey: ["my-teams"] });
    },
  });
  const rows = (query.data ?? []).filter((row) => row.startDate <= endDate && row.endDate >= startDate);
  const [open, setOpen] = useState(false);
  if (rows.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-white/80 bg-white/25 shadow-[0_8px_18px_rgba(28,28,28,0.12)] backdrop-blur-[2px]">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-3 text-left"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="font-display text-xl font-bold uppercase">Recently deleted · {rows.length}</span>
        <ChevronDown className={`h-5 w-5 transition ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open ? (
        <div className="space-y-2 border-t border-black/10 bg-black/[0.04] px-2 py-2">
          {rows.map((row) => (
            <DeletedWeekendCard
              key={row.weekendId}
              row={row}
              pending={restore.isPending && restore.variables === row.weekendId}
              error={restore.isError && restore.variables === row.weekendId ? (restore.error instanceof Error ? restore.error.message : "Could not put that tournament back.") : null}
              onRestore={() => restore.mutate(row.weekendId)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DeletedWeekendCard({
  row,
  pending,
  error,
  onRestore,
}: {
  row: DeletedWeekend;
  pending: boolean;
  error: string | null;
  onRestore: () => void;
}) {
  const left = row.daysLeft === 1 ? "1 day left" : `${row.daysLeft} days left`;
  return (
    <div className="rounded-lg bg-white/80 px-3 py-2.5">
      <p className="text-sm font-bold uppercase leading-tight">{row.name}</p>
      <p className="mt-0.5 text-xs text-muted">
        {formatWeekendRange(row.startDate, row.endDate)} · {left}
      </p>
      <Button type="button" variant="outline" className="mt-2 h-8 w-full text-xs" disabled={pending} onClick={onRestore}>
        {pending ? "Putting it back…" : "Put it back"}
      </Button>
      {error ? <p className="mt-1 text-xs text-[#8a5a12]">{error}</p> : null}
    </div>
  );
}

function CoachEventDialog({
  event,
  onClose,
}: {
  event: Weekend;
  onClose: () => void;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-scrim p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={event.name}
        className="max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-lg border border-line bg-bg p-4 text-fg shadow-lg"
        onClick={(click) => click.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase leading-tight">{event.name}</h2>
            <p className="mt-1 text-sm text-muted">{formatWeekendRange(event.startDate, event.endDate)}</p>
            {event.teamFeeCents != null ? (
              <p className="mt-1 text-sm font-semibold">{formatTeamFee(event.teamFeeCents)} per team</p>
            ) : null}
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-fg">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        {(() => {
          const closed = registrationClosed(event);
          return closed ? <p className="mt-4 text-sm">{closed}</p> : <EventAgeInterest weekendId={event.id} onSaved={onClose} />;
        })()}
        <RegisteredTeams weekendId={event.id} />
      </div>
    </div>,
    document.body,
  );
}

function RegisteredTeams({ weekendId }: { weekendId: number }) {
  const query = useQuery({
    queryKey: ["tournament-roster", weekendId],
    queryFn: () => listTournamentRoster({ data: { weekendId } }),
  });
  const teams = query.data ?? [];
  return (
    <div className="mt-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">Teams registered</p>
      {query.isPending ? (
        <p className="mt-2 text-sm text-muted">Loading teams…</p>
      ) : query.error instanceof Error ? (
        <p className="mt-2 text-sm">{query.error.message}</p>
      ) : teams.length === 0 ? (
        <p className="mt-2 text-sm text-muted">No teams in yet.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {teams.map((team) => (
            <li key={`${team.ageGroup}-${team.name}`} className="flex items-baseline justify-between gap-3 border-b border-line py-1.5 last:border-b-0">
              <p className="font-semibold leading-tight">{team.name}</p>
              <p className="shrink-0 text-xs text-muted">{team.ageGroup}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function adminEventCard(event: Weekend, today: string) {
  const dot = adminTournamentDot(event, today);
  const ages = event.ageGroups.length > 0 ? formatAgeGroups(event.ageGroups) : "";
  const interest = event.approvedCount === 0 ? "No teams in yet" : event.approvedCount === 1 ? "1 in" : `${event.approvedCount} in`;
  const fee = event.teamFeeCents != null ? `${formatTeamFee(event.teamFeeCents)} per team` : "";
  return (
    <Link
      key={event.id}
      to="/weekends/$weekendId"
      params={{ weekendId: String(event.id) }}
      className="flex items-center gap-3 rounded-xl border border-white/80 bg-white/45 px-3 py-3 shadow-[0_8px_18px_rgba(28,28,28,0.12)] backdrop-blur-[2px]"
    >
      <div className="min-w-0 flex-1">
        <p className="font-display text-2xl font-bold uppercase leading-tight">{event.name}</p>
        <p className="mt-1 text-sm text-muted">{formatWeekendRange(event.startDate, event.endDate)}</p>
        <p className="mt-1 text-sm font-semibold">{[ages, interest, fee].filter(Boolean).join(" · ")}</p>
      </div>
      {event.flyer ? (
        <img src={event.flyer} alt="" className="h-16 w-[3.25rem] shrink-0 rounded-md object-cover object-top shadow-[0_2px_6px_rgba(0,0,0,0.25)]" />
      ) : null}
      <span className={`h-6 w-6 shrink-0 self-start rounded-full ${dot?.color ?? ""}`} title={dot?.label} aria-label={dot?.label} />
    </Link>
  );
}

function adminTournamentDot(event: Weekend, _today: string) {
  const status = adminBoardStatus(event, new Date());
  if (status === "live") return { color: "bg-[#2ea44f]", label: "Live" };
  if (status === "ready") return { color: "bg-[#2f89e6]", label: "Ready" };
  if (status === "needs") return { color: "bg-[#f5c518]", label: "Needs work" };
  return { color: "bg-[#5c5c5c]", label: "Past" };
}

function CoachFold({
  title,
  count,
  empty,
  open,
  onToggle,
  children,
  dot,
  tone = "bg-white/80",
}: {
  title: string;
  count: number;
  empty: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  dot?: string;
  tone?: string;
}) {
  if (count === 0) {
    return (
      <section className={`rounded-2xl px-3 py-3 ${tone}`}>
        <h2 className="font-display text-xl font-bold uppercase leading-tight">{empty}</h2>
      </section>
    );
  }
  const label = count === 1 ? "1 tournament" : `${count} tournaments`;
  return (
    <section className={`rounded-2xl px-3 py-3 ${tone}`}>
      <button type="button" className="flex w-full items-center justify-between gap-3 text-left" aria-expanded={open} onClick={onToggle}>
        <span className="flex min-w-0 items-center gap-2 font-display text-xl font-bold uppercase leading-tight">
          {dot ? <span className={`h-3.5 w-3.5 shrink-0 rounded-full ${dot}`} aria-hidden /> : null}
          {title} · {label}
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 transition ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open ? <div className="mt-3">{children}</div> : null}
    </section>
  );
}

function CoachEventList({
  groups,
  teams,
  declined,
  coachAges,
  onOpen,
}: {
  groups: Weekend[][];
  teams: RegisteredTeam[];
  declined: Set<number>;
  coachAges: string[];
  onOpen: (event: Weekend) => void;
}) {
  return (
    <div className="space-y-3">
      {groups.map((events) => (
        <CoachWeekendCard
          key={events.map((event) => event.id).join("-")}
          events={events}
          teams={teams}
          declined={declined}
          coachAges={coachAges}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}

type FlyerInk = {
  face: [string, string, string, string];
  deep: string;
  mid: string;
  stroke: string;
  light: boolean;
};

const GOLD_INK: FlyerInk = {
  face: ["#fff8c8", "#ffd24a", "#ff8a00", "#ff3d00"],
  deep: "#2a0c00",
  mid: "#8a3200",
  stroke: "#fff4c4",
  light: false,
};

const NAVY_INK: FlyerInk = {
  face: ["#071433", "#16357a", "#4a1028", "#14060c"],
  deep: "#ffffff",
  mid: "#d8d8d8",
  stroke: "#b7c4de",
  light: true,
};

const flyerInkCache = new Map<string, FlyerInk>();

function rgbToHsl(r: number, g: number, b: number) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return { h: h * 60, s, l };
}

function hslToHex(h: number, s: number, l: number) {
  const hue = ((h % 360) + 360) % 360;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + hue / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * Math.min(1, Math.max(0, color)))
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function inkFromSample(r: number, g: number, b: number): FlyerInk {
  const { h, s, l } = rgbToHsl(r, g, b);
  if (s < 0.16) return l > 0.55 ? NAVY_INK : GOLD_INK;
  const hue = h + 180;
  if (l > 0.55) {
    return {
      face: [hslToHex(hue, 0.72, 0.16), hslToHex(hue, 0.78, 0.28), hslToHex(hue + 28, 0.7, 0.18), hslToHex(hue - 20, 0.65, 0.1)],
      deep: "#ffffff",
      mid: "#e4e4e4",
      stroke: hslToHex(hue, 0.2, 0.82),
      light: true,
    };
  }
  return {
    face: [hslToHex(hue, 0.55, 0.94), hslToHex(hue, 0.9, 0.72), hslToHex(hue + 24, 0.95, 0.52), hslToHex(hue - 16, 0.95, 0.4)],
    deep: "#140800",
    mid: hslToHex(hue, 0.7, 0.28),
    stroke: "#fff6d8",
    light: false,
  };
}

function sampleFlyerInk(src: string): Promise<FlyerInk> {
  const cached = flyerInkCache.get(src);
  if (cached) return Promise.resolve(cached);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 48;
      canvas.height = 16;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx || !img.naturalWidth) {
        flyerInkCache.set(src, GOLD_INK);
        resolve(GOLD_INK);
        return;
      }
      const slice = Math.max(1, Math.round(img.naturalHeight * 0.2));
      ctx.drawImage(img, 0, 0, img.naturalWidth, slice, 0, 0, 48, 16);
      const data = ctx.getImageData(0, 0, 48, 16).data;
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 16) continue;
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        n += 1;
      }
      const ink = n === 0 ? GOLD_INK : inkFromSample(r / n, g / n, b / n);
      flyerInkCache.set(src, ink);
      resolve(ink);
    };
    img.onerror = () => resolve(GOLD_INK);
    img.src = src;
  });
}

function CoachWeekendCard({
  events,
  teams,
  declined,
  coachAges,
  onOpen,
}: {
  events: Weekend[];
  teams: RegisteredTeam[];
  declined: Set<number>;
  coachAges: string[];
  onOpen: (event: Weekend) => void;
}) {
  const userPicked = useRef(false);
  const [selectedId, setSelectedId] = useState(() => preferredCoachEvent(events, coachAges, teams).id);
  useEffect(() => {
    if (userPicked.current) return;
    setSelectedId(preferredCoachEvent(events, coachAges, teams).id);
  }, [events, coachAges, teams]);
  const selected = events.find((event) => event.id === selectedId) ?? events[0];
  const [ink, setInk] = useState<FlyerInk | null>(() => (selected.flyer ? flyerInkCache.get(selected.flyer) ?? null : null));
  useEffect(() => {
    if (!selected.flyer) return;
    const cached = flyerInkCache.get(selected.flyer);
    if (cached) {
      setInk(cached);
      return;
    }
    let stop = false;
    void sampleFlyerInk(selected.flyer).then((next) => {
      if (!stop) setInk(next);
    });
    return () => {
      stop = true;
    };
  }, [selected.flyer]);
  const mine = teams.filter((team) => team.weekendId === selected.id && team.status === "approved");
  const ended = Boolean(registrationClosed(selected));
  const action = mine.length > 0 ? "Tap to open" : declined.has(selected.id) ? "Not interested" : ended ? "Tap to see teams" : "Tap to register";
  const teamLine = (
    <p className="text-sm font-semibold">
      {teamsRegisteredLabel(selected.approvedCount)}
      {mine.length === 0 && !ended ? (
        <>
          {" - "}
          <span className="text-primary underline underline-offset-2">view teams</span>
        </>
      ) : null}
    </p>
  );
  const ages = events.length > 1 ? (
    <div className="flex flex-wrap gap-2">
      {events.map((event) => {
        const on = event.id === selected.id;
        return (
          <button
            key={event.id}
            type="button"
            onClick={() => {
              userPicked.current = true;
              setSelectedId(event.id);
            }}
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${on ? "bg-[#1a1a1a] text-white" : "bg-black/5 text-[#1a1a1a]"}`}
          >
            {eventAgeLabel(event)}
          </button>
        );
      })}
    </div>
  ) : (
    <p className="text-sm font-bold uppercase">{eventAgeLabel(selected)}</p>
  );
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/80 bg-[#1a1a1a] p-[3px] shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_3px_0_#111,0_18px_28px_-8px_rgba(0,0,0,0.55)]">
      <button type="button" onClick={() => onOpen(selected)} className="block w-full text-left">
        {selected.flyer ? (
          <span className="relative block">
            <img src={selected.flyer} alt="" className="block h-auto w-full rounded-t-[13px]" />
            {mine.length > 0 && ink ? (
              <svg viewBox="0 0 400 86" className="registered-mark pointer-events-none absolute inset-x-1 top-0 z-[2] h-[5.4rem] w-[calc(100%-0.5rem)]" aria-hidden>
                <defs>
                  <path id={`reg-arc-${selected.id}`} d="M 16 70 Q 200 4 384 70" fill="none" />
                  <linearGradient id={`reg-fill-${selected.id}`} x1="0%" y1="0%" x2="100%" y2="40%">
                    <stop offset="0%" stopColor={ink.face[0]} />
                    <stop offset="38%" stopColor={ink.face[1]} />
                    <stop offset="68%" stopColor={ink.face[2]} />
                    <stop offset="100%" stopColor={ink.face[3]} />
                  </linearGradient>
                </defs>
                {[6, 5, 4, 3, 2].map((step) => (
                  <text key={step} transform={`translate(${step * 0.35}, ${step * 1.15})`} fill={step > 3 ? ink.deep : ink.mid} fontFamily="Oswald, Arial Narrow, sans-serif" fontSize="40" fontWeight="700" letterSpacing="4">
                    <textPath href={`#reg-arc-${selected.id}`} startOffset="50%" textAnchor="middle">
                      REGISTERED
                    </textPath>
                  </text>
                ))}
                <text fill={`url(#reg-fill-${selected.id})`} stroke={ink.stroke} strokeWidth="0.7" fontFamily="Oswald, Arial Narrow, sans-serif" fontSize="40" fontWeight="700" letterSpacing="4">
                  <textPath href={`#reg-arc-${selected.id}`} startOffset="50%" textAnchor="middle">
                    REGISTERED
                  </textPath>
                </text>
              </svg>
            ) : null}
          </span>
        ) : (
          <span className="relative block rounded-t-[13px] bg-white px-4 pb-3 pt-3.5 text-fg">
            <span className="block font-display text-[1.7rem] font-bold uppercase leading-none">{selected.name}</span>
            <span className="mt-1.5 block text-sm text-muted">{formatWeekendRange(selected.startDate, selected.endDate)}</span>
          </span>
        )}
      </button>
      <div className="rounded-b-[13px] bg-white px-4 py-2.5 text-fg">
        {ages}
        <button type="button" onClick={() => onOpen(selected)} className="mt-2 block w-full text-left">
          {teamLine}
          {mine.length > 0 ? (
            <p className="mt-0.5 text-sm text-muted">{mine.map((team) => `${team.name} · ${team.ageGroup} is registered`).join(" · ")}</p>
          ) : null}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.16em]">{action}</span>
            <ChevronRight className="h-4 w-4" aria-hidden />
          </div>
        </button>
      </div>
    </div>
  );
}

function teamsRegisteredLabel(count: number) {
  if (count <= 0) return "No teams registered yet";
  if (count === 1) return "1 team is registered";
  return `${count} teams are registered`;
}

function YearMenu({ year, years, onYear }: { year: number; years: number[]; onYear: (year: number) => void }) {
  const [open, setOpen] = useState(false);
  if (years.length <= 1) return <p data-tour="year" className="font-display text-2xl font-bold leading-none">{year}</p>;
  return (
    <div data-tour="year" className="relative z-20">
      <button
        type="button"
        aria-expanded={open}
        aria-label={`Year ${year}. Choose another year.`}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-0.5 font-display text-2xl font-bold leading-none"
      >
        {year}
        <ChevronDown className={`h-4 w-4 ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open ? (
        <>
          <button type="button" aria-label="Close years" className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <ul className="absolute right-0 top-full z-30 mt-2 w-28 overflow-hidden rounded-lg border border-line bg-white py-1 text-base normal-case shadow-[0_10px_24px_rgba(0,0,0,0.16)]">
            {years.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  className={`block w-full px-3 py-1.5 text-center ${item === year ? "font-bold text-fg" : "font-semibold text-muted"}`}
                  onClick={() => {
                    setOpen(false);
                    onYear(item);
                  }}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

function homeMonths(start: string, end: string): { year: number; month: number }[] {
  if (end < start || start.length < 7 || end.length < 7) return [];
  const out: { year: number; month: number }[] = [];
  let y = Number(start.slice(0, 4));
  let m = Number(start.slice(5, 7));
  const ye = Number(end.slice(0, 4));
  const me = Number(end.slice(5, 7));
  let guard = 0;
  while ((y < ye || (y === ye && m <= me)) && guard < 18) {
    out.push({ year: y, month: m });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    guard += 1;
  }
  return out;
}

function homeMonthKey(month: { year: number; month: number }) {
  return `${month.year}-${String(month.month).padStart(2, "0")}`;
}

function homeMonthCells(year: number, month: number): { iso: string; inMonth: boolean }[] {
  const pad = new Date(year, month - 1, 1).getDay();
  const count = new Date(year, month, 0).getDate();
  const cells: { iso: string; inMonth: boolean }[] = [];
  for (let i = 0; i < pad; i += 1) {
    cells.push({ iso: isoDateFromLocal(new Date(year, month - 1, 1 - (pad - i))), inMonth: false });
  }
  for (let day = 1; day <= count; day += 1) {
    cells.push({ iso: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`, inMonth: true });
  }
  while (cells.length < 42) cells.push({ iso: addDays(cells[cells.length - 1].iso, 1), inMonth: false });
  return cells;
}

function homeDayTone(iso: string, weekends: Weekend[], today: string, coach = false, teams: RegisteredTeam[] = []) {
  const covering = weekends.filter((weekend) => iso >= weekend.startDate && iso <= weekend.endDate);
  const attending = teams.some(
    (team) => team.status === "approved" && iso >= team.startDate && iso <= team.endDate,
  );
  if (covering.length === 0 && !attending) return null;
  if (coach) {
    const events = covering.filter((weekend) => weekend.lifecycle !== "announced");
    const now = new Date();
    const openMine = events.filter((weekend) => coachIsIn(weekend.id, teams) && !tournamentPast(weekend, now));
    const openOther = events.filter((weekend) => !coachIsIn(weekend.id, teams) && !tournamentPast(weekend, now));
    if (iso < today && events.every((weekend) => tournamentPast(weekend, now)) && (events.length > 0 || attending)) return "past";
    if (openMine.some((weekend) => tournamentLive(weekend))) return "live";
    if (openMine.length > 0) return "attending";
    if (openOther.length > 0) return "event";
    if (events.length > 0 || attending) return "past";
    return null;
  }
  const now = new Date();
  const statuses = covering
    .map((weekend) => adminBoardStatus(weekend, now))
    .filter((status): status is "past" | "live" | "ready" | "needs" => status != null);
  if (statuses.includes("live")) return "live";
  if (statuses.includes("needs")) return "needs";
  if (statuses.includes("ready")) return "ready";
  if (statuses.includes("past")) return "past";
  return null;
}

function CoachCountsDialog({
  group,
  kind,
  weekends,
  teams,
  onClose,
}: {
  group: string;
  kind: "available" | "going" | "live" | "attended";
  weekends: Weekend[];
  teams: RegisteredTeam[];
  onClose: () => void;
}) {
  if (typeof document === "undefined") return null;
  const blurb =
    kind === "available"
      ? "Tournaments you are not in."
      : kind === "going"
        ? "Tournaments your team has been added to."
        : kind === "live"
          ? "Yours, once it locks or a game has a score, until it ends."
          : "Tournaments your team has played.";
  const empty =
    kind === "available"
      ? "No open tournaments outside the ones you're already in."
      : kind === "going"
        ? "No upcoming tournaments yet."
        : kind === "live"
          ? "Nothing of yours is on right now."
          : "No tournaments attended yet.";
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-scrim p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={group}
        className="max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-lg border border-line bg-bg p-4 text-fg shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold uppercase">{group}</h2>
          <Button type="button" variant="ghost" className="px-2 text-muted" onClick={onClose}>
            Close
          </Button>
        </div>
        <p className="mt-1 text-sm text-muted">{blurb}</p>
        {weekends.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{empty}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {weekends.map((weekend) => (
              <li key={weekend.id}>
                {kind === "available" ? (
                  <div className="rounded-lg border border-line bg-surface px-3 py-3">
                    <p className="font-semibold">{weekend.name}</p>
                    <p className="mt-1 text-sm text-muted">{formatWeekendRange(weekend.startDate, weekend.endDate)}</p>
                    <EventAgeInterest weekendId={weekend.id} />
                    <RegisteredTeams weekendId={weekend.id} />
                  </div>
                ) : (
                  <CoachTournamentRow weekend={weekend} teams={teams} />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>,
    document.body,
  );
}

function CoachTournamentRow({ weekend, teams }: { weekend: Weekend; teams: RegisteredTeam[] }) {
  const mine = teams.filter((team) => team.weekendId === weekend.id && team.status === "approved");
  return (
    <Link
      to="/weekends/$weekendId"
      params={{ weekendId: String(weekend.id) }}
      className="block rounded-lg border border-line bg-surface px-3 py-3"
    >
      <span className="block font-semibold">{weekend.name}</span>
      <span className="mt-1 block text-sm text-muted">{formatWeekendRange(weekend.startDate, weekend.endDate)}</span>
      {mine.length > 0 ? (
        <span className="mt-1 block text-sm font-semibold">{mine.map((team) => `${team.name} · ${team.ageGroup}`).join(" · ")}</span>
      ) : null}
    </Link>
  );
}

function coachIsIn(weekendId: number, teams: RegisteredTeam[]) {
  return teams.some((team) => team.weekendId === weekendId && team.status === "approved");
}

function coachEventBaseName(name: string) {
  return name
    .replace(/\b\d{1,2}\s*u\b/gi, "")
    .replace(/\btournament\b/gi, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

function sameCoachFamily(a: Weekend, b: Weekend) {
  if (a.startDate !== b.startDate || a.endDate !== b.endDate) return false;
  const left = coachEventBaseName(a.name);
  const right = coachEventBaseName(b.name);
  if (!left || !right) return true;
  return left === right || left.includes(right) || right.includes(left);
}

function eventAgeRank(event: Weekend) {
  const n = Number.parseInt(event.ageGroups[0] ?? event.name, 10);
  return Number.isFinite(n) ? n : 99;
}

function groupCoachEvents(events: Weekend[]): Weekend[][] {
  const groups: Weekend[][] = [];
  for (const event of events) {
    const merges = groups.filter((group) => group.some((other) => sameCoachFamily(other, event)));
    if (merges.length === 0) {
      groups.push([event]);
      continue;
    }
    const combined = merges.flat();
    for (const group of merges) groups.splice(groups.indexOf(group), 1);
    combined.push(event);
    groups.push(combined);
  }
  for (const group of groups) group.sort((a, b) => eventAgeRank(a) - eventAgeRank(b) || a.id - b.id);
  return groups;
}

function groupStart(group: Weekend[]) {
  return group.reduce((min, event) => (event.startDate < min ? event.startDate : min), group[0]?.startDate ?? "");
}

function coachGroupSpot(group: Weekend[], teams: RegisteredTeam[], declined: Set<number>, now: Date): "registered" | "open" | "skipped" | "past" | null {
  if (group.every((event) => tournamentPast(event, now))) return "past";
  if (group.some((event) => coachIsIn(event.id, teams))) return "registered";
  const joinable = group.filter((event) => !tournamentLive(event) && !coachIsIn(event.id, teams));
  if (joinable.length === 0) return null;
  if (joinable.every((event) => declined.has(event.id))) return "skipped";
  return "open";
}

function preferredCoachEvent(events: Weekend[], coachAges: string[], teams: RegisteredTeam[]) {
  const registered = events.filter((event) => coachIsIn(event.id, teams));
  const pool = registered.length > 0 ? registered : events;
  const wanted = new Set(coachAges.map((age) => age.toUpperCase()));
  return pool.find((event) => event.ageGroups.some((age) => wanted.has(age.toUpperCase()))) ?? pool[0] ?? events[0];
}

function eventAgeLabel(event: Weekend) {
  if (event.ageGroups.length > 0) return formatAgeGroups(event.ageGroups);
  const match = event.name.match(/\b\d{1,2}\s*u\b/i);
  return match ? match[0].toUpperCase().replace(/\s+/g, "") : "Age";
}

function coachCountGroups(weekends: Weekend[], cards: SeasonCard[], teams: RegisteredTeam[], now: Date) {
  const inSeasons = weekends.filter((weekend) => cards.some((card) => inSeasonWindow(weekend, card.startDate, card.endDate)));
  const mine = inSeasons.filter((weekend) => weekend.lifecycle !== "announced" && coachIsIn(weekend.id, teams));
  const byStart = (a: Weekend, b: Weekend) => a.startDate.localeCompare(b.startDate) || a.id - b.id;
  const liveNow = (weekend: Weekend) => tournamentLive(weekend);
  return {
    available: inSeasons
      .filter(
        (weekend) =>
          weekend.lifecycle !== "announced" &&
          !tournamentPast(weekend, now) &&
          !tournamentLive(weekend) &&
          !coachIsIn(weekend.id, teams),
      )
      .sort(byStart),
    going: mine.filter((weekend) => !tournamentPast(weekend, now) && !liveNow(weekend)).sort(byStart),
    live: mine.filter((weekend) => !tournamentPast(weekend, now) && liveNow(weekend)).sort(byStart),
    attended: mine.filter((weekend) => tournamentPast(weekend, now)).sort(byStart),
  };
}

function overlapsMonth(weekend: Weekend, monthKey: string) {
  return weekend.startDate.slice(0, 7) <= monthKey && weekend.endDate.slice(0, 7) >= monthKey;
}

function SeasonDashboard({ weekends, cards, monthKey = null, layout = "row", readOnly = false, teams = [] }: { weekends: Weekend[]; cards: SeasonCard[]; monthKey?: string | null; layout?: "row" | "grid"; readOnly?: boolean; teams?: RegisteredTeam[] }) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const now = new Date();
  const scoped = monthKey ? weekends.filter((weekend) => overlapsMonth(weekend, monthKey)) : weekends;
  const inSeasons = scoped
    .filter((weekend) => cards.some((card) => inSeasonWindow(weekend, card.startDate, card.endDate)))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const tournaments = inSeasons.filter((weekend) => weekend.lifecycle !== "announced");
  const past = tournaments.filter((weekend) => tournamentPast(weekend, now));
  const open = tournaments.filter((weekend) => !tournamentPast(weekend, now));
  const live = open.filter((weekend) => tournamentLive(weekend));
  const setup = open.filter((weekend) => !tournamentLive(weekend));
  const needsWork = setup.filter((weekend) => neededToFinish(weekend).length > 0);
  const ready = setup.filter((weekend) => neededToFinish(weekend).length === 0);
  const coach = readOnly ? coachCountGroups(scoped, cards, teams, now) : null;
  const tiles = coach
    ? [
        { label: "Available", kind: "available" as const, weekends: coach.available, wash: "bg-[#f5c518] text-[#1c1c1c]" },
        { label: "Going", kind: "going" as const, weekends: coach.going, wash: "bg-[#2f89e6] text-white" },
        { label: "Live", kind: "live" as const, weekends: coach.live, wash: "bg-[#2ea44f] text-white" },
        { label: "Attended", kind: "attended" as const, weekends: coach.attended, wash: "bg-[#5c5c5c] text-white" },
      ]
    : [
        { label: "Needs work", kind: null, weekends: needsWork, wash: "bg-[#f5c518] text-[#1c1c1c]" },
        { label: "Ready", kind: null, weekends: ready, wash: "bg-[#2f89e6] text-white" },
        { label: "Live", kind: null, weekends: live, wash: "bg-[#2ea44f] text-white" },
        { label: "Past", kind: null, weekends: past, wash: "bg-[#5c5c5c] text-white" },
      ];
  const selected = tiles.find((tile) => tile.label === openGroup) ?? null;
  return (
    <>
      <div data-tour={readOnly ? "counts" : undefined} className={`overflow-hidden rounded-lg border border-line ${layout === "grid" ? "w-[7.25rem] shrink-0" : ""}`}>
        <div className={layout === "grid" ? "grid grid-cols-2" : "grid grid-cols-4"}>
          {tiles.map((tile, index) => (
            <button
              key={tile.label}
              type="button"
              onClick={() => setOpenGroup(tile.label)}
              className={`${layout === "grid" ? "px-1 py-0.5" : "px-1.5 py-2"} text-center ${tile.wash} ${
                layout === "grid"
                  ? `${index % 2 === 0 ? "border-r border-black/10" : ""} ${index < 2 ? "border-b border-black/10" : ""}`
                  : index < tiles.length - 1
                    ? "border-r border-line"
                    : ""
              }`}
            >
              <p className={`font-display font-bold leading-none ${layout === "grid" ? "text-sm" : "text-lg"}`}>{tile.weekends.length}</p>
              <p className={`font-bold uppercase leading-none tracking-wide ${layout === "grid" ? "mt-px whitespace-nowrap text-[7px]" : "mt-0.5 text-[10px] text-muted"}`}>{tile.label}</p>
            </button>
          ))}
        </div>
      </div>
      {selected?.kind ? (
        <CoachCountsDialog
          group={selected.label}
          kind={selected.kind}
          weekends={selected.weekends}
          teams={teams}
          onClose={() => setOpenGroup(null)}
        />
      ) : selected ? (
        <AdminCountDialog group={selected.label} weekends={selected.weekends} onClose={() => setOpenGroup(null)} />
      ) : null}
    </>
  );
}

function AdminCountDialog({
  group,
  weekends,
  readOnly = false,
  onClose,
}: {
  group: string;
  weekends: Weekend[];
  readOnly?: boolean;
  onClose: () => void;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-scrim p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={group}
        className="max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-lg border border-line bg-bg p-4 text-fg shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold uppercase">{group}</h2>
          <Button type="button" variant="ghost" className="px-2 text-muted" onClick={onClose}>
            Close
          </Button>
        </div>
        {weekends.length === 0 ? (
          <p className="mt-4 text-sm text-muted">None in this group.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {weekends.map((weekend) => {
              const body = (
                <>
                  <span className="block font-semibold">{weekend.name}</span>
                  <span className="mt-1 block text-sm text-muted">{formatWeekendRange(weekend.startDate, weekend.endDate)}</span>
                  <span className={`mt-1 block text-sm font-semibold ${!weekend.hasChampion && (weekend.lifecycle === "announced" || neededToFinish(weekend).length > 0) ? "text-[#c9a227]" : ""}`}>
                    {weekend.hasChampion
                      ? "Champion"
                      : weekend.lifecycle === "announced"
                      ? "Not finalized"
                      : neededToFinish(weekend).length > 0
                        ? neededToFinish(weekend).join(" · ")
                        : weekend.approvedCount > 0
                          ? `Finalized · ${weekend.approvedCount === 1 ? "1 team" : `${weekend.approvedCount} teams`}`
                          : "Finalized"}
                  </span>
                </>
              );
              return (
              <li key={weekend.id}>
                {readOnly ? (
                  <div className="block rounded-lg border border-line bg-surface px-3 py-3">{body}</div>
                ) : (
                <Link
                  to="/weekends/$weekendId"
                  params={{ weekendId: String(weekend.id) }}
                  className="block rounded-lg border border-line bg-surface px-3 py-3"
                >
                  {body}
                </Link>
                )}
              </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>,
    document.body,
  );
}

function Fold({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between gap-3 text-left">
        <h2 className="font-display text-2xl font-bold uppercase">{title}</h2>
        <span className="flex items-center gap-2">
          <span className="grid h-7 min-w-7 place-items-center rounded-full bg-fg px-2 text-sm font-bold text-white">{count}</span>
          <ChevronDown className={`h-5 w-5 text-muted ${open ? "rotate-180" : ""}`} aria-hidden />
        </span>
      </button>
      {open ? <div className="mt-3 space-y-3">{children}</div> : null}
    </section>
  );
}

export function AdminInbox({
  pending,
  pendingTeams,
  busyId,
  busyTeamId,
  onReview,
  onReviewTeam,
  canManageAdmins = false,
}: {
  pending: PendingRequest[];
  pendingTeams: PendingTeam[];
  busyId: number | null;
  busyTeamId: number | null;
  onReview: (id: number, action: "approve" | "deny") => void;
  onReviewTeam: (id: number, action: "approve" | "deny") => void;
  canManageAdmins?: boolean;
}) {
  const applications = pending.filter((req) => req.requestedRole === "coach");
  const otherRequests = pending.filter((req) => req.requestedRole !== "coach");
  return (
    <div className="mt-5 space-y-6">
      <Fold title="New coach accounts" count={applications.length + pendingTeams.length}>
        {applications.length === 0 && pendingTeams.length === 0 ? (
          <p className="rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted">
            No new coach accounts. A new coach shows up here until you keep them or remove the account.
          </p>
        ) : null}
        {applications.map((req) => (
            <div key={req.id} className="space-y-3 rounded-lg border border-line bg-surface p-4">
              <div>
                <p className="font-semibold">{req.name || req.email}</p>
                {req.name ? <p className="text-sm">{req.email}</p> : null}
                {req.phone ? <p className="text-sm">{formatPhoneInput(req.phone)}</p> : null}
                {req.club ? (
                  <p className="text-sm">
                    <span className="font-medium">Organization:</span> {req.club}
                  </p>
                ) : null}
                <p className="mt-2 text-sm">This coach can already use the app. Keep their access, or remove the account.</p>
                {req.teams.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {req.teams.map((team, index) => (
                      <li key={`${team.name}-${team.ageGroup}-${index}`} className="text-sm">
                        <span className="font-medium">Team:</span> {team.name} · {team.ageGroup}
                      </li>
                    ))}
                  </ul>
                ) : req.teamName ? (
                  <p className="mt-2 text-sm">
                    <span className="font-medium">Team:</span> {req.teamName}
                  </p>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="pine" disabled={busyId === req.id} onClick={() => onReview(req.id, "approve")}>
                  Keep access
                </Button>
                <Button type="button" variant="outline" disabled={busyId === req.id} onClick={() => onReview(req.id, "deny")}>
                  Remove account
                </Button>
              </div>
            </div>
          ))}
        {pendingTeams.map((team) => (
          <div key={team.id} className="space-y-3 rounded-lg border border-line bg-surface p-4">
            <div>
              <p className="font-display text-2xl font-bold uppercase leading-none">{team.name}</p>
              <p className="mt-2 text-sm font-medium">
                {team.ageGroup} · {team.tournamentName}
              </p>
              <p className="mt-1 text-sm text-muted">{team.coachEmail}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="pine" disabled={busyTeamId === team.id} onClick={() => onReviewTeam(team.id, "approve")}>
                Approve
              </Button>
              <Button type="button" variant="outline" disabled={busyTeamId === team.id} onClick={() => onReviewTeam(team.id, "deny")}>
                Deny
              </Button>
            </div>
          </div>
        ))}
      </Fold>

      {otherRequests.length > 0 ? (
      <Fold title="Admin access" count={otherRequests.length}>
        {otherRequests.map((req) => (
            <div key={req.id} className="space-y-3 rounded-lg border border-line bg-surface p-4">
              <div>
                <p className="font-semibold">{req.name || req.email}</p>
                {req.name ? <p className="text-sm">{req.email}</p> : null}
                {req.phone ? <p className="text-sm">{formatPhoneInput(req.phone)}</p> : null}
                {req.club ? (
                  <p className="text-sm">
                    <span className="font-medium">Organization:</span> {req.club}
                  </p>
                ) : null}
                <p className="text-sm text-muted">
                  Wants {ROLE_COPY[req.requestedRole].label} access
                  {req.requestedRole === "coach" && req.attempt > 1
                    ? ` · request ${req.attempt} of ${MAX_COACH_REQUESTS}`
                    : ""}
                </p>
                {req.teams.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {req.teams.map((team, index) => (
                      <li key={`${team.name}-${team.ageGroup}-${index}`} className="text-sm">
                        <span className="font-medium">Team:</span> {team.name} · {team.ageGroup}
                      </li>
                    ))}
                  </ul>
                ) : req.teamName ? (
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
              {canManageAdmins ? (
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
              ) : (
                <p className="text-sm text-muted">Only an administrator allowed to manage admins can approve this.</p>
              )}
            </div>
          ))}
      </Fold>
      ) : null}
    </div>
  );
}

export function PendingAsParentHome({ profile }: { profile: Profile }) {
  return <ParentLayout profile={profile} greeting="You're in" />;
}
