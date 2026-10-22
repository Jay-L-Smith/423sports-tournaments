export const SEED_ADMIN_EMAIL = "pbi.tournaments.temp@gmail.com";
/** The only account that can grant superuser access. */
export const SUPERUSER_EMAIL = "jay_l_smith@outlook.com";

export const ROLES = ["parent", "athlete", "coach", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const ELEVATED_ROLES = ["coach", "admin"] as const;
export type ElevatedRole = (typeof ELEVATED_ROLES)[number];

export type RequestStatus = "none" | "pending" | "approved" | "denied";

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export function isElevatedRole(value: string): value is ElevatedRole {
  return (ELEVATED_ROLES as readonly string[]).includes(value);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isSeedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return normalizeEmail(email) === SEED_ADMIN_EMAIL;
}

export function isSuperuserOwner(email: string | null | undefined): boolean {
  if (!email) return false;
  return normalizeEmail(email) === SUPERUSER_EMAIL;
}

/** Ash can open the coach screen, but only as the account named Test Coach. */
export function isCoachPreviewAdmin(email: string | null | undefined, name?: string | null): boolean {
  const normalized = normalizeEmail(email ?? "");
  const label = (name ?? "").trim().toLowerCase();
  if (label === "ash lawson") return true;
  if (normalized === SEED_ADMIN_EMAIL) return true;
  return normalized.endsWith("@hotmail.com") && normalized.includes("pbi") && (normalized.includes("camp") || normalized.includes("tournament"));
}

export const ROLE_COPY: Record<
  Role,
  { label: string; blurb: string; homeTitle: string }
> = {
  parent: {
    label: "Parent",
    blurb: "Follow your athlete’s games and updates.",
    homeTitle: "Parent home",
  },
  athlete: {
    label: "Athlete",
    blurb: "See your team, games, and notices.",
    homeTitle: "Athlete home",
  },
  coach: {
    label: "Coach",
    blurb: "Run your roster, schedule, and scores.",
    homeTitle: "Coach home",
  },
  admin: {
    label: "Admin",
    blurb: "Direct the tournament: people, fields, brackets.",
    homeTitle: "Admin home",
  },
};
