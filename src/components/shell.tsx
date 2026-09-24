import { useQuery } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, House, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand";
import { useAppSession } from "@/components/session-gate";
import { listNotifications, listPendingRequests, listPendingTeams } from "@/lib/pbi/api";
import { ROLE_COPY, type Role } from "@/lib/pbi/roles";
import { cn } from "@/lib/utils";

function useNavBadge() {
  const { user, profile } = useAppSession();
  const notifQuery = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => listNotifications(),
    enabled: Boolean(user && profile),
  });
  const pendingQuery = useQuery({
    queryKey: ["pending-requests"],
    queryFn: () => listPendingRequests(),
    enabled: Boolean(profile?.homeRole === "admin"),
  });
  const pendingTeamsQuery = useQuery({
    queryKey: ["pending-teams"],
    queryFn: () => listPendingTeams(),
    enabled: Boolean(profile?.homeRole === "admin"),
  });
  const unread = (notifQuery.data ?? []).filter((n) => !n.read).length;
  const pending =
    profile?.homeRole === "admin"
      ? (pendingQuery.data?.length ?? 0) + (pendingTeamsQuery.data?.length ?? 0)
      : 0;
  return unread + pending;
}

export function AppShell({
  homeRole,
  pendingLabel,
  wide = false,
  children,
}: {
  homeRole: Role;
  pendingLabel?: string | null;
  wide?: boolean;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const badge = useNavBadge();
  const items = [
    { to: "/", label: "Home", icon: House, match: (p: string) => p === "/" },
    {
      to: "/notifications",
      label: "Notifications",
      icon: Bell,
      match: (p: string) => p.startsWith("/notifications"),
      badge,
    },
    {
      to: "/account",
      label: "Account",
      icon: UserRound,
      match: (p: string) => p.startsWith("/account"),
    },
  ] as const;

  return (
    <div className={cn("mx-auto flex min-h-dvh flex-col bg-white text-fg", wide ? "max-w-none" : "max-w-lg")}>
      <header className="sticky top-0 z-10 bg-[#1c1c1c] px-3 py-2.5 text-white">
        <div className="flex items-center gap-3">
          <BrandMark className="h-14 w-auto" />
          <p className="ml-auto shrink-0 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
            {pendingLabel ?? ROLE_COPY[homeRole].label}
          </p>
        </div>
      </header>
      <main className={cn("flex-1 bg-white px-4 py-5 text-[#222]", wide ? "pb-24 landscape:pb-3" : "pb-24")}>{children}</main>
      <nav
        className={cn(
          "fixed inset-x-0 bottom-0 z-10 border-t border-[#e5e5e5] bg-white",
          wide && "landscape:hidden",
        )}
      >
        <div className="mx-auto grid max-w-lg grid-cols-3">
          {items.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            const count = "badge" in item ? item.badge : 0;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold",
                  active ? "text-primary" : "text-muted",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                {item.label}
                {count ? (
                  <span className="absolute right-1/4 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] text-primary-fg">
                    {count > 9 ? "9+" : count}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
