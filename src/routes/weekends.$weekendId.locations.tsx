import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { WeekendAdminFrame } from "@/components/weekend-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addWeekendLocation, removeWeekendLocation, type WeekendDetail } from "@/lib/pbi/api";
import { parseLocationInput } from "@/lib/pbi/weekends";

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
  const [parkName, setParkName] = useState("");
  const [parkAddress, setParkAddress] = useState("");
  const [parkError, setParkError] = useState<string | null>(null);

  const addParkMut = useMutation({
    mutationFn: (input: ReturnType<typeof parseLocationInput>) => addWeekendLocation({ data: input }),
    onSuccess: (next) => {
      setParkName("");
      setParkAddress("");
      setParkError(null);
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

  function addPark(event: FormEvent) {
    event.preventDefault();
    setParkError(null);
    try {
      addParkMut.mutate(parseLocationInput({ weekendId: id, name: parkName, address: parkAddress }));
    } catch (err) {
      setParkError(err instanceof Error ? err.message : "Check the park and try again.");
    }
  }

  const parkErrorText =
    parkError ??
    (addParkMut.error instanceof Error ? addParkMut.error.message : addParkMut.error ? "Could not add that park." : null);

  return (
    <>
      <h1 className="mt-3 font-display text-4xl font-bold uppercase">Locations</h1>
      <p className="mt-1 text-sm text-muted">Every complex this weekend uses. Fields get suggested from this list.</p>

      <div className="mt-6 space-y-3">
        {detail.locations.length === 0 ? (
          <p className="rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted">
            No parks yet. Add every complex this weekend uses.
          </p>
        ) : (
          detail.locations.map((location) => (
            <article key={location.id} className="rounded-lg border border-line bg-surface px-4 py-4">
              <h2 className="font-display text-2xl font-bold uppercase leading-none">{location.name}</h2>
              <p className="mt-2 text-sm">{location.address}</p>
              <Button
                variant="ghost"
                className="mt-2 px-0 text-muted"
                disabled={removeParkMut.isPending}
                onClick={() => removeParkMut.mutate(location.id)}
              >
                Remove
              </Button>
            </article>
          ))
        )}

        <form onSubmit={addPark} className="space-y-3 rounded-lg border border-line bg-surface p-4">
          <p className="font-semibold">Add a complex</p>
          <div className="space-y-1.5">
            <Label htmlFor="park-name">Name</Label>
            <Input
              id="park-name"
              value={parkName}
              onChange={(e) => setParkName(e.target.value)}
              placeholder="McMinn County HS"
              autoComplete="off"
              maxLength={80}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="park-address">Address</Label>
            <Input
              id="park-address"
              value={parkAddress}
              onChange={(e) => setParkAddress(e.target.value)}
              placeholder="2215 Congress Parkway, Athens, TN"
              autoComplete="street-address"
              maxLength={160}
            />
          </div>
          {parkErrorText ? (
            <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
              {parkErrorText}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={addParkMut.isPending}>
            {addParkMut.isPending ? "Adding…" : "Add location"}
          </Button>
        </form>
      </div>
    </>
  );
}
