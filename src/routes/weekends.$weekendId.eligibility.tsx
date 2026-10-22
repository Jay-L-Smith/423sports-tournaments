import { createFileRoute } from "@tanstack/react-router";
import { WeekendAdminFrame } from "@/components/weekend-admin";
import { eligibilityLadder, seasonFromDate } from "@/lib/pbi/weekends";

export const Route = createFileRoute("/weekends/$weekendId/eligibility")({
  component: EligibilityPage,
});

function EligibilityLine({ line, className }: { line: string; className: string }) {
  const bornAt = line.indexOf("born");
  const splitAt = line.indexOf(". Or ");
  if (bornAt < 0 || splitAt < 0) return <p className={className}>{line}</p>;
  return (
    <p className={`flex ${className}`}>
      <span className="shrink-0 whitespace-pre">{line.slice(0, bornAt)}</span>
      <span>
        {line.slice(bornAt, splitAt + 1)}
        <br />
        {line.slice(splitAt + 2)}
      </span>
    </p>
  );
}

function EligibilityPage() {
  const { weekendId } = Route.useParams();
  return (
    <WeekendAdminFrame weekendId={weekendId} backTo="hub">
      {({ detail }) => {
        const mine = new Set(detail.ageGroups);
        const year = detail.seasonYear ?? seasonFromDate(detail.startDate)?.year ?? Number(detail.startDate.slice(0, 4));
        return (
          <>
            <h1 className="mt-3 font-display text-4xl font-bold uppercase">Eligibility</h1>
            <ul className="mt-4 space-y-1">
              {eligibilityLadder(year).map((line) => {
                const on = mine.has(line.slice(0, line.indexOf(":")));
                return (
                  <li key={line}>
                    <EligibilityLine
                      line={line}
                      className={on ? "text-sm font-semibold leading-snug text-[#1f7a3a]" : "text-sm leading-snug text-muted"}
                    />
                  </li>
                );
              })}
            </ul>
          </>
        );
      }}
    </WeekendAdminFrame>
  );
}
