import { createFileRoute, Link } from "@tanstack/react-router";
import { SectionLink, WeekendAdminFrame } from "@/components/weekend-admin";
import { ADVANCE_LABELS, ELIMINATION_LABELS } from "@/lib/pbi/rules";
import { formatAgeGroups, formatWeekendRange } from "@/lib/pbi/weekends";

export const Route = createFileRoute("/weekends/$weekendId/")({
  component: TournamentHubPage,
});

function TournamentHubPage() {
  const { weekendId } = Route.useParams();

  return (
    <WeekendAdminFrame weekendId={weekendId} backTo="list">
      {({ detail }) => (
        <>
          <h1 className="mt-3 font-display text-4xl font-bold uppercase">{detail.name}</h1>
          <p className="mt-1 text-sm font-medium">{formatWeekendRange(detail.startDate, detail.endDate)}</p>
          <p className="mt-1 text-sm text-muted">
            {formatAgeGroups(detail.ageGroups) || "No ages yet"} · {detail.approvedCount}/{detail.maxTeams} in
          </p>

          <Link
            to="/bracket/$weekendId"
            params={{ weekendId: String(detail.id) }}
            className="mt-5 flex min-h-14 w-full items-center justify-center rounded-md bg-primary px-5 text-lg font-semibold text-primary-fg"
          >
            Open Bracket
          </Link>

          <nav className="mt-6 space-y-3" aria-label="Tournament sections">
            <SectionLink
              to="/weekends/$weekendId/edit"
              weekendId={weekendId}
              title="Edit tournament"
              hint="Name, dates, ages, each day’s plan"
            />
            <SectionLink
              to="/weekends/$weekendId/rules"
              weekendId={weekendId}
              title="Bracket rules"
              hint={`${ELIMINATION_LABELS[detail.rules.elimination]} · ${ADVANCE_LABELS[detail.rules.advance]}`}
            />
            <SectionLink
              to="/weekends/$weekendId/teams"
              weekendId={weekendId}
              title="Teams in"
              hint={
                detail.approvedCount === 0
                  ? "No clubs yet"
                  : `${detail.approvedCount}/${detail.maxTeams} in`
              }
            />
            <SectionLink
              to="/weekends/$weekendId/locations"
              weekendId={weekendId}
              title="Locations"
              hint={
                detail.locations.length === 0
                  ? "Add parks"
                  : `${detail.locations.length} park${detail.locations.length === 1 ? "" : "s"}`
              }
            />
          </nav>
        </>
      )}
    </WeekendAdminFrame>
  );
}
