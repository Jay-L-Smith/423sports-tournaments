import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { WeekendAdminFrame, bumpWeekend } from "@/components/weekend-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  listStaffPicks,
  listWeekendStaff,
  saveWeekendStaff,
  staffCrossFieldWarning,
  type StaffPick,
  type StaffRole,
  type WeekendDetail,
  type WeekendStaffSlot,
} from "@/lib/pbi/api";
import { formatPhoneInput } from "@/lib/utils";

export const Route = createFileRoute("/weekends/$weekendId/staff")({
  component: TournamentStaffPage,
});

const ROLES: { role: StaffRole; label: string }[] = [
  { role: "gate", label: "Gate attendant" },
  { role: "scorekeeper", label: "Scorekeeper" },
];

type Choice = {
  pick: string;
  otherName: string;
  otherPhone: string;
};

function TournamentStaffPage() {
  const { weekendId } = Route.useParams();
  return (
    <WeekendAdminFrame weekendId={weekendId} backTo="hub" adminOnly>
      {(ctx) => <StaffBody id={ctx.id} detail={ctx.detail} />}
    </WeekendAdminFrame>
  );
}

function choiceFrom(slot: WeekendStaffSlot | undefined, picks: StaffPick[]): Choice {
  if (!slot) return { pick: "", otherName: "", otherPhone: "" };
  if (slot.staffId) return { pick: `staff:${slot.staffId}`, otherName: "", otherPhone: "" };
  const digits = (slot.otherPhone ?? "").replace(/\D/g, "").slice(-10);
  const admin = picks.find((pick) => pick.key.startsWith("admin:") && digits.length === 10 && pick.phone.replace(/\D/g, "").slice(-10) === digits);
  if (admin) return { pick: admin.key, otherName: "", otherPhone: "" };
  if (slot.otherName || slot.otherPhone) {
    return { pick: "other", otherName: slot.otherName ?? "", otherPhone: slot.otherPhone ?? "" };
  }
  return { pick: "", otherName: "", otherPhone: "" };
}

function slotsFrom(detail: WeekendDetail, choices: Record<string, Choice>, picks: StaffPick[]): WeekendStaffSlot[] {
  return detail.locations.flatMap((location) =>
    ROLES.map(({ role }) => {
      const choice = choices[`${location.id}:${role}`] ?? { pick: "", otherName: "", otherPhone: "" };
      if (choice.pick.startsWith("admin:")) {
        const person = picks.find((pick) => pick.key === choice.pick);
        return {
          locationId: location.id,
          role,
          staffId: null,
          otherName: person?.name ?? "",
          otherPhone: person?.phone ?? "",
        };
      }
      const parsed = choice.pick.startsWith("staff:") ? Number(choice.pick.slice(6)) : null;
      const staffId = parsed != null && Number.isInteger(parsed) && parsed > 0 ? parsed : null;
      return {
        locationId: location.id,
        role,
        staffId,
        otherName: choice.pick === "other" ? choice.otherName.trim() : null,
        otherPhone: choice.pick === "other" ? choice.otherPhone : null,
      };
    }),
  );
}

function StaffBody({ id, detail }: { id: number; detail: WeekendDetail }) {
  const queryClient = useQueryClient();
  const staffQuery = useQuery({ queryKey: ["staff-picks"], queryFn: () => listStaffPicks() });
  const assignedQuery = useQuery({
    queryKey: ["weekend-staff", id],
    queryFn: () => listWeekendStaff({ data: { weekendId: id } }),
  });
  const [choices, setChoices] = useState<Record<string, Choice> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const picks = staffQuery.data ?? [];
  const members = picks
    .filter((pick) => pick.key.startsWith("staff:"))
    .map((pick) => ({ id: Number(pick.key.slice(6)), name: pick.name, phone: pick.phone }));
  const current = choices ?? Object.fromEntries(
    detail.locations.flatMap((location) =>
      ROLES.map(({ role }) => {
        const slot = (assignedQuery.data ?? []).find((row) => row.locationId === location.id && row.role === role);
        return [`${location.id}:${role}`, choiceFrom(slot, picks)];
      }),
    ),
  );
  const draft = slotsFrom(detail, current, picks);
  const liveWarning = staffCrossFieldWarning(draft, members);

  const save = useMutation({
    mutationFn: () => saveWeekendStaff({ data: { weekendId: id, slots: draft } }),
    onSuccess: async (result) => {
      setError(null);
      setWarning(result.warning);
      queryClient.setQueryData(["weekend", id], result.detail);
      await queryClient.invalidateQueries({ queryKey: ["weekend-staff", id] });
      bumpWeekend(queryClient, id);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Could not save staff."),
  });

  function setChoice(key: string, patch: Partial<Choice>) {
    setChoices({ ...current, [key]: { ...current[key], ...patch } });
    setWarning(null);
  }

  return (
    <>
      <h1 className="mt-3 font-display text-4xl font-bold uppercase">Staff</h1>
      <p className="mt-1 text-sm text-muted">
        Each field needs a gate attendant and a scorekeeper. One person can do both on the same field.
      </p>
      {detail.locations.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-line bg-surface px-4 py-4 text-sm text-muted">Add a field first.</p>
      ) : staffQuery.isPending || assignedQuery.isPending ? (
        <p className="mt-6 text-sm text-muted">Loading staff…</p>
      ) : (
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            save.mutate();
          }}
        >
          {detail.locations.map((location, index) => (
            <section key={location.id} className="space-y-3 rounded-lg border border-line bg-surface p-4">
              <h2 className="font-display text-2xl font-bold uppercase leading-none">{location.name || `Field ${index + 1}`}</h2>
              {ROLES.map(({ role, label }) => {
                const key = `${location.id}:${role}`;
                const choice = current[key] ?? { pick: "", otherName: "", otherPhone: "" };
                return (
                  <div key={role} className="space-y-2">
                    <Label htmlFor={key}>{label}</Label>
                    <select
                      id={key}
                      value={choice.pick}
                      onChange={(event) => setChoice(key, { pick: event.target.value })}
                      className="h-12 w-full rounded-md border border-line bg-surface px-3 text-base text-fg"
                    >
                      <option value="">Choose staff</option>
                      {picks.map((pick) => (
                        <option key={pick.key} value={pick.key}>
                          {pick.name}
                        </option>
                      ))}
                      <option value="other">Other</option>
                    </select>
                    {choice.pick === "other" ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input
                          value={choice.otherName}
                          onChange={(event) => setChoice(key, { otherName: event.target.value })}
                          placeholder="Name"
                          aria-label={`${label} name`}
                          maxLength={80}
                          required
                        />
                        <Input
                          value={choice.otherPhone}
                          onChange={(event) => setChoice(key, { otherPhone: formatPhoneInput(event.target.value) })}
                          placeholder="(555) 555-0100"
                          aria-label={`${label} phone`}
                          inputMode="tel"
                          autoComplete="off"
                          name="other-cell"
                          required
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </section>
          ))}
          {liveWarning || warning ? (
            <p className="rounded-md bg-warn-bg px-3 py-2 text-sm font-semibold" role="status">
              {liveWarning ?? warning}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">{error}</p>
          ) : null}
          <Button type="submit" className="w-full" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save staff"}
          </Button>
        </form>
      )}
    </>
  );
}
