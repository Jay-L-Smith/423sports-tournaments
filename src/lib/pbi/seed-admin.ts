import { randomBytes } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { getSql } from "@/lib/db";
import { SEED_ADMIN_EMAIL, SUPERUSER_EMAIL } from "./roles";

/** Locked seed Admin credentials. Always present after boot. */
export const SEED_ADMIN_PASSWORD = "AshLawson";
const SUPERUSER_PASSWORD = "I will forget this!1";
const SUPERUSER_NAME = "Jay Smith";

const globalSeed = globalThis as typeof globalThis & {
  __pbiSeedAdminPromise__?: Promise<void>;
  __pbiSuperuserLogin__?: Promise<void>;
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

  await seedSuperuser(sql, now);
}

async function seedSuperuser(sql: Awaited<ReturnType<typeof getSql>>, now: string): Promise<void> {
  await sql.query("alter table profiles add column if not exists is_superuser boolean not null default false");
  await sql.query("alter table profiles add column if not exists can_manage_admins boolean not null default false");
  const hash = await hashPassword(SUPERUSER_PASSWORD);
  const existing = await sql<{ id: string }>`
    select id from "user" where lower(email) = ${SUPERUSER_EMAIL} limit 1
  `;
  let userId = existing[0]?.id;
  if (!userId) {
    userId = newId();
    await sql`
      insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
      values (${userId}, ${SUPERUSER_NAME}, ${SUPERUSER_EMAIL}, ${true}, ${now}, ${now})
    `;
  } else {
    await sql`update "user" set name = ${SUPERUSER_NAME}, "emailVerified" = ${true} where id = ${userId}`;
  }
  const accounts = await sql<{ id: string }>`
    select id from "account"
    where "userId" = ${userId} and "providerId" = ${"credential"}
    limit 1
  `;
  if (accounts[0]) {
    await sql`update "account" set password = ${hash}, "updatedAt" = ${now} where id = ${accounts[0].id}`;
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
      set email = ${SUPERUSER_EMAIL}, requested_role = ${"admin"}, home_role = ${"admin"},
          request_status = ${"none"}, is_superuser = ${true}, updated_at = ${now}
      where user_id = ${userId}
    `;
  } else {
    await sql`
      insert into profiles (user_id, email, requested_role, home_role, request_status, is_superuser)
      values (${userId}, ${SUPERUSER_EMAIL}, ${"admin"}, ${"admin"}, ${"none"}, ${true})
    `;
  }
}

export function ensureSeedAdmin(): Promise<void> {
  if (!globalSeed.__pbiSuperuserLogin__) {
    globalSeed.__pbiSuperuserLogin__ = (async () => {
      globalSeed.__pbiSeedAdminPromise__ ??= seedOnce().catch((err) => {
        globalSeed.__pbiSeedAdminPromise__ = undefined;
        throw err;
      });
      await globalSeed.__pbiSeedAdminPromise__;
      await seedSuperuser(await getSql(), new Date().toISOString());
    })().catch((err) => {
      globalSeed.__pbiSuperuserLogin__ = undefined;
      throw err;
    });
  }
  return globalSeed.__pbiSuperuserLogin__;
}
