import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { BarChart3, CalendarDays, CloudRain, MapPin, Users } from "lucide-react";
import type { MouseEvent } from "react";
import { listPublicTournaments, type PublicTournament } from "@/lib/pbi/api";
import { formatAgeGroups, formatWeekendRange } from "@/lib/pbi/weekends";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { holdLanding, openSignInSheet } from "@/components/sign-in-sheet";

const PBI_CAMPS_URL = "https://pbicamps.com";
const SPORTS_URL = "https://423sports.net";
const ACCENT = "#3B9EFF";

const tiles = [
  { icon: MapPin, title: "Field changes", line: "Everyone knows at once." },
  { icon: BarChart3, title: "Live scores", line: "Standings update live." },
  { icon: CloudRain, title: "Rainout calls", line: "Posted in one place." },
  { icon: Users, title: "Parents follow", line: "No group texts." },
];

export function PublicLanding() {
  const tournaments = useQuery({
    queryKey: ["public-tournaments"],
    queryFn: () => listPublicTournaments(),
  });
  const events = tournaments.data ?? [];
  const { user } = useCurrentUserState();

  function onSignIn(event: MouseEvent<HTMLButtonElement>) {
    if (user) {
      holdLanding(false);
      window.location.assign("/");
      return;
    }
    event.currentTarget.focus();
    openSignInSheet({ stay: true });
  }

  return (
    <main className="public-hub">
      <header className="sticky top-0 z-30 mx-auto flex w-full max-w-6xl items-center justify-between gap-1 bg-[#0E0F12] px-2.5 py-1">
        <img src="/logo.png" alt="423 Sports" className="h-auto w-[84px] shrink-0 max-[359px]:w-[68px]" />
        <div className="flex min-w-0 items-center">
          <div className="flex items-center">
            <a
              href={SPORTS_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="423Sports.net"
              className="flex h-9 min-w-9 items-center gap-1 px-0.5 text-white/55"
            >
              <img src="/favicon.svg" alt="" className="h-5 w-5 shrink-0" />
              <span className="hidden text-[10px] leading-none min-[360px]:inline">423Sports.net</span>
            </a>
            <a
              href={PBI_CAMPS_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="PBI Camps"
              className="flex h-9 min-w-9 items-center gap-1 px-0.5 text-white/55"
            >
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-white/40 text-[6px] font-bold leading-none tracking-tight text-white/80">
                PBI
              </span>
              <span className="hidden text-[10px] leading-none min-[360px]:inline">PBI Camps</span>
            </a>
          </div>
          <span aria-hidden className="mx-1.5 h-4 w-px shrink-0 bg-white/25" />
          <button type="button" onClick={onSignIn} className="inline-flex h-9 shrink-0 items-center px-1.5 text-[13px] font-medium text-white">
            Sign in
          </button>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <img
            src="/photos/field-diamond.jpg"
            alt=""
            className="h-full w-full scale-110 object-cover opacity-40 blur-[8px]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0E0F12]/50 via-[#0E0F12]/72 to-[#0E0F12]" />
        </div>
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-8 pt-7">
          <h1 className="font-bold leading-none">
            <span
              className="block whitespace-nowrap uppercase leading-none"
              style={{ color: ACCENT, fontSize: "clamp(2.15rem, 11vw, 4.6rem)", letterSpacing: "0.02em" }}
            >
              One link.
            </span>
            <span
              className="mt-1 block max-w-[14.5rem] font-bold uppercase leading-[0.95] text-white min-[480px]:max-w-none"
              style={{ fontSize: "clamp(1.29rem, 6.6vw, 2.76rem)", letterSpacing: "0.02em" }}
            >
              <span className="inline-block whitespace-nowrap">Every&nbsp;update.</span>{" "}
              <span className="inline-block whitespace-nowrap">No&nbsp;group&nbsp;text.</span>
            </span>
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-snug text-white/80">
            Schedules, field changes, scores, and brackets — coaches and parents see it the second it changes.
          </p>
        </div>
      </section>

      <section className="bg-white/[0.035]">
        <ul className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-x-4 gap-y-6 px-4 py-6 sm:grid-cols-4">
          {tiles.map((tile) => (
            <li key={tile.title} className="flex gap-2.5">
              <tile.icon className="mt-0.5 h-[22px] w-[22px] shrink-0" strokeWidth={1.75} style={{ color: ACCENT }} aria-hidden />
              <div>
                <p className="text-sm font-semibold text-white">{tile.title}</p>
                <p className="mt-0.5 text-xs leading-snug text-white/60">{tile.line}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-4 pt-8">
        <h2 className="text-2xl font-bold leading-none text-white sm:text-3xl">Upcoming tournaments</h2>
        {tournaments.isPending ? (
          <p className="mt-6 text-sm text-white/55">Loading the schedule…</p>
        ) : tournaments.isError ? (
          <p className="mt-6 text-sm text-white/55">The schedule did not load. Try again.</p>
        ) : events.length === 0 ? (
          <div className="mt-8 flex flex-col items-center py-6 text-center">
            <CalendarDays className="h-8 w-8" strokeWidth={1.5} style={{ color: ACCENT }} aria-hidden />
            <p className="mt-3 text-sm text-white/70">New weekends coming soon</p>
          </div>
        ) : (
          <ul className="flyer-row -mx-4 mt-5 flex snap-x snap-mandatory overflow-x-auto pb-3 max-md:scroll-px-[7.5vw] max-md:before:w-[7.5vw] max-md:before:shrink-0 max-md:before:content-[''] max-md:after:w-[7.5vw] max-md:after:shrink-0 max-md:after:content-[''] md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:before:content-none md:after:content-none">
            {events.map((event) => (
              <TournamentCard key={event.id} event={event} signedIn={Boolean(user)} />
            ))}
          </ul>
        )}
      </section>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-10 pt-8">
        <p className="max-w-md text-xs leading-relaxed text-white/45">
          Built by Ash Lawson, professional MLB scout with direct connections to college coaches. A place to play — not a promise about recruiting.
        </p>
        <p className="mt-3 text-xs text-white/35">© 2026 423 Sports</p>
      </footer>
    </main>
  );
}

function TournamentCard({ event, signedIn }: { event: PublicTournament; signedIn: boolean }) {
  const ages = formatAgeGroups(event.ageGroups);
  const where = event.parks.length > 0 ? event.parks.join(" · ") : "Location coming";
  const open = event.registrationStatus === "open";
  return (
    <li className="w-[85vw] shrink-0 snap-center px-1.5 md:w-auto md:px-0">
      <article className="overflow-hidden rounded-2xl bg-[#16181d] shadow-[0_16px_40px_rgb(0_0_0/0.35)]">
        <Link to="/t/$weekendId" params={{ weekendId: String(event.id) }} className="block">
          {event.flyer ? (
            <span className="flex aspect-[3/4] w-full items-center justify-center bg-black">
              <img src={event.flyer} alt="" className="max-h-full max-w-full object-contain" />
            </span>
          ) : (
            <div className="flex aspect-[3/4] items-center justify-center bg-black/50 text-sm text-white/45">Flyer coming</div>
          )}
          <div className="px-3.5 pt-3">
            <p className="text-base font-semibold leading-tight text-white">{event.name}</p>
            <p className="mt-1 text-sm text-white/70">{formatWeekendRange(event.startDate, event.endDate)}</p>
            <p className="mt-0.5 text-sm text-white/70">{where}</p>
            {ages ? <p className="mt-0.5 text-sm text-white/70">{ages}</p> : null}
            <p
              className="mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
              style={
                open
                  ? { backgroundColor: "rgb(59 158 255 / 0.16)", color: ACCENT }
                  : { backgroundColor: "rgb(255 255 255 / 0.08)", color: "rgb(255 255 255 / 0.6)" }
              }
            >
              {event.registrationLabel}
            </p>
          </div>
        </Link>
        {event.registrationStatus === "closed" ? (
          <div className="h-3.5" />
        ) : (
          <div className="px-3.5 pb-3.5 pt-3">
            <button
              type="button"
              onClick={() => {
                window.sessionStorage.setItem("pbi-register-weekend", String(event.id));
                if (signedIn) {
                  holdLanding(false);
                  window.location.assign("/teams/new");
                  return;
                }
                openSignInSheet({ returnTo: "/teams/new" });
              }}
              className="inline-flex h-10 items-center rounded-xl px-3 text-sm font-semibold text-white"
              style={{ backgroundColor: ACCENT }}
            >
              Register your team
            </button>
          </div>
        )}
      </article>
    </li>
  );
}
