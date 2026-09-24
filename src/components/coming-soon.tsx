import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function HomeAction({
  title,
  hint,
  muted,
  children,
}: {
  title: string;
  hint: string;
  muted?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "site-card flex w-full flex-col items-start gap-1 text-left",
        muted ? "opacity-70" : "transition-colors duration-150 hover:border-primary",
      )}
    >
      <span className="font-display text-2xl font-bold uppercase leading-none">{title}</span>
      <span className="text-sm text-muted">{hint}</span>
      {children}
    </div>
  );
}
