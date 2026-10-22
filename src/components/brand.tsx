import { cn } from "@/lib/utils";

export const APP_NAME = "423Sports Tournaments";

export function BrandMark({ className = "h-14 w-auto" }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="423Sports"
      className={cn("object-contain", className)}
    />
  );
}

export function CrossedBats({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" className={cn("text-[#b7c3c8]", className)} aria-hidden="true">
      <circle cx="100" cy="28" r="14" fill="currentColor" />
      <path
        d="M28 118 L132 22"
        stroke="currentColor"
        strokeWidth="16"
        strokeLinecap="round"
      />
      <path
        d="M172 118 L68 22"
        stroke="currentColor"
        strokeWidth="16"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BrandLockup({
  subtitle,
  compact,
}: {
  subtitle?: string;
  compact?: boolean;
}) {
  return (
    <div className="min-w-0">
    <div className="inline-flex max-w-full rounded-md bg-[#111111] px-3 py-2">
      <BrandMark className={compact ? "h-12 w-auto" : "mx-auto block h-auto w-full max-w-sm"} />
    </div>
      {subtitle ? (
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{subtitle}</p>
      ) : null}
    </div>
  );
}
