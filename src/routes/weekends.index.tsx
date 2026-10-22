import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Navigate, useNavigate, useRouter } from "@tanstack/react-router";
import { CreateCoach } from "@/components/create-coach";
import { SessionSkeleton, useAppSession } from "@/components/session-gate";
import { AppShell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { createWeekend, listWeekends, addWeekendLocation, saveWeekendStaff, setWeekendFlyer, type Weekend } from "@/lib/pbi/api";
import { addDays, emptyParkFlags, isAgeGroup, isSeason, parseWeekendInput, type AgeGroup } from "@/lib/pbi/weekends";

export const Route = createFileRoute("/weekends/")({
  validateSearch: (search: Record<string, unknown>): { add?: 1; start?: string; end?: string; name?: string; age?: AgeGroup; teams?: number; season?: "spring" | "summer" | "fall"; year?: number; announce?: number } => {
    const out: { add?: 1; start?: string; end?: string; name?: string; age?: AgeGroup; teams?: number; season?: "spring" | "summer" | "fall"; year?: number; announce?: number } = {};
    if (search.add === 1 || search.add === "1") out.add = 1;
    if (typeof search.start === "string" && /^\d{4}-\d{2}-\d{2}$/.test(search.start)) out.start = search.start;
    if (typeof search.end === "string" && /^\d{4}-\d{2}-\d{2}$/.test(search.end)) out.end = search.end;
    if (typeof search.name === "string" && search.name.trim()) out.name = search.name.trim().slice(0, 80);
    if (typeof search.age === "string" && isAgeGroup(search.age)) out.age = search.age;
    const teams = Number(search.teams);
    if (Number.isInteger(teams) && teams >= 3 && teams <= 40) out.teams = teams;
    if (isSeason(search.season)) out.season = search.season;
    const year = Number(search.year);
    if (Number.isInteger(year) && year > 2000 && year < 2100) out.year = year;
    const announce = Number(search.announce);
    if (Number.isInteger(announce) && announce > 0) out.announce = announce;
    return out;
  },
  component: WeekendsPage,
});

function WeekendsPage() {
  const { user, isPending, profile } = useAppSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();
  const { add, start, end, name, age, teams, season, year, announce } = Route.useSearch();
  const adding = add === 1;
  const sourceQuery = useQuery({
    queryKey: ["weekends"],
    queryFn: () => listWeekends(),
    enabled: Boolean(user && adding && announce),
  });
  const source = sourceQuery.data?.find((row) => row.id === announce) ?? null;

  const createMut = useMutation({
    mutationFn: async (input: {
      name: string;
      startDate: string;
      endDate: string;
      ageGroups: string[];
      maxTeams: number;
      poolPlay: boolean;
      dayPlan: ReturnType<typeof parseWeekendInput>["dayPlan"];
      rules: ReturnType<typeof parseWeekendInput>["rules"];
      teamFee?: string;
      parks: { name: string; address: string }[];
      staff: { gate: { staffId: number | null; otherName: string | null; otherPhone: string | null }; scorekeeper: { staffId: number | null; otherName: string | null; otherPhone: string | null } }[];
      flyer?: string | null;
    }) => {
      const created = await createWeekend({ data: { ...parseWeekendInput(input), teamFee: input.teamFee ?? null, season, year } });
      let locations: { id: number }[] = [];
      for (const park of input.parks) {
        const detail = await addWeekendLocation({
          data: { weekendId: created.id, name: park.name, address: park.address, ...emptyParkFlags() },
        });
        locations = detail.locations;
      }
      const slots = locations.flatMap((location, index) => {
        const row = input.staff[index];
        if (!row) return [];
        return (["gate", "scorekeeper"] as const).flatMap((role) => {
          const slot = row[role];
          const filled = slot.staffId != null || (Boolean(slot.otherName) && (slot.otherPhone ?? "").replace(/\D/g, "").length === 10);
          if (!filled) return [];
          return [{
            locationId: location.id,
            role,
            staffId: slot.staffId,
            otherName: slot.otherName,
            otherPhone: slot.otherPhone,
          }];
        });
      });
      if (slots.length > 0) {
        await saveWeekendStaff({ data: { weekendId: created.id, slots } });
      }
      if (input.flyer) await setWeekendFlyer({ data: { weekendId: created.id, flyer: input.flyer } });
      return created;
    },
    onSuccess: (created) => {
      queryClient.setQueryData<Weekend[]>(["weekends"], (current) => {
        const nextList = [...(current ?? []).filter((row) => row.id !== created.id), created];
        nextList.sort((a, b) =>
          a.startDate === b.startDate ? a.id - b.id : a.startDate.localeCompare(b.startDate),
        );
        return nextList;
      });
      void queryClient.invalidateQueries({ queryKey: ["weekends"] });
      void navigate({ to: "/weekends/$weekendId", params: { weekendId: String(created.id) } });
    },
  });

  if (isPending) return <SessionSkeleton />;
  if (!user) return <RedirectToSignIn />;
  if (!profile) return <Navigate to="/" />;
  if (profile.homeRole !== "admin") return <Navigate to="/" />;
  if (!adding) return <Navigate to="/" />;

  const pendingMut = createMut;
  const errorText = pendingMut.error instanceof Error ? pendingMut.error.message : pendingMut.error ? "Could not save that tournament." : null;
  const finishing = Boolean(announce);

  return (
    <AppShell homeRole={profile.homeRole}>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-4xl font-bold uppercase">Create tournament</h1>
        <Button
          type="button"
          variant="ghost"
          className="px-2 text-muted"
          onClick={() => {
            if (announce) {
              router.history.back();
              return;
            }
            void navigate({ to: "/" });
          }}
        >
          Cancel
        </Button>
      </div>
      {finishing && sourceQuery.isPending ? <p className="mt-6 text-sm text-muted">Loading that tournament…</p> : null}
      {finishing && sourceQuery.isSuccess && (!source || source.lifecycle !== "announced") ? (
        <p className="mt-6 rounded-md bg-warn-bg px-3 py-2 text-sm">That tournament is already built, or it’s gone.</p>
      ) : null}
      {!finishing || (source && source.lifecycle === "announced") ? (
      <CreateCoach
        busy={pendingMut.isPending}
        error={errorText}
        finish={finishing}
        interestCount={finishing ? (source?.interestCount ?? 0) : (teams ?? 0)}
        initialName={finishing ? source?.name : name}
        initialAge={age}
        initialStart={source?.startDate ?? start}
        initialEnd={source?.endDate ?? end ?? (start ? addDays(start, 1) : undefined)}
        onCreate={(input) => {
          createMut.mutate({
            name: input.name,
            startDate: input.startDate,
            endDate: input.endDate,
            ageGroups: input.ageGroups,
            maxTeams: input.maxTeams,
            poolPlay: input.poolPlay,
            dayPlan: input.dayPlan,
            rules: input.rules,
            teamFee: input.teamFee,
            parks: input.parks,
            staff: input.staff,
            flyer: input.flyer,
          });
        }}
      />
      ) : null}
    </AppShell>
  );
}
