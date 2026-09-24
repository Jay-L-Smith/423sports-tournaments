import { Button } from "@/components/ui/button";
import { settle, type SizeChoice } from "@/lib/pbi/weekend-size-choice";
import { breaksClock, sizeOptions, type SizeOption } from "@/lib/pbi/weekend-plan";
import { cn } from "@/lib/utils";

function optionTitle(option: SizeOption): string {
  const divisions = option.divisions === 1 ? "1 division" : `${option.divisions} divisions`;
  return `${option.fields} fields, ${divisions}`;
}

function optionDetail(option: SizeOption, rain: boolean): string {
  const label = option.divisions === 1 ? "One division" : `${option.divisions} divisions`;
  if (!breaksClock(option, rain)) {
    return rain
      ? `${label} on the normal clock. Sunday plans through 4:00, and 6:00 stays open for rain.`
      : `${label}. Sunday’s last start is 6:00.`;
  }
  if (option.sunday === "6:00") {
    return option.divisions === 1
      ? "Keeps one division on these fields. Sunday has to start at 6:00."
      : "Keeps this field count. Sunday has to start at 6:00.";
  }
  return option.divisions === 1
    ? "Keeps one division on these fields. Sunday has to start at 8:00."
    : "Keeps this field count. Sunday has to start at 8:00.";
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold">{label}</p>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" className="h-11 w-11 px-0" disabled={value <= min} onClick={() => onChange(value - 1)}>
          −
        </Button>
        <span className="min-w-10 text-center font-display text-3xl font-bold leading-none">{value}</span>
        <Button type="button" variant="outline" className="h-11 w-11 px-0" disabled={value >= max} onClick={() => onChange(value + 1)}>
          +
        </Button>
      </div>
    </div>
  );
}

export function WeekendSize({
  value,
  onChange,
}: {
  value: SizeChoice;
  onChange: (next: SizeChoice) => void;
}) {
  const options = sizeOptions(value.teams, value.days, value.rain);
  const used =
    options.find((option) => option.divisions === value.divisions && option.sunday === value.sunday) ??
    options.find((option) => option.divisions === value.divisions) ??
    options[0];
  const fits = options.some((option) => option.fields <= value.fields);
  const sundayLine = !fits
    ? "Doesn’t fit, even with a Sunday 8:00 start."
    : breaksClock({ divisions: value.divisions, fields: value.fields, sunday: value.sunday }, value.rain)
      ? `Sunday starts at ${value.sunday}.`
      : value.rain
        ? "Sunday plans through 4:00."
        : "Sunday’s last start is 6:00.";

  function pick(option: SizeOption) {
    onChange({
      ...value,
      fields: option.fields,
      divisions: option.divisions,
      sunday: option.sunday,
      driver: "teams",
    });
  }

  return (
    <section className="space-y-4 rounded-lg border border-line bg-bg p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Rain delay</p>
          <p className="text-xs text-muted">
            {value.rain ? "Holds Sunday 6:00 unless a choice below uses it." : "Sunday can start at 6:00. 8:00 is a choice."}
          </p>
        </div>
        <button
          type="button"
          aria-pressed={value.rain}
          onClick={() => onChange(settle(value, { rain: !value.rain }))}
          className={cn(
            "min-h-11 rounded-md border px-4 text-sm font-semibold",
            value.rain ? "border-pine bg-pine text-pine-fg" : "border-line bg-bg text-fg",
          )}
        >
          {value.rain ? "On" : "Off"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {([2, 3] as const).map((days) => (
          <button
            key={days}
            type="button"
            aria-pressed={value.days === days}
            onClick={() => onChange(settle(value, { days }))}
            className={cn(
              "min-h-11 rounded-md border text-sm font-semibold",
              value.days === days ? "border-pine bg-pine text-pine-fg" : "border-line bg-bg text-fg",
            )}
          >
            {days} days
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stepper
          label="Teams"
          value={value.teams}
          min={3}
          max={40}
          onChange={(teams) => onChange(settle(value, { teams, driver: "teams" }))}
        />
        <Stepper
          label="Fields"
          value={value.fields}
          min={1}
          max={12}
          onChange={(fields) => onChange(settle(value, { fields, driver: "fields" }))}
        />
      </div>

      <p className="text-sm">
        {value.divisions === 1 ? "1 division." : `${value.divisions} divisions.`}
        {used && used.fields < value.fields ? ` Uses ${used.fields} of ${value.fields} fields.` : ""} {sundayLine}
      </p>
      {!fits ? (
        <p className="text-sm text-muted">
          {value.teams} teams don’t fit on {value.fields} fields, even with a Sunday 8:00 start.
        </p>
      ) : null}

      {options.length > 1 ? (
        <div className="space-y-2">
          {options.map((option) => {
            const on =
              option.divisions === value.divisions &&
              option.sunday === value.sunday &&
              option.fields === (used?.fields ?? value.fields);
            return (
              <button
                key={`${option.divisions}-${option.fields}-${option.sunday}`}
                type="button"
                aria-pressed={on}
                onClick={() => pick(option)}
                className={cn(
                  "block w-full rounded-md border px-3 py-2.5 text-left",
                  on ? "border-pine bg-pine text-pine-fg" : "border-line bg-surface text-fg",
                )}
              >
                <p className="text-sm font-semibold">{optionTitle(option)}</p>
                <p className={cn("mt-1 text-xs font-normal leading-snug", on ? "opacity-80" : "text-muted")}>
                  {optionDetail(option, value.rain)}
                </p>
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
