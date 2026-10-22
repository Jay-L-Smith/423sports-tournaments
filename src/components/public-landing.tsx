import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { listPublicTournaments } from "@/lib/pbi/api";
import { formatAgeGroups, formatTeamFee, formatWeekendRange } from "@/lib/pbi/weekends";

export function PublicLanding() {
  const tournaments = useQuery({
    queryKey: ["public-tournaments"],
    queryFn: () => listPublicTournaments(),
  });
  const events = tournaments.data ?? [];

  return (
    <main className="site-splash mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-10 pt-10">
      <img src="/logo.png" alt="423Sports" className="mx-auto mb-8 block w-full max-w-[19rem]" />
      <h1 className="text-3xl font-bold tracking-tight text-white">Upcoming tournaments</h1>

      {tournaments.isPending ? (
        <p className="mt-6 text-sm text-white/60">Loading the schedule…</p>
      ) : events.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-white/15 px-4 py-4 text-sm text-white/70">Nothing on the schedule yet.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {events.map((event) => {
            const fee = formatTeamFee(event.teamFeeCents);
            const ages = formatAgeGroups(event.ageGroups);
            return (
              <li key={event.id} className="overflow-hidden rounded-2xl border border-white/15 bg-white text-[#1a1a1a]">
                {event.flyer ? <img src={event.flyer} alt="" className="h-28 w-full object-cover object-top" /> : null}
                <div className="px-4 py-3">
                  <p className="font-display text-xl font-bold uppercase leading-tight">{event.name}</p>
                  <p className="mt-1 text-sm">{formatWeekendRange(event.startDate, event.endDate)}</p>
                  {ages ? <p className="mt-1 text-sm text-[#3a3a3a]">{ages}</p> : null}
                  {fee ? <p className="mt-1 text-sm font-semibold">{fee} a team</p> : null}
                  {event.parks.length > 0 ? <p className="mt-1 text-sm text-[#3a3a3a]">{event.parks.join(" · ")}</p> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Link to="/login" className="site-cta mt-6 flex h-12 items-center justify-center text-sm font-semibold uppercase">
        Sign in
      </Link>
      <p className="mt-4 text-center text-sm text-white/70">
        New here?{" "}
        <Link to="/join" className="font-semibold text-white">
          Create an account
        </Link>
      </p>
    </main>
  );
}
