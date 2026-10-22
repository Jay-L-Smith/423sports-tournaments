import { ROLE_COPY, type Role } from "@/lib/pbi/roles";
import { ChevronRight, ClipboardCheck, Shield, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<Role, typeof User> = {
  parent: Users,
  athlete: User,
  coach: ClipboardCheck,
  admin: Shield,
};

export function RolePicker({
  onPick,
  title = "What is your role?",
  subtitle = "Pick one. You can sign in after.",
  appearance = "plain",
  blurbs,
}: {
  onPick: (role: Role) => void;
  title?: string;
  subtitle?: string;
  appearance?: "plain" | "splash";
  blurbs?: Partial<Record<Role, string>>;
}) {
  const roles: Role[] = ["coach", "admin"];
  const splash = appearance === "splash";
  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      <div className="space-y-2">
        <h1 className={splash ? "text-3xl font-bold leading-tight tracking-tight text-white" : "font-display text-4xl font-bold uppercase tracking-wide"}>
          {title}
        </h1>
        {subtitle ? <p className={splash ? "text-sm text-white/60" : "text-muted"}>{subtitle}</p> : null}
      </div>
      <div className="grid gap-3">
        {roles.map((role) => {
          const Icon = ICONS[role];
          const copy = ROLE_COPY[role];
          const blurb = blurbs?.[role] ?? copy.blurb;
          if (!splash) {
            return (
              <button
                key={role}
                type="button"
                onClick={() => onPick(role)}
                className="flex min-h-16 items-center gap-4 rounded-lg border border-line bg-surface px-4 py-4 text-left transition-colors duration-150 hover:border-primary hover:bg-primary/5"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md border-2 border-primary bg-bg text-primary">
                  <Icon className="h-6 w-6" strokeWidth={2} />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-2xl font-bold uppercase leading-none">{copy.label}</span>
                  <span className="mt-1 block text-sm text-muted">{blurb}</span>
                </span>
              </button>
            );
          }
          return (
            <button
              key={role}
              type="button"
              onClick={() => onPick(role)}
              className={cn(
                "flex items-center gap-4 rounded-2xl border px-4 py-4 text-left",
                role === "coach"
                  ? "border-white/80 bg-white text-[#1a1a1a]"
                  : "border-white/15 bg-white/5 text-white",
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block font-display text-2xl font-bold uppercase leading-none">{copy.label}</span>
                <span className={cn("mt-2 block text-sm leading-snug", role === "coach" ? "text-[#3a3a3a]" : "text-white/70")}>
                  {blurb}
                </span>
              </span>
              <ChevronRight className={cn("h-5 w-5 shrink-0", role === "coach" ? "text-[#1a1a1a]" : "text-white/50")} aria-hidden />
            </button>
          );
        })}
      </div>
    </div>
  );
}