import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, House, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { BrandLockup } from "@/components/brand";
import { ROLE_COPY, type Role } from "@/lib/pbi/roles";
import { cn } from "@/lib/utils";

export function AppShell({
  homeRole,
  pendingLabel,
  unread,
  wide = false,
  children,
}: {
  homeRole: Role;
  pendingLabel?: string | null;
  unread: number;
  wide?: boolean;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = [
    { to: "/", label: "Home", icon: House, match: (p: string) => p === "/" },
    {
      to: "/notifications",
      label: "Notifications",
      icon: Bell,
      match: (p: string) => p.startsWith("/notifications"),
      badge: unread,
    },
    {
      to: "/account",
      label: "Account",
      icon: UserRound,
      match: (p: string) => p.startsWith("/account"),
    },
  ] as const;

  return (
    <div className={cn("mx-auto flex min-h-dvh flex-col bg-bg", wide ? "max-w-none" : "max-w-lg")}>
      <header className="sticky top-0 z-10 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur landscape:py-2">
        <div className="flex items-center gap-3">
          <BrandLockup compact />
          <p className="ml-auto shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            {pendingLabel ?? ROLE_COPY[homeRole].label}
          </p>
        </div>
        <div className="stitch mt-3 landscape:mt-2" />
      </header>
      <main className={cn("flex-1 px-4 py-5", wide ? "pb-24 landscape:pb-3" : "pb-24")}>{children}</main>
      <nav
        className={cn(
          "fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 backdrop-blur",
          wide && "landscape:hidden",
        )}
      >
        <div className="mx-auto grid max-w-lg grid-cols-3">
          {items.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            const badge = "badge" in item ? item.badge : 0;
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
                {badge ? (
                  <span className="absolute right-1/4 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] text-primary-fg">
                    {badge > 9 ? "9+" : badge}
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
