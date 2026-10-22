import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { WeekendAdminFrame } from "@/components/weekend-admin";
import { ParkOptions, ParkSaveChoice, parkSummary } from "@/components/park-options";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addWeekendLocation,
  listKnownParks,
  removeWeekendLocation,
  setPrimaryPark,
  updateWeekendLocation,
  type KnownPark,
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
  scratch: boolean;
};

function newDraft(): Draft {
  return { key: `${Date.now()}-${Math.random()}`, parkId: "", name: "", address: "", flags: emptyParkFlags(), scratch: false };
}

function parkKey(name: string, address: string): string {
  return `${name.trim().toLowerCase()}|${address.trim().toLowerCase()}`;
}

function LocationsBody({
  id,
  detail,
  queryClient,
  bump,
  readOnly,
}: {
  id: number;
  detail: WeekendDetail;
  queryClient: import("@tanstack/react-query").QueryClient;
  bump: () => void;
  readOnly: boolean;
}) {
  const navigate = useNavigate();
  const required = detail.approvedCount >= 8 ? 2 : 1;
  const [extra, setExtra] = useState(0);
  const requiredSlots = Math.max(0, required - detail.locations.length);
  const needed = requiredSlots + extra;
  const [drafts, setDrafts] = useState<Draft[]>(() => Array.from({ length: needed }, newDraft));
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [dropPark, setDropPark] = useState<WeekendLocation | null>(null);

  useEffect(() => {
    setDrafts((current) => {
      if (current.length >= needed) return current;
      return [...current, ...Array.from({ length: needed - current.length }, newDraft)];
    });
  }, [needed]);

  const knownQuery = useQuery({
    queryKey: ["known-parks"],
    queryFn: () => listKnownParks(),
    enabled: !readOnly,
  });

  const addParkMut = useMutation({
    mutationFn: (input: { draftKey: string; name: string; address: string; flags: ParkFlags }) =>
      addWeekendLocation({
        data: { weekendId: id, name: input.name, address: input.address, ...input.flags },
      }),
    onSuccess: (next, input) => {
      setDrafts((current) => current.filter((draft) => draft.key !== input.draftKey));
      setExtra((count) => (detail.locations.length + 1 > required ? Math.max(0, count - 1) : count));
      setErrorKey(null);
      setErrorText(null);
      queryClient.setQueryData(["weekend", id], next);
      void queryClient.invalidateQueries({ queryKey: ["known-parks"] });
      void queryClient.invalidateQueries({ queryKey: ["schedule", id] });
      bump();
      void navigate({ to: "/weekends/$weekendId", params: { weekendId: String(id) } });
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
      void queryClient.invalidateQueries({ queryKey: ["schedule", id] });
      bump();
    },
  });

  const used = new Set(detail.locations.map((location) => parkKey(location.name, location.address)));
  const known = (knownQuery.data ?? []).filter((park) => !used.has(parkKey(park.name, park.address)));

  function updateDraft(key: string, patch: Partial<Draft>) {
    setDrafts((current) => current.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft)));
  }

  function addKnown(draft: Draft, parkId: string) {
    const park = known.find((row) => String(row.id) === parkId);
    if (!park) return;
    setErrorKey(draft.key);
    setErrorText(null);
    addParkMut.mutate({
      draftKey: draft.key,
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
        {readOnly
          ? detail.locations.length === 0
            ? "No parks yet."
            : "Parks for this tournament."
          : required > 1
            ? `${detail.approvedCount} teams need 2 parks. A second park is required from 8 teams up.`
            : "7 or fewer teams use 1 park. Name and address are required."}
      </p>

      <div className="mt-6 space-y-3">
        {removeParkMut.error instanceof Error ? (
          <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
            {removeParkMut.error.message}
          </p>
        ) : null}
        {readOnly ? null : (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 w-11 min-h-11 px-0"
              aria-label="Add another park"
              onClick={() => setExtra((count) => count + 1)}
            >
              <Plus className="h-5 w-5" aria-hidden />
            </Button>
          </div>
        )}
        {readOnly && detail.locations.length === 0 ? (
          <p className="rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted">No parks yet.</p>
        ) : null}
        {detail.locations.map((location, index) => (
          <SavedPark
            key={location.id}
            location={location}
            index={index}
            known={(knownQuery.data ?? []).filter(
              (park) =>
                !detail.locations.some(
                  (other) => other.id !== location.id && parkKey(other.name, other.address) === parkKey(park.name, park.address),
                ),
            )}
            readOnly={readOnly}
            busyPrimary={primaryMut.isPending}
            busyRemove={removeParkMut.isPending}
            removable={index >= required}
            parkNeed={required}
            onPrimary={() => primaryMut.mutate(location.id)}
            onRemove={() => setDropPark(location)}
            onSaved={(next) => {
              queryClient.setQueryData(["weekend", id], next);
              void queryClient.invalidateQueries({ queryKey: ["known-parks"] });
              bump();
              void navigate({ to: "/weekends/$weekendId", params: { weekendId: String(id) } });
            }}
          />
        ))}

        {readOnly ? null : drafts.map((draft, index) => {
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
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="font-display text-2xl font-bold uppercase leading-none">
                  Park {detail.locations.length + index + 1}
                </p>
                {detail.locations.length + index + 1 === 2 && index < requiredSlots ? (
                  <p className="text-sm font-semibold text-[#c9a227]">
                    Second park required for {detail.approvedCount} teams
                  </p>
                ) : detail.locations.length + index + 1 === 2 && required < 2 ? (
                  <p className="text-sm font-semibold text-muted">
                    {detail.approvedCount} {detail.approvedCount === 1 ? "team does" : "teams do"} not require a second park
                  </p>
                ) : null}
              </div>
              {options.length > 0 && !draft.scratch ? (
                <div className="space-y-1.5">
                  <Label htmlFor={`saved-${draft.key}`}>Previously added parks</Label>
                  <select
                    id={`saved-${draft.key}`}
                    value=""
                    disabled={pending}
                    onChange={(event) => addKnown(draft, event.target.value)}
                    className="h-12 w-full rounded-md border border-line bg-surface px-3 text-base text-fg"
                  >
                    <option value="">{pending ? "Adding…" : "Choose a saved park"}</option>
                    {options.map((park) => (
                      <option key={park.id} value={park.id}>
                        {park.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted">Picking one adds it. Change a saved park in Resources.</p>
                </div>
              ) : null}
              {knownQuery.isError ? (
                <p className="text-xs text-muted">Saved parks could not be loaded. You can still type a new one.</p>
              ) : null}
              {options.length > 0 && !draft.scratch ? (
                <Button type="button" variant="outline" className="w-full" onClick={() => updateDraft(draft.key, { scratch: true })}>
                  Add a new park
                </Button>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor={`name-${draft.key}`}>Name</Label>
                    <Input
                      id={`name-${draft.key}`}
                      value={draft.name}
                      onChange={(event) => updateDraft(draft.key, { name: event.target.value })}
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
                      onChange={(event) => updateDraft(draft.key, { address: event.target.value })}
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
                </>
              )}
              {errorKey === draft.key && saveError ? (
                <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
                  {saveError}
                </p>
              ) : null}
              {draft.scratch || options.length === 0 ? (
                <div className="flex gap-2">
                  {options.length > 0 ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      disabled={pending}
                      onClick={() => updateDraft(draft.key, { scratch: false, name: "", address: "" })}
                    >
                      Saved parks
                    </Button>
                  ) : index >= requiredSlots ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      disabled={pending}
                      onClick={() => {
                        setDrafts((current) => current.filter((row) => row.key !== draft.key));
                        setExtra((count) => Math.max(0, count - 1));
                        if (errorKey === draft.key) {
                          setErrorKey(null);
                          setErrorText(null);
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  ) : null}
                  <Button type="submit" className="flex-1" disabled={pending}>
                    {pending ? "Adding…" : "Save park"}
                  </Button>
                </div>
              ) : index >= requiredSlots ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-muted"
                  disabled={pending}
                  onClick={() => {
                    setDrafts((current) => current.filter((row) => row.key !== draft.key));
                    setExtra((count) => Math.max(0, count - 1));
                  }}
                >
                  Cancel
                </Button>
              ) : null}
            </form>
          );
        })}
      </div>
      {dropPark ? (
        <ConfirmDialog
          text={`Remove ${dropPark.name}? The pool and bracket go back to the default build on the parks that are left. Hand moves on this sheet are wiped.`}
          onNo={() => setDropPark(null)}
          onYes={() => {
            removeParkMut.mutate(dropPark.id);
            setDropPark(null);
          }}
        />
      ) : null}
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
  known,
  readOnly,
  busyPrimary,
  busyRemove,
  removable,
  parkNeed,
  onPrimary,
  onRemove,
  onSaved,
}: {
  location: WeekendLocation;
  index: number;
  known: KnownPark[];
  readOnly?: boolean;
  busyPrimary: boolean;
  busyRemove: boolean;
  removable: boolean;
  parkNeed: number;
  onPrimary: () => void;
  onRemove: () => void;
  onSaved: (next: WeekendDetail) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [name, setName] = useState(location.name);
  const [address, setAddress] = useState(location.address);
  const [pickedId, setPickedId] = useState("");
  const [flags, setFlags] = useState<ParkFlags>(() => flagsFrom(location));
  const [formError, setFormError] = useState<string | null>(null);
  const saveMut = useMutation({
    mutationFn: (input: { saveToResource: boolean; knownParkId: number | null }) =>
      updateWeekendLocation({
        data: { id: location.id, name, address, saveToResource: input.saveToResource, knownParkId: input.knownParkId, ...flags },
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

  function applyKnown(parkId: string) {
    setPickedId(parkId);
    setShowDetails(false);
    const park = known.find((row) => String(row.id) === parkId);
    if (!park) return;
    setName(park.name);
    setAddress(park.address);
    setFlags({
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
    });
  }

  function openEditor() {
    const match = known.find((park) => parkKey(park.name, park.address) === parkKey(location.name, location.address));
    setName(location.name);
    setAddress(location.address);
    setFlags(flagsFrom(location));
    setPickedId(match ? String(match.id) : "");
    setShowDetails(match == null);
    setFormError(null);
    setEditing(true);
  }

  const picked = known.find((park) => String(park.id) === pickedId) ?? null;
  const pickChanged =
    picked != null && parkKey(picked.name, picked.address) !== parkKey(location.name, location.address);

  function save(saveToResource: boolean) {
    setFormError(null);
    try {
      const parsed = parseLocationInput({ weekendId: 1, name, address });
      setName(parsed.name);
      setAddress(parsed.address);
      const chosen = known.find((park) => String(park.id) === pickedId);
      const same =
        chosen != null &&
        chosen.name.trim().toLowerCase() === parsed.name.toLowerCase() &&
        chosen.address.trim().toLowerCase() === parsed.address.toLowerCase();
      saveMut.mutate({ saveToResource, knownParkId: same ? chosen.id : null });
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
            <Label htmlFor={`edit-saved-${location.id}`}>Previously added parks</Label>
            <select
              id={`edit-saved-${location.id}`}
              value={pickedId}
              onChange={(event) => applyKnown(event.target.value)}
              className="h-12 w-full rounded-md border border-line bg-surface px-3 text-base text-fg"
            >
              <option value="">{known.length === 0 ? "No saved parks yet" : "Choose a saved park"}</option>
              {known.map((park) => (
                <option key={park.id} value={park.id}>
                  {park.name}
                </option>
              ))}
            </select>
          </div>
          {picked && !showDetails ? (
            <>
              <p className="text-sm text-muted">{picked.address}</p>
              <Button type="button" variant="outline" className="w-full" onClick={() => setShowDetails(true)}>
                Edit
              </Button>
              {pickChanged ? (
                <Button type="button" className="w-full" disabled={saveMut.isPending} onClick={() => save(false)}>
                  {saveMut.isPending ? "Saving…" : "Use this park"}
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                className="w-full text-muted"
                onClick={() => {
                  setPickedId("");
                  setName("");
                  setAddress("");
                  setFlags(emptyParkFlags());
                  setShowDetails(true);
                }}
              >
                Add a new park
              </Button>
            </>
          ) : (
            <>
          <div className="space-y-1.5">
            <Label htmlFor={`edit-name-${location.id}`}>Name</Label>
            <Input id={`edit-name-${location.id}`} value={name} onChange={(event) => { setName(event.target.value); setPickedId(""); }} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`edit-address-${location.id}`}>Address</Label>
            <Input
              id={`edit-address-${location.id}`}
              value={address}
              onChange={(event) => { setAddress(event.target.value); setPickedId(""); }}
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
          {picked ? (
            <Button type="button" variant="ghost" className="w-full text-muted" onClick={() => setShowDetails(false)}>
              Hide details
            </Button>
          ) : known.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted"
              onClick={() => {
                const match = known.find((park) => parkKey(park.name, park.address) === parkKey(location.name, location.address));
                if (!match) {
                  setEditing(false);
                  return;
                }
                applyKnown(String(match.id));
              }}
            >
              Saved parks
            </Button>
          ) : null}
            </>
          )}
          {errorText && picked && !showDetails ? (
            <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
              {errorText}
            </p>
          ) : null}
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
            {readOnly ? (
              location.isPrimary ? <p className="text-sm font-semibold">Primary park</p> : null
            ) : (
              <>
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
            <Button type="button" variant="outline" onClick={openEditor}>
              Edit
            </Button>
            {removable ? (
            <Button variant="ghost" className="px-0 text-muted" disabled={busyRemove} onClick={onRemove}>
              Remove
            </Button>
            ) : (
            <p className="text-sm text-muted">
              {parkNeed > 1
                ? "Required. 8 or more teams need 2 parks, so this one stays."
                : "Required. 7 or fewer teams need 1 park, so this one stays."}
            </p>
            )}
              </>
            )}
          </div>
        </>
      )}
    </article>
  );
}
