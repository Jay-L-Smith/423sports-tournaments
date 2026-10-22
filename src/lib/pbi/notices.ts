import type { NotificationItem } from "@/lib/pbi/api";

/** Coach notifications are only new tournaments, or a change to one. */
export function coachTournamentBucket(item: NotificationItem): "new" | "change" | "assistant" | null {
  const title = item.title.toLowerCase();
  const body = item.body.toLowerCase();
  const kind = item.kind.toLowerCase();
  if (kind === "assistant" || kind === "assistant-join") return "assistant";
  if (kind === "available" || body.includes("if your team is interested")) return "new";
  if (
    kind === "teams" ||
    title.includes("you're in") ||
    title.includes("team not accepted") ||
    title.includes("waiting for approval") ||
    title.includes("schedule") ||
    title.includes("cancelled") ||
    title.includes("canceled") ||
    title.includes("taken off") ||
    title.includes("removed") ||
    title.includes("weather") ||
    title.includes("rain") ||
    body.includes("rainout")
  ) {
    return "change";
  }
  return null;
}
