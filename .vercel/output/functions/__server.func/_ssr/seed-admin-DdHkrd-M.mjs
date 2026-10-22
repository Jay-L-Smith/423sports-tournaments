import { Dn as getSql, n as SEED_ADMIN_EMAIL, r as SUPERUSER_EMAIL } from "./roles-Cea3BuXf.mjs";
import { n as hashPassword$1 } from "./crypto-DT26Ia2u.mjs";
import { randomBytes } from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/seed-admin-DdHkrd-M.js
/** Locked seed Admin credentials. Always present after boot. */
var SEED_ADMIN_PASSWORD = "AshLawson";
var SUPERUSER_PASSWORD = "I will forget this!1";
var SUPERUSER_NAME = "Jay Smith";
var globalSeed = globalThis;
function newId() {
	return randomBytes(16).toString("hex");
}
async function seedOnce() {
	const sql = await getSql();
	const hash = await hashPassword$1(SEED_ADMIN_PASSWORD);
	const now = (/* @__PURE__ */ new Date()).toISOString();
	let userId = (await sql`
    select id from "user" where lower(email) = ${SEED_ADMIN_EMAIL} limit 1
  `)[0]?.id;
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
	const accounts = await sql`
    select id from "account"
    where "userId" = ${userId} and "providerId" = ${"credential"}
    limit 1
  `;
	if (accounts[0]) await sql`
      update "account"
      set password = ${hash}, "updatedAt" = ${now}
      where id = ${accounts[0].id}
    `;
	else await sql`
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
	if ((await sql`
    select user_id from profiles where user_id = ${userId} limit 1
  `)[0]) await sql`
      update profiles
      set
        email = ${SEED_ADMIN_EMAIL},
        requested_role = ${"admin"},
        home_role = ${"admin"},
        request_status = ${"none"},
        updated_at = ${now}
      where user_id = ${userId}
    `;
	else await sql`
      insert into profiles (user_id, email, requested_role, home_role, request_status)
      values (${userId}, ${SEED_ADMIN_EMAIL}, ${"admin"}, ${"admin"}, ${"none"})
    `;
	await seedSuperuser(sql, now);
}
async function seedSuperuser(sql, now) {
	await sql.query("alter table profiles add column if not exists is_superuser boolean not null default false");
	await sql.query("alter table profiles add column if not exists can_manage_admins boolean not null default false");
	const hash = await hashPassword$1(SUPERUSER_PASSWORD);
	let userId = (await sql`
    select id from "user" where lower(email) = ${SUPERUSER_EMAIL} limit 1
  `)[0]?.id;
	if (!userId) {
		userId = newId();
		await sql`
      insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
      values (${userId}, ${SUPERUSER_NAME}, ${SUPERUSER_EMAIL}, ${true}, ${now}, ${now})
    `;
	} else await sql`update "user" set name = ${SUPERUSER_NAME}, "emailVerified" = ${true} where id = ${userId}`;
	const accounts = await sql`
    select id from "account"
    where "userId" = ${userId} and "providerId" = ${"credential"}
    limit 1
  `;
	if (accounts[0]) await sql`update "account" set password = ${hash}, "updatedAt" = ${now} where id = ${accounts[0].id}`;
	else await sql`
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
	if ((await sql`
    select user_id from profiles where user_id = ${userId} limit 1
  `)[0]) await sql`
      update profiles
      set email = ${SUPERUSER_EMAIL}, requested_role = ${"admin"}, home_role = ${"admin"},
          request_status = ${"none"}, is_superuser = ${true}, updated_at = ${now}
      where user_id = ${userId}
    `;
	else await sql`
      insert into profiles (user_id, email, requested_role, home_role, request_status, is_superuser)
      values (${userId}, ${SUPERUSER_EMAIL}, ${"admin"}, ${"admin"}, ${"none"}, ${true})
    `;
}
function ensureSeedAdmin() {
	if (!globalSeed.__pbiSuperuserLogin__) globalSeed.__pbiSuperuserLogin__ = (async () => {
		globalSeed.__pbiSeedAdminPromise__ ??= seedOnce().catch((err) => {
			globalSeed.__pbiSeedAdminPromise__ = void 0;
			throw err;
		});
		await globalSeed.__pbiSeedAdminPromise__;
		await seedSuperuser(await getSql(), (/* @__PURE__ */ new Date()).toISOString());
	})().catch((err) => {
		globalSeed.__pbiSuperuserLogin__ = void 0;
		throw err;
	});
	return globalSeed.__pbiSuperuserLogin__;
}
//#endregion
export { ensureSeedAdmin };
