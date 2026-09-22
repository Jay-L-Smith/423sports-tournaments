import { ROLE_COPY, type Role } from "@/lib/pbi/roles";
import { ClipboardCheck, Shield, User, Users } from "lucide-react";
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
}: {
  onPick: (role: Role) => void;
  title?: string;
  subtitle?: string;
}) {
  const roles: Role[] = ["parent", "athlete", "coach", "admin"];
  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      <div className="space-y-1">
        <h1 className="font-display text-4xl font-bold uppercase tracking-wide">{title}</h1>
        <p className="text-muted">{subtitle}</p>
      </div>
      <div className="grid gap-3">
        {roles.map((role) => {
          const Icon = ICONS[role];
          const copy = ROLE_COPY[role];
          return (
            <button
              key={role}
              type="button"
              onClick={() => onPick(role)}
              className={cn(
                "flex min-h-16 items-center gap-4 rounded-lg border border-line bg-surface px-4 py-4 text-left",
                "transition-colors duration-150 hover:border-primary hover:bg-primary/5",
              )}
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md border-2 border-primary bg-bg text-primary">
                <Icon className="h-6 w-6" strokeWidth={2} />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-2xl font-bold uppercase leading-none">
                  {copy.label}
                </span>
                <span className="mt-1 block text-sm text-muted">{copy.blurb}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
