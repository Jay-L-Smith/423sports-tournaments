import { useQuery } from "@tanstack/react-query";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getMyProfile, type Profile } from "@/lib/pbi/api";
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

  const profile: Profile | null = profileQuery.data ?? null;
  // First bootstrap only. Refetch / mutation invalidation must not unmount the
  // signed-in shell — that reads as a full page load after Approve/Deny.
  const isPending = sessionPending || (Boolean(user) && profile == null && profileQuery.isFetching);

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
