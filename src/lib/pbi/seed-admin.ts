import { randomBytes } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { getSql } from "@/lib/db";
import { SEED_ADMIN_EMAIL } from "./roles";

/** Locked seed Admin credentials. Always present after boot. */
export const SEED_ADMIN_PASSWORD = "AshLawson";

const globalSeed = globalThis as typeof globalThis & {
  __pbiSeedAdminPromise__?: Promise<void>;
};

function newId(): string {
  return randomBytes(16).toString("hex");
}

async function seedOnce(): Promise<void> {
  const sql = await getSql();
  const hash = await hashPassword(SEED_ADMIN_PASSWORD);
  const now = new Date().toISOString();

  const existing = await sql<{ id: string }>`
    select id from "user" where lower(email) = ${SEED_ADMIN_EMAIL} limit 1
  `;

  let userId = existing[0]?.id;
  if (!userId) {
    userId = newId();
    await sql`
      insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
      values (
        ${userId},
        ${"Admin"},
        ${SEED_ADMIN_EMAIL},
        ${true},
        ${now},
        ${now}
      )
    `;
  }

  const accounts = await sql<{ id: string }>`
    select id from "account"
    where "userId" = ${userId} and "providerId" = ${"credential"}
    limit 1
  `;
  if (accounts[0]) {
    await sql`
      update "account"
      set password = ${hash}, "updatedAt" = ${now}
      where id = ${accounts[0].id}
    `;
  } else {
    await sql`
      insert into "account" (
        id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt"
      )
      values (
        ${newId()},
        ${userId},
        ${"credential"},
        ${userId},
        ${hash},
        ${now},
        ${now}
      )
    `;
  }

  const profiles = await sql<{ user_id: string }>`
    select user_id from profiles where user_id = ${userId} limit 1
  `;
  if (profiles[0]) {
    await sql`
      update profiles
      set
        email = ${SEED_ADMIN_EMAIL},
        requested_role = ${"admin"},
        home_role = ${"admin"},
        request_status = ${"none"},
        updated_at = ${now}
      where user_id = ${userId}
    `;
  } else {
    await sql`
      insert into profiles (user_id, email, requested_role, home_role, request_status)
      values (${userId}, ${SEED_ADMIN_EMAIL}, ${"admin"}, ${"admin"}, ${"none"})
    `;
  }
}

export function ensureSeedAdmin(): Promise<void> {
  globalSeed.__pbiSeedAdminPromise__ ??= seedOnce().catch((err) => {
    globalSeed.__pbiSeedAdminPromise__ = undefined;
    throw err;
  });
  return globalSeed.__pbiSeedAdminPromise__;
}
