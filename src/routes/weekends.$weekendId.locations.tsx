import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { WeekendAdminFrame } from "@/components/weekend-admin";
import { ParkOptions, ParkSaveChoice, parkSummary } from "@/components/park-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addWeekendLocation,
  listKnownParks,
  removeWeekendLocation,
  setPrimaryPark,
  updateWeekendLocation,
  type WeekendDetail,
  type WeekendLocation,
} from "@/lib/pbi/api";
import {
  emptyParkFlags,
  parseLocationInput,
  type ParkFlags,
} from "@/lib/pbi/weekends";

export const Route = createFileRoute("/weekends/$weekendId/locations")({
  component: TournamentLocationsPage,
});

function TournamentLocationsPage() {
  const { weekendId } = Route.useParams();
  return (
    <WeekendAdminFrame weekendId={weekendId} backTo="hub">
      {(ctx) => <LocationsBody {...ctx} />}
    </WeekendAdminFrame>
  );
}

type Draft = {
  key: string;
  parkId: string;
  name: string;
  address: string;
  flags: ParkFlags;
};

function newDraft(): Draft {
  return { key: `${Date.now()}-${Math.random()}`, parkId: "", name: "", address: "", flags: emptyParkFlags() };
}

function parkKey(name: string, address: string): string {
  return `${name.trim().toLowerCase()}|${address.trim().toLowerCase()}`;
}

function LocationsBody({
  id,
  detail,
  queryClient,
  bump,
}: {
  id: number;
  detail: WeekendDetail;
  queryClient: import("@tanstack/react-query").QueryClient;
  bump: () => void;
}) {
  const planned = detail.rules.fieldCount > 0 ? detail.rules.fieldCount : 1;
  const [extra, setExtra] = useState(0);
  const needed = Math.max(0, planned - detail.locations.length) + extra;
  const [drafts, setDrafts] = useState<Draft[]>(() => Array.from({ length: needed }, newDraft));
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    setDrafts((current) => {
      if (current.length >= needed) return current;
      return [...current, ...Array.from({ length: needed - current.length }, newDraft)];
    });
  }, [needed]);

  const knownQuery = useQuery({
    queryKey: ["known-parks"],
    queryFn: () => listKnownParks(),
  });

  const addParkMut = useMutation({
    mutationFn: (input: { draftKey: string; name: string; address: string; flags: ParkFlags }) =>
      addWeekendLocation({
        data: { weekendId: id, name: input.name, address: input.address, ...input.flags },
      }),
    onSuccess: (next, input) => {
      setDrafts((current) => current.filter((draft) => draft.key !== input.draftKey));
      setExtra((count) => (detail.locations.length + 1 > planned ? Math.max(0, count - 1) : count));
      setErrorKey(null);
      setErrorText(null);
      queryClient.setQueryData(["weekend", id], next);
      void queryClient.invalidateQueries({ queryKey: ["known-parks"] });
      bump();
    },
  });
  const primaryMut = useMutation({
    mutationFn: (locationId: number) => setPrimaryPark({ data: { id: locationId } }),
    onSuccess: (next) => {
      queryClient.setQueryData(["weekend", id], next);
      bump();
    },
  });
  const removeParkMut = useMutation({
    mutationFn: (locationId: number) => removeWeekendLocation({ data: { id: locationId } }),
    onSuccess: (next) => {
      queryClient.setQueryData(["weekend", id], next);
      bump();
    },
  });

  const used = new Set(detail.locations.map((location) => parkKey(location.name, location.address)));
  const known = (knownQuery.data ?? []).filter((park) => !used.has(parkKey(park.name, park.address)));

  function updateDraft(key: string, patch: Partial<Draft>) {
    setDrafts((current) => current.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft)));
  }

  function pickKnown(draft: Draft, parkId: string) {
    const park = known.find((row) => String(row.id) === parkId);
    if (!park) {
      updateDraft(draft.key, { parkId: "" });
      return;
    }
    updateDraft(draft.key, {
      parkId,
      name: park.name,
      address: park.address,
      flags: {
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
      },
    });
  }

  function saveDraft(event: FormEvent, draft: Draft) {
    event.preventDefault();
    setErrorKey(draft.key);
    setErrorText(null);
    try {
      const parsed = parseLocationInput({ weekendId: id, name: draft.name, address: draft.address });
      addParkMut.mutate({ draftKey: draft.key, name: parsed.name, address: parsed.address, flags: draft.flags });
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : "Check the park and try again.");
    }
  }

  const saveError =
    errorText ??
    (addParkMut.error instanceof Error ? addParkMut.error.message : addParkMut.error ? "Could not add that park." : null);

  return (
    <>
      <h1 className="mt-3 font-display text-4xl font-bold uppercase">Locations</h1>
      <p className="mt-1 text-sm text-muted">
        {planned > 1
          ? `This weekend uses ${planned} parks. Fill each card. Name and address are required.`
          : "Every complex this weekend uses. Name and address are required. Mark one primary park."}
      </p>

      <div className="mt-6 space-y-3">
        {detail.locations.map((location, index) => (
          <SavedPark
            key={location.id}
            location={location}
            index={index}
            busyPrimary={primaryMut.isPending}
            busyRemove={removeParkMut.isPending}
            onPrimary={() => primaryMut.mutate(location.id)}
            onRemove={() => removeParkMut.mutate(location.id)}
            onSaved={(next) => {
              queryClient.setQueryData(["weekend", id], next);
              void queryClient.invalidateQueries({ queryKey: ["known-parks"] });
              bump();
            }}
          />
        ))}

        {drafts.map((draft, index) => {
          const taken = new Set(
            drafts.filter((row) => row.key !== draft.key && row.parkId).map((row) => row.parkId),
          );
          const options = known.filter((park) => !taken.has(String(park.id)) || String(park.id) === draft.parkId);
          const pending = addParkMut.isPending && addParkMut.variables?.draftKey === draft.key;
          return (
            <form
              key={draft.key}
              onSubmit={(event) => saveDraft(event, draft)}
              className="space-y-3 rounded-lg border border-dashed border-line bg-surface p-4"
            >
              <p className="font-display text-2xl font-bold uppercase leading-none">
                Park {detail.locations.length + index + 1}
              </p>
              <div className="space-y-1.5">
                <Label htmlFor={`saved-${draft.key}`}>Previously added parks</Label>
                <select
                  id={`saved-${draft.key}`}
                  value={draft.parkId}
                  onChange={(event) => pickKnown(draft, event.target.value)}
                  className="h-12 w-full rounded-md border border-line bg-surface px-3 text-base text-fg"
                >
                  <option value="">
                    {knownQuery.isPending
                      ? "Loading saved parks…"
                      : options.length === 0
                        ? "No saved parks yet"
                        : "Choose a saved park"}
                  </option>
                  {options.map((park) => (
                    <option key={park.id} value={park.id}>
                      {park.name}
                    </option>
                  ))}
                </select>
                {knownQuery.isError ? (
                  <p className="text-xs text-muted">Saved parks could not be loaded. You can still type a new one.</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`name-${draft.key}`}>Name</Label>
                <Input
                  id={`name-${draft.key}`}
                  value={draft.name}
                  onChange={(event) => updateDraft(draft.key, { name: event.target.value, parkId: "" })}
                  placeholder="McMinn County HS"
                  autoComplete="off"
                  maxLength={80}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`address-${draft.key}`}>Address</Label>
                <Input
                  id={`address-${draft.key}`}
                  value={draft.address}
                  onChange={(event) => updateDraft(draft.key, { address: event.target.value, parkId: "" })}
                  placeholder="2215 Congress Parkway, Athens, TN"
                  autoComplete="street-address"
                  maxLength={160}
                  required
                />
              </div>
              <ParkOptions
                idPrefix={draft.key}
                flags={draft.flags}
                onChange={(flags) => updateDraft(draft.key, { flags })}
              />
              {errorKey === draft.key && saveError ? (
                <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
                  {saveError}
                </p>
              ) : null}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Adding…" : "Save park"}
              </Button>
            </form>
          );
        })}

        <Button type="button" variant="outline" className="w-full" onClick={() => setExtra((count) => count + 1)}>
          Add another park
        </Button>
      </div>
    </>
  );
}

function flagsFrom(location: WeekendLocation): ParkFlags {
  return {
    chairs: location.chairs,
    canopies: location.canopies,
    concessions: location.concessions,
    restrooms: location.restrooms,
    lights: location.lights,
    bleachers: location.bleachers,
    entranceFee: location.entranceFee,
    entrancePrice: location.entrancePrice,
    ageDiscount: location.ageDiscount,
    discountAges: location.discountAges,
    discountPrice: location.discountPrice,
  };
}

function SavedPark({
  location,
  index,
  busyPrimary,
  busyRemove,
  onPrimary,
  onRemove,
  onSaved,
}: {
  location: WeekendLocation;
  index: number;
  busyPrimary: boolean;
  busyRemove: boolean;
  onPrimary: () => void;
  onRemove: () => void;
  onSaved: (next: WeekendDetail) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(location.name);
  const [address, setAddress] = useState(location.address);
  const [flags, setFlags] = useState<ParkFlags>(() => flagsFrom(location));
  const [formError, setFormError] = useState<string | null>(null);
  const saveMut = useMutation({
    mutationFn: (saveToResource: boolean) =>
      updateWeekendLocation({
        data: { id: location.id, name, address, saveToResource, ...flags },
      }),
    onSuccess: (next) => {
      setFormError(null);
      setEditing(false);
      onSaved(next);
    },
  });
  const summary = parkSummary(location);
  const errorText =
    formError ??
    (saveMut.error instanceof Error ? saveMut.error.message : saveMut.error ? "Could not save that park." : null);

  function save(saveToResource: boolean) {
    setFormError(null);
    try {
      const parsed = parseLocationInput({ weekendId: 1, name, address });
      setName(parsed.name);
      setAddress(parsed.address);
      saveMut.mutate(saveToResource);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Check the park and try again.");
    }
  }

  return (
    <article className="rounded-lg border border-line bg-surface px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">Park {index + 1}</p>
      {editing ? (
        <div className="mt-3 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor={`edit-name-${location.id}`}>Name</Label>
            <Input id={`edit-name-${location.id}`} value={name} onChange={(event) => setName(event.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`edit-address-${location.id}`}>Address</Label>
            <Input
              id={`edit-address-${location.id}`}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              required
            />
          </div>
          <ParkOptions idPrefix={`edit-${location.id}`} flags={flags} onChange={setFlags} />
          {errorText ? (
            <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
              {errorText}
            </p>
          ) : null}
          <ParkSaveChoice
            busy={saveMut.isPending}
            onTournamentOnly={() => save(false)}
            onUpdateResource={() => save(true)}
          />
          <Button type="button" variant="ghost" className="w-full text-muted" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <>
          <h2 className="mt-1 font-display text-2xl font-bold uppercase leading-none">{location.name}</h2>
          <p className="mt-2 text-sm">{location.address}</p>
          {summary ? (
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted">{summary}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-pressed={location.isPrimary}
              disabled={busyPrimary}
              onClick={onPrimary}
              className={
                location.isPrimary
                  ? "min-h-11 rounded-md border border-pine bg-pine px-3 text-sm font-semibold text-pine-fg"
                  : "min-h-11 rounded-md border border-line bg-bg px-3 text-sm font-semibold"
              }
            >
              {location.isPrimary ? "Primary park" : "Make primary"}
            </button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setName(location.name);
                setAddress(location.address);
                setFlags(flagsFrom(location));
                setFormError(null);
                setEditing(true);
              }}
            >
              Edit
            </Button>
            <Button variant="ghost" className="px-0 text-muted" disabled={busyRemove} onClick={onRemove}>
              Remove
            </Button>
          </div>
        </>
      )}
    </article>
  );
}
