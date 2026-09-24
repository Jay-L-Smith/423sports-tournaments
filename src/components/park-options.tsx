import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AGE_GROUPS, PARK_AMENITIES, type AgeGroup, type ParkAmenityKey, type ParkFlags } from "@/lib/pbi/weekends";

export function parkFeeLine(flags: ParkFlags): string {
  if (!flags.entranceFee) return "";
  const price = flags.entrancePrice ? `$${flags.entrancePrice}` : "Entrance fee";
  if (!flags.ageDiscount) return price === "Entrance fee" ? price : `Gate ${price}`;
  const ages = flags.discountAges.join(", ");
  const discount = flags.discountPrice ? `$${flags.discountPrice}` : "discount";
  return ages ? `Gate ${price} · ${ages} ${discount}` : `Gate ${price} · age discount ${discount}`;
}

export function parkSummary(flags: ParkFlags): string {
  const on = PARK_AMENITIES.filter(([key]) => flags[key]).map(([, label]) => label);
  return [parkFeeLine(flags), ...on].filter(Boolean).join(" · ");
}

export function ParkOptions({
  idPrefix,
  flags,
  onChange,
}: {
  idPrefix: string;
  flags: ParkFlags;
  onChange: (flags: ParkFlags) => void;
}) {
  function toggleAmenity(key: ParkAmenityKey) {
    onChange({ ...flags, [key]: !flags[key] });
  }
  function toggleAge(age: AgeGroup) {
    const discountAges = flags.discountAges.includes(age)
      ? flags.discountAges.filter((row) => row !== age)
      : [...flags.discountAges, age];
    onChange({ ...flags, discountAges });
  }
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">At this park</p>
      <div className="grid grid-cols-2 gap-2">
        {PARK_AMENITIES.map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={flags[key]}
            onClick={() => toggleAmenity(key)}
            className={
              flags[key]
                ? "h-11 rounded-md bg-primary px-2 text-sm font-bold text-primary-fg"
                : "h-11 rounded-md border border-line bg-bg px-2 text-sm font-semibold"
            }
          >
            {label}
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-pressed={flags.entranceFee}
        onClick={() => onChange({ ...flags, entranceFee: !flags.entranceFee })}
        className={
          flags.entranceFee
            ? "flex h-11 w-full items-center justify-between rounded-md bg-primary px-3 text-sm font-bold text-primary-fg"
            : "flex h-11 w-full items-center justify-between rounded-md border border-line bg-bg px-3 text-sm font-semibold"
        }
      >
        <span>Entrance fee</span>
        <span className="text-xs font-bold uppercase">{flags.entranceFee ? "Yes" : "No"}</span>
      </button>
      {flags.entranceFee ? (
        <div className="space-y-2 rounded-md border border-line bg-bg p-3">
          <div className="space-y-1">
            <Label htmlFor={`gate-${idPrefix}`}>Gate price</Label>
            <Input
              id={`gate-${idPrefix}`}
              inputMode="decimal"
              value={flags.entrancePrice}
              onChange={(event) => onChange({ ...flags, entrancePrice: event.target.value })}
              placeholder="8"
              maxLength={6}
            />
          </div>
          <button
            type="button"
            aria-pressed={flags.ageDiscount}
            onClick={() => onChange({ ...flags, ageDiscount: !flags.ageDiscount })}
            className={
              flags.ageDiscount
                ? "flex h-11 w-full items-center justify-between rounded-md bg-primary px-3 text-sm font-bold text-primary-fg"
                : "flex h-11 w-full items-center justify-between rounded-md border border-line bg-surface px-3 text-sm font-semibold"
            }
          >
            <span>Discount for certain ages</span>
            <span className="text-xs font-bold uppercase">{flags.ageDiscount ? "Yes" : "No"}</span>
          </button>
          {flags.ageDiscount ? (
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-1.5">
                {AGE_GROUPS.map((age) => {
                  const on = flags.discountAges.includes(age);
                  return (
                    <button
                      key={age}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleAge(age)}
                      className={
                        on
                          ? "h-9 rounded-md bg-primary text-xs font-bold text-primary-fg"
                          : "h-9 rounded-md border border-line bg-surface text-xs font-semibold"
                      }
                    >
                      {age}
                    </button>
                  );
                })}
              </div>
              <div className="space-y-1">
                <Label htmlFor={`discount-${idPrefix}`}>Those ages pay</Label>
                <Input
                  id={`discount-${idPrefix}`}
                  inputMode="decimal"
                  value={flags.discountPrice}
                  onChange={(event) => onChange({ ...flags, discountPrice: event.target.value })}
                  placeholder="5"
                  maxLength={6}
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function ParkSaveChoice({
  busy,
  onTournamentOnly,
  onUpdateResource,
}: {
  busy: boolean;
  onTournamentOnly: () => void;
  onUpdateResource: () => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted">Save these details for this tournament only, or update the saved park too?</p>
      <Button type="button" className="w-full" disabled={busy} onClick={onTournamentOnly}>
        This tournament only
      </Button>
      <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={onUpdateResource}>
        Update the saved park
      </Button>
    </div>
  );
}
