# 423Sports Tournaments

Travel-ball tournament app. Shipped so far: **accounts, role homes, and Admin tournaments**.

## Seed Admin

Email: `PBI.Tournaments.Temp@gmail.com`  
Password: `AshLawson`

Comparison is case-insensitive (`pbi.tournaments.temp@gmail.com`).

This account is created automatically on boot if it is missing, and the password is kept in sync. Sign in — do not create it again. It is **Admin immediately**.

Constant: `SEED_ADMIN_EMAIL` in `src/lib/pbi/roles.ts`.

Coach / later Admin sign-ups stay on **Parent home** until a current Admin taps Approve.

## Tournaments

Admins open **Tournaments** from home and save a tournament: name, first/last day, age groups (8U–18U). Tap **Add Tournament** to open the form. Tap a tournament to set **min/max teams per age** and add **locations** (multiple complexes, name + address). Approved coaches **request a team** into a tournament + age from **My team**. An Admin has to take them — a request is not a spot. Then they add a **roster** (name + jersey) on that team. Approved teams fill an auto **bracket**; the **calendar** is those same games. Admins drag teams to seeds and confirm suggested fields.

