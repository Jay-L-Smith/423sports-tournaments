import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { ParkOptions, ParkSaveChoice } from "@/components/park-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateWeekendLocation, type WeekendLocation } from "@/lib/pbi/api";
import { parseLocationInput, type ParkFlags } from "@/lib/pbi/weekends";

export function FieldDialog({
  parks,
  currentId,
  onPick,
  onAdd,
  onClose,
  busy,
  error,
}: {
  parks: WeekendLocation[];
  currentId: number | null;
  onPick: (locationId: number | null) => void;
  onAdd: (input: { name: string; address: string }) => void;
  onClose: () => void;
  busy: boolean;
  error: string | null;
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [flags, setFlags] = useState<ParkFlags | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const editMut = useMutation({
    mutationFn: (saveToResource: boolean) => {
      if (editingId == null || !flags) throw new Error("Pick a park to edit.");
      return updateWeekendLocation({
        data: { id: editingId, name, address, saveToResource, ...flags },
      });
    },
    onSuccess: (next) => {
      setFormError(null);
      setEditingId(null);
      queryClient.setQueryData(["weekend", next.id], next);
      void queryClient.invalidateQueries({ queryKey: ["schedule", next.id] });
      void queryClient.invalidateQueries({ queryKey: ["known-parks"] });
      void queryClient.invalidateQueries({ queryKey: ["weekends"] });
    },
  });

  function startEdit(park: WeekendLocation) {
    setAdding(false);
    setFormError(null);
    setEditingId(park.id);
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

  function saveEdit(saveToResource: boolean) {
    setFormError(null);
    try {
      parseLocationInput({ weekendId: 1, name, address });
      editMut.mutate(saveToResource);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Check the park and try again.");
    }
  }
  function submitAdd(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    try {
      const parsed = parseLocationInput({ weekendId: 1, name, address });
      onAdd({ name: parsed.name, address: parsed.address });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Check the park and try again.");
    }
  }

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-scrim p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="field-dialog-title"
        className="w-full max-w-md rounded-lg border border-line bg-bg p-4 text-fg shadow-lg"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="field-dialog-title" className="font-display text-2xl font-bold uppercase">
            Field
          </h2>
          <Button type="button" variant="ghost" className="px-2 text-muted" onClick={onClose}>
            Close
          </Button>
        </div>
        <p className="mt-1 text-sm text-muted">Suggested for you. Confirm it or pick another park.</p>

        <div className="mt-4 space-y-2">
          {parks.length === 0 ? (
            <p className="rounded-md bg-warn-bg px-3 py-2 text-sm">No parks yet. Add one below.</p>
          ) : (
            parks.map((park) =>
              editingId === park.id && flags ? (
                <div key={park.id} className="space-y-3 rounded-md border border-line bg-surface p-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`game-park-name-${park.id}`}>Name</Label>
                    <Input id={`game-park-name-${park.id}`} value={name} onChange={(event) => setName(event.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`game-park-address-${park.id}`}>Address</Label>
                    <Input
                      id={`game-park-address-${park.id}`}
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                    />
                  </div>
                  <ParkOptions idPrefix={`game-${park.id}`} flags={flags} onChange={setFlags} />
                  <ParkSaveChoice
                    busy={editMut.isPending}
                    onTournamentOnly={() => saveEdit(false)}
                    onUpdateResource={() => saveEdit(true)}
                  />
                  <Button type="button" variant="ghost" className="w-full text-muted" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div key={park.id} className="flex items-stretch gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onPick(park.id)}
                    className={
                      park.id === currentId
                        ? "min-w-0 flex-1 rounded-md border border-primary bg-primary/15 px-4 py-3 text-left"
                        : "min-w-0 flex-1 rounded-md border border-line bg-surface px-4 py-3 text-left hover:border-fg/40"
                    }
                  >
                    <p className="font-display text-xl font-bold uppercase leading-none">{park.name}</p>
                    <p className="mt-2 text-sm text-muted">{park.address}</p>
                  </button>
                  <Button type="button" variant="outline" className="shrink-0" onClick={() => startEdit(park)}>
                    Edit
                  </Button>
                </div>
              ),
            )
          )}
        </div>

        {adding ? (
          <form noValidate onSubmit={submitAdd} className="mt-4 space-y-3 rounded-md border border-line bg-surface p-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-park-name">Name</Label>
              <Input
                id="new-park-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="McMinn County HS"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-park-address">Address</Label>
              <Input
                id="new-park-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="2215 Congress Parkway, Athens, TN"
              />
            </div>
            {formError ? (
              <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
                {formError}
              </p>
            ) : null}
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? "Saving…" : "Add field"}
            </Button>
          </form>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="mt-4 w-full"
            onClick={() => {
              setEditingId(null);
              setName("");
              setAddress("");
              setFormError(null);
              setAdding(true);
            }}
          >
            Add field
          </Button>
        )}

        {formError || editMut.error || error ? (
          <p className="mt-3 rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
            {formError ??
              (editMut.error instanceof Error
                ? editMut.error.message
                : error ?? "Could not save that park.")}
          </p>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
