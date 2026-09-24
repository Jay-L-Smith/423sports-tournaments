import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { ParkOptions, parkSummary } from "@/components/park-options";
import { SessionSkeleton, useAppSession } from "@/components/session-gate";
import { AppShell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { listKnownParks, updateKnownPark, type KnownPark } from "@/lib/pbi/api";
import { parseLocationInput, type ParkFlags } from "@/lib/pbi/weekends";

export const Route = createFileRoute("/resources")({
  component: ResourcesPage,
});

function flagsFrom(park: KnownPark): ParkFlags {
  return {
    chairs: park.chairs,
    canopies: park.canopies,
    concessions: park.concessions,
    restrooms: park.restrooms,
    lights: park.lights,
    bleachers: park.bleachers,
    entranceFee: park.entranceFee,
    entrancePrice: park.entrancePrice,
    ageDiscount: park.ageDiscount,
    discountAges: park.discountAges,
    discountPrice: park.discountPrice,
  };
}

function ResourcesPage() {
  const { user, isPending, profile } = useAppSession();
  const queryClient = useQueryClient();
  const parksQuery = useQuery({
    queryKey: ["known-parks"],
    queryFn: () => listKnownParks(),
    enabled: Boolean(profile?.homeRole === "admin"),
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  if (isPending) return <SessionSkeleton />;
  if (!user) return <RedirectToSignIn />;
  if (!profile || profile.homeRole !== "admin") return <Navigate to="/" />;

  const parks = parksQuery.data ?? [];

  return (
    <AppShell homeRole={profile.homeRole}>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-4xl font-bold uppercase">Resources</h1>
        <Link to="/" className="text-sm font-semibold text-primary">
          Home
        </Link>
      </div>
      <p className="mt-2 text-sm text-muted">
        Parks you use again. Umpires and gate attendants will live here too.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="font-display text-2xl font-bold uppercase">Parks</h2>
        {parksQuery.isPending ? (
          <p className="text-sm text-muted">Loading parks…</p>
        ) : parks.length === 0 ? (
          <p className="rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted">
            No parks saved yet. Add one on a tournament and it shows up here.
          </p>
        ) : (
          parks.map((park) => (
            <ParkCard
              key={park.id}
              park={park}
              editing={editingId === park.id}
              onEdit={() => setEditingId(park.id)}
              onCancel={() => setEditingId(null)}
              onSaved={(next) => {
                queryClient.setQueryData<KnownPark[]>(["known-parks"], (current) =>
                  (current ?? []).map((row) => (row.id === next.id ? next : row)),
                );
                setEditingId(null);
              }}
            />
          ))
        )}
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-2xl font-bold uppercase">Umpires</h2>
        <p className="rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted">None yet.</p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-2xl font-bold uppercase">Gate attendants</h2>
        <p className="rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted">None yet.</p>
      </section>
    </AppShell>
  );
}

function ParkCard({
  park,
  editing,
  onEdit,
  onCancel,
  onSaved,
}: {
  park: KnownPark;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSaved: (park: KnownPark) => void;
}) {
  const [name, setName] = useState(park.name);
  const [address, setAddress] = useState(park.address);
  const [flags, setFlags] = useState<ParkFlags>(() => flagsFrom(park));
  const [formError, setFormError] = useState<string | null>(null);
  const saveMut = useMutation({
    mutationFn: () => updateKnownPark({ data: { id: park.id, name, address, ...flags } }),
    onSuccess: (next) => {
      setFormError(null);
      onSaved(next);
    },
  });
  const summary = parkSummary(park);
  const errorText =
    formError ??
    (saveMut.error instanceof Error ? saveMut.error.message : saveMut.error ? "Could not save that park." : null);

  function save() {
    setFormError(null);
    try {
      parseLocationInput({ weekendId: 1, name, address });
      saveMut.mutate();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Check the park and try again.");
    }
  }

  return (
    <article className="rounded-lg border border-line bg-surface px-4 py-4">
      {editing ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor={`resource-name-${park.id}`}>Name</Label>
            <Input id={`resource-name-${park.id}`} value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`resource-address-${park.id}`}>Address</Label>
            <Input
              id={`resource-address-${park.id}`}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          </div>
          <ParkOptions idPrefix={`resource-${park.id}`} flags={flags} onChange={setFlags} />
          <p className="text-xs text-muted">This updates the saved park. Tournaments already using it stay as they are.</p>
          {errorText ? (
            <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
              {errorText}
            </p>
          ) : null}
          <Button type="button" className="w-full" disabled={saveMut.isPending} onClick={save}>
            {saveMut.isPending ? "Saving…" : "Save park"}
          </Button>
          <Button type="button" variant="ghost" className="w-full text-muted" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      ) : (
        <>
          <h2 className="font-display text-2xl font-bold uppercase leading-none">{park.name}</h2>
          <p className="mt-2 text-sm">{park.address}</p>
          {summary ? <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted">{summary}</p> : null}
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => {
              setName(park.name);
              setAddress(park.address);
              setFlags(flagsFrom(park));
              setFormError(null);
              onEdit();
            }}
          >
            Edit
          </Button>
        </>
      )}
    </article>
  );
}
