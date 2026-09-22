import { cn } from "@/lib/utils";

export const APP_NAME = "423Sports Tournaments";

export function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect width="48" height="48" rx="8" fill="#070000" />
      <rect x="1.5" y="1.5" width="45" height="45" rx="7" fill="none" stroke="#EEB82F" strokeWidth="2" />
      <path
        d="M24 8 L38 22 L24 40 L10 22 Z"
        fill="none"
        stroke="#F7F2F2"
        strokeWidth="1.8"
      />
      <text
        x="24"
        y="26.5"
        textAnchor="middle"
        fill="#EEB82F"
        fontFamily="Oswald, Arial Narrow, sans-serif"
        fontSize="11"
        fontWeight="700"
        letterSpacing="0.5"
      >
        423
      </text>
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
    <div className="flex items-center gap-3">
      <BrandMark className={compact ? "h-9 w-9" : "h-10 w-10"} />
      <div className="min-w-0">
        <p
          className={cn(
            "font-display font-bold uppercase leading-none tracking-wide text-fg",
            compact ? "text-xl" : "text-2xl",
          )}
        >
          423Sports
        </p>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
          {subtitle ?? "Tournaments"}
        </p>
      </div>
    </div>
  );
}
