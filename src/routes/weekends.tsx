import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/weekends")({
  component: WeekendsLayout,
});

function WeekendsLayout() {
  return <Outlet />;
}
