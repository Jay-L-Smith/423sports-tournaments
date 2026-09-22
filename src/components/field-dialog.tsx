import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WeekendLocation } from "@/lib/pbi/api";
import { parseLocationInput } from "@/lib/pbi/weekends";

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
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-scrim p-4 sm:items-center">
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
            parks.map((park) => (
              <button
                key={park.id}
                type="button"
                disabled={busy}
                onClick={() => onPick(park.id)}
                className={
                  park.id === currentId
                    ? "w-full rounded-md border border-primary bg-primary/15 px-4 py-3 text-left"
                    : "w-full rounded-md border border-line bg-surface px-4 py-3 text-left hover:border-fg/40"
                }
              >
                <p className="font-display text-xl font-bold uppercase leading-none">{park.name}</p>
                <p className="mt-2 text-sm text-muted">{park.address}</p>
              </button>
            ))
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
          <Button type="button" variant="outline" className="mt-4 w-full" onClick={() => setAdding(true)}>
            Add field
          </Button>
        )}

        {error ? (
          <p className="mt-3 rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
