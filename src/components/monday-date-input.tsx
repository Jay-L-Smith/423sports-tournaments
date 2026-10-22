import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { isoDateFromLocal, formatWeekdayLong } from "@/lib/pbi/weekends";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function parseIso(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatUs(iso: string) {
  const dt = parseIso(iso);
  if (!dt) return "";
  return dt.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

function monthCells(year: number, month: number) {
  const first = new Date(year, month - 1, 1);
  const pad = first.getDay();
  const count = new Date(year, month, 0).getDate();
  const cells: { iso: string; inMonth: boolean }[] = [];
  for (let i = 0; i < pad; i += 1) {
    cells.push({ iso: isoDateFromLocal(new Date(year, month - 1, 1 - (pad - i))), inMonth: false });
  }
  for (let day = 1; day <= count; day += 1) {
    cells.push({ iso: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`, inMonth: true });
  }
  const last = parseIso(cells[cells.length - 1]?.iso ?? "");
  while (cells.length < 42 && last) {
    last.setDate(last.getDate() + 1);
    cells.push({ iso: isoDateFromLocal(last), inMonth: false });
  }
  return cells;
}

export function MondayDateInput({
  id,
  value,
  min,
  onChange,
  className,
  withWeekday = false,
  birthday = false,
}: {
  id?: string;
  value: string;
  min?: string;
  onChange: (value: string) => void;
  className?: string;
  withWeekday?: boolean;
  birthday?: boolean;
}) {
  const autoId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null);
  const today = new Date();
  const todayIso = isoDateFromLocal(today);
  const fallback = birthday ? new Date(today.getFullYear() - 14, today.getMonth(), 1) : today;
  const initial = parseIso(value) ?? fallback;
  const [cursor, setCursor] = useState({ year: initial.getFullYear(), month: initial.getMonth() + 1 });

  function place() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const margin = 12;
    const width = Math.min(Math.max(rect.width, 280), window.innerWidth - margin * 2);
    let left = rect.left + width > window.innerWidth - margin ? rect.right - width : rect.left;
    left = Math.max(margin, Math.min(left, window.innerWidth - margin - width));
    setBox({ top: rect.bottom + 4, left, width });
  }

  function toggle() {
    const next = !open;
    if (next) {
      const shown = parseIso(value) ?? (birthday ? new Date(new Date().getFullYear() - 14, new Date().getMonth(), 1) : new Date());
      setCursor({ year: shown.getFullYear(), month: shown.getMonth() + 1 });
      place();
    }
    setOpen(next);
  }

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || popRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  const cells = monthCells(cursor.year, cursor.month);
  const title = new Date(cursor.year, cursor.month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const thisYear = new Date().getFullYear();
  const years = birthday
    ? Array.from({ length: thisYear - 2005 + 1 }, (_, index) => thisYear - index)
    : [];

  function shift(delta: number) {
    const dt = new Date(cursor.year, cursor.month - 1 + delta, 1);
    setCursor({ year: dt.getFullYear(), month: dt.getMonth() + 1 });
  }

  const pop =
    open && box && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={popRef}
            role="dialog"
            aria-label={title}
            className="fixed z-[90] rounded-lg border border-line bg-bg p-3 text-fg shadow-lg"
            style={{ top: box.top, left: box.left, width: box.width }}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <button type="button" aria-label="Previous month" onClick={() => shift(-1)} className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-line">
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              {birthday ? (
                <div className="flex min-w-0 flex-1 gap-1">
                  <select
                    aria-label="Month"
                    value={cursor.month}
                    onChange={(event) => setCursor((current) => ({ ...current, month: Number(event.target.value) }))}
                    className="h-11 min-w-0 flex-1 rounded-md border border-line bg-bg px-1 text-sm font-semibold"
                  >
                    {monthNames.map((name, index) => (
                      <option key={name} value={index + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Year"
                    value={cursor.year}
                    onChange={(event) => setCursor((current) => ({ ...current, year: Number(event.target.value) }))}
                    className="h-11 w-[5.5rem] rounded-md border border-line bg-bg px-1 text-sm font-semibold"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-sm font-semibold">{title}</p>
              )}
              <button type="button" aria-label="Next month" onClick={() => shift(1)} className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-line">
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold uppercase text-muted">
              {WEEKDAYS.map((label, index) => (
                <span key={`${label}-${index}`}>{label}</span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {cells.map((cell) => {
                const disabled = Boolean((min && cell.iso < min) || (birthday && cell.iso > todayIso));
                const selected = cell.iso === value;
                return (
                  <button
                    key={cell.iso}
                    type="button"
                    disabled={disabled}
                    aria-pressed={selected}
                    onClick={() => {
                      onChange(cell.iso);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex h-9 items-center justify-center rounded-md text-sm font-semibold",
                      disabled && "cursor-not-allowed opacity-30",
                      selected ? "bg-pine text-pine-fg" : cell.inMonth ? "bg-surface text-fg" : "text-muted",
                    )}
                  >
                    {Number(cell.iso.slice(8, 10))}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={buttonRef}
        id={id ?? autoId}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
        className={cn(
          "flex w-full flex-col justify-center rounded-md border border-line bg-surface px-3 text-left text-base text-fg",
          withWeekday ? "min-h-14 py-1.5" : "h-12",
          !value && "text-muted",
          className,
        )}
      >
        {value && withWeekday ? (
          <>
            <span className="leading-tight">{formatUs(value)}</span>
            <span className="text-xs font-semibold leading-tight text-muted">{formatWeekdayLong(value)}</span>
          </>
        ) : (
          value ? formatUs(value) : birthday ? "Birthday" : "Select a date"
        )}
      </button>
      {pop}
    </>
  );
}
