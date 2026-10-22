import { useQuery } from "@tanstack/react-query";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getMyProfile, type Profile } from "@/lib/pbi/api";
import { useSuperuserView } from "@/lib/pbi/view-role";
import type { ReactNode } from "react";

export function SessionSkeleton() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-bg px-4 py-8">
      <p className="font-display text-2xl font-bold uppercase tracking-wide">423Sports</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Tournaments</p>
      <p className="mt-2 text-sm text-muted">Loading your home…</p>
      <div className="mt-8 h-10 w-3/4 animate-pulse rounded-md bg-line" />
      <div className="mt-6 h-20 animate-pulse rounded-lg bg-line" />
      <div className="mt-3 h-20 animate-pulse rounded-lg bg-line" />
    </div>
  );
}

export function useAppSession() {
  const { user, isPending: sessionPending } = useCurrentUserState();
  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getMyProfile(),
    enabled: Boolean(user),
    retry: false,
  });

  const { view, ready } = useSuperuserView();
  const loaded: Profile | null = profileQuery.data ?? null;
  const canFlip = Boolean(loaded?.isSuperuser || loaded?.coachPreview);
  const profile: Profile | null = canFlip && view === "coach" ? { ...loaded!, homeRole: "coach" } : loaded;
  // A cancelled session used to leave this true forever, which pinned the
  // "Loading your home…" screen. Ignore the pending flag once a user exists,
  // and don't spin after the profile request has already failed.
  // Superuser coach view lives in this browser. Wait until that choice is
  // read so a page does not treat them as admin and bounce them home.
  const isPending =
    (sessionPending && !user) ||
    (Boolean(user) && profile == null && profileQuery.isFetching && !profileQuery.isError) ||
    (canFlip && !ready);

  return {
    user,
    isPending,
    profile,
    profileError: profileQuery.error,
    refetchProfile: profileQuery.refetch,
  };
}

export function AuthedFrame({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
