import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/weekends/$weekendId")({
  component: TournamentLayout,
});

function TournamentLayout() {
  return <Outlet />;
}
