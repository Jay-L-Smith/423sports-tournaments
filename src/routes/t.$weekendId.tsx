import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getPublicTournament } from "@/lib/pbi/api";
import { formatAgeGroups, formatWeekendRange } from "@/lib/pbi/weekends";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { holdLanding, openSignInSheet } from "@/components/sign-in-sheet";

export const Route = createFileRoute("/t/$weekendId")({
  component: PublicTournamentPage,
});

function PublicTournamentPage() {
  const { weekendId } = Route.useParams();
  const id = Number(weekendId);
  const tournament = useQuery({
    queryKey: ["public-tournament", id],
    queryFn: () => getPublicTournament({ data: { id } }),
    enabled: Number.isInteger(id) && id > 0,
  });
  const event = tournament.data;
  const { user } = useCurrentUserState();

  function register(eventId: number) {
    window.sessionStorage.setItem("pbi-register-weekend", String(eventId));
    if (user) {
      holdLanding(false);
      window.location.assign("/teams/new");
      return;
    }
    openSignInSheet({ returnTo: "/teams/new" });
  }

  return (
    <main className="site-splash">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 pt-4">
        <Link to="/" className="text-sm text-white/70">
          All tournaments
        </Link>
        <button type="button" className="text-sm text-white/70" onClick={() => openSignInSheet({ stay: true })}>
          Sign in
        </button>
      </header>
      <article className="mx-auto w-full max-w-3xl px-4 pb-16 pt-4">
        {tournament.isPending ? (
          <p className="text-sm text-white/60">Loading…</p>
        ) : !event ? (
          <p className="text-sm text-white/70">That tournament is not on the public schedule.</p>
        ) : (
          <>
            {event.flyer ? (
              <img src={event.flyer} alt="" className="w-full rounded-2xl bg-black object-contain" />
            ) : null}
            <h1 className="mt-4 text-2xl font-semibold text-white">{event.name}</h1>
            <p className="mt-1 text-sm text-white/75">{formatWeekendRange(event.startDate, event.endDate)}</p>
            {event.ageGroups.length > 0 ? (
              <p className="mt-1 text-sm text-white/75">{formatAgeGroups(event.ageGroups)}</p>
            ) : null}
            <p className={`mt-2 text-sm font-semibold ${event.registrationStatus === "open" ? "text-[#7ec8ff]" : "text-white/60"}`}>
              {event.registrationLabel}
            </p>
            {event.registrationStatus === "closed" ? null : (
              <button
                type="button"
                onClick={() => register(event.id)}
                className="mt-4 inline-flex rounded-full bg-[#2f89e6] px-4 py-2 text-sm font-semibold text-white"
              >
                Register your team
              </button>
            )}

            <section className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white/50">Fields</h2>
              {event.places.length === 0 ? (
                <p className="mt-2 text-sm text-white/70">Parks are not posted yet.</p>
              ) : (
                <ul className="mt-2 space-y-3">
                  {event.places.map((place) => {
                    const query = place.address || place.name;
                    return (
                      <li key={`${place.name}-${place.address}`} className="text-sm text-white/80">
                        <p className="font-semibold text-white">{place.name || "Park"}</p>
                        {place.address ? <p className="text-white/70">{place.address}</p> : null}
                        <p className="mt-1 flex gap-4">
                          <a className="text-[#7ec8ff]" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`} target="_blank" rel="noreferrer">
                            Map
                          </a>
                          <a className="text-[#7ec8ff]" href={`https://forecast.weather.gov/zipcity.php?inputstring=${encodeURIComponent(query)}`} target="_blank" rel="noreferrer">
                            Weather
                          </a>
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white/50">Schedule and scores</h2>
              {event.hasBracket ? (
                <>
                  <p className="mt-2 text-sm text-white/75">Brackets and live scores are open. No account needed.</p>
                  <Link
                    to="/bracket/$weekendId"
                    params={{ weekendId: String(event.id) }}
                    search={{ live: true, view: undefined }}
                    className="mt-3 inline-flex text-sm font-semibold text-[#7ec8ff]"
                  >
                    Open the live sheet
                  </Link>
                </>
              ) : (
                <p className="mt-2 text-sm text-white/75">Brackets and live scores show up here as teams fill in.</p>
              )}
            </section>
          </>
        )}
      </article>
    </main>
  );
}
