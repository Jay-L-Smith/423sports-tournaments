// @ts-nocheck
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { Fragment, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ParkOptions, parkSummary } from "@/components/park-options";
import { FieldBand } from "@/components/field-band";
import { SessionSkeleton, useAppSession } from "@/components/session-gate";
import { AppShell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { listDirectory, listKnownParks, listCoachInvites, listCoachDirectory, listCoachRosters, listStaff, createCoachInvite, addCoachDirectory, updateCoachDirectory, removeCoachDirectory, linkCoachAccount, eraseAccount, setSuperuser, updateAdminAccount, saveStaffMember, removeStaffMember, addKnownPark, updateKnownPark, removeKnownPark, getClubCard, type CoachInvite, type CoachRecord, type DirectoryUser, type KnownPark } from "@/lib/pbi/api";
import { isSuperuserOwner } from "@/lib/pbi/roles";
import { AGE_GROUPS, emptyParkFlags, parseLocationInput, type AgeGroup, type ParkFlags } from "@/lib/pbi/weekends";
import { AgeFilter, ageListRank, showsEveryAge } from "@/components/age-filter";
import { formatPhoneInput } from "@/lib/utils";

export const Route = createFileRoute("/resources")({
  component: ResourcesPage,
});

function flagsFrom(park) {
  return {
    chairs: park.chairs,
    canopies: park.canopies,
    concessions: park.concessions,
    restrooms: park.restrooms,
    lights: park.lights,
    bleachers: park.bleachers,
    entranceFee: park.entranceFee,
    entrancePrice: park.entrancePrice,
    ageDiscount: park.ageDiscount,
    discountAges: park.discountAges,
    discountPrice: park.discountPrice
  };
}
function ResourcesPage() {
  const {
    user,
    isPending,
    profile
  } = useAppSession();
  const queryClient = useQueryClient();
  const parksQuery = useQuery({
    queryKey: ["known-parks"],
    queryFn: () => listKnownParks(),
    enabled: Boolean(profile?.homeRole === "admin")
  });
  const usersQuery = useQuery({
    queryKey: ["directory"],
    queryFn: () => listDirectory(),
    enabled: Boolean(profile?.homeRole === "admin")
  });
  const [editingId, setEditingId] = useState(null);
  const [addingField, setAddingField] = useState(false);
  const [open, setOpen] = useState(null);
  if (isPending) return <SessionSkeleton />;
  if (!user) return <RedirectToSignIn />;
  if (!profile || profile.homeRole !== "admin") return <Navigate to="/" />;
  const parks = parksQuery.data ?? [];
  const admins = (usersQuery.data ?? []).filter(person => person.homeRole === "admin");
  return <AppShell homeRole={profile.homeRole}><div className="flex min-h-[calc(100dvh-11rem)] flex-col"><h1 className="font-display text-4xl font-bold uppercase">Resources</h1><div className="mt-6 grid grid-cols-2 gap-2"><ResourceButton label="Coaches" onClick={() => setOpen("coaches")} /><ResourceButton label="Staff" onClick={() => setOpen("staff")} /><ResourceButton label="Accounts" onClick={() => setOpen("accounts")} /><ResourceButton label="Fields" onClick={() => setOpen("fields")} /></div>{open ? <ResourceSheet title={sheetTitle(open)} onClose={() => {
        setOpen(null);
        setEditingId(null);
        setAddingField(false);
      }}>{open === "coaches" ? <CoachInvites /> : null}{open === "staff" ? <StaffDirectory /> : null}{open === "accounts" ? <AccountDirectory people={admins} pending={usersQuery.isPending} canManage={Boolean(profile.canManageAdmins)} canGrant={Boolean(profile.canGrantSuperuser)} selfId={profile.userId} /> : null}{open === "fields" ? <div className="space-y-3"><Button type="button" className="h-10 px-4 text-sm" onClick={() => setAddingField(true)}>Add field</Button>{parksQuery.isPending ? <p className="text-sm text-muted">Loading fields…</p> : parksQuery.isError ? <p className="text-sm text-muted">Could not load fields. Close this and open it again.</p> : parks.length === 0 ? <p className="text-sm text-muted">No fields saved yet.</p> : parks.map(park => <ParkCard park={park} editing={editingId === park.id} onEdit={() => setEditingId(park.id)} onCancel={() => setEditingId(null)} onSaved={next => {
            queryClient.setQueryData(["known-parks"], current => (current ?? []).map(row => row.id === next.id ? next : row));
            setEditingId(null);
          }} onRemoved={parkId => {
            queryClient.setQueryData(["known-parks"], current => (current ?? []).filter(row => row.id !== parkId));
            setEditingId(null);
          }} />)}{addingField ? <FieldForm onClose={() => setAddingField(false)} onSaved={park => {
            queryClient.setQueryData(["known-parks"], current => {
              const rows = current ?? [];
              return rows.some(row => row.id === park.id) ? rows.map(row => row.id === park.id ? park : row) : [...rows, park].sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id);
            });
            setAddingField(false);
          }} /> : null}</div> : null}</ResourceSheet> : null}<FieldBand src="/photos/field-dugout.jpg" /></div></AppShell>;
}
function FieldForm({
  onClose,
  onSaved
}) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [flags, setFlags] = useState(() => emptyParkFlags());
  const [formError, setFormError] = useState(null);
  const save = useMutation({
    mutationFn: () => addKnownPark({
      data: {
        name,
        address,
        ...flags
      }
    }),
    onSuccess: park => onSaved(park)
  });
  const error = formError ?? (save.error instanceof Error ? save.error.message : save.error ? "Could not save that field." : null);
  return <NestedSheet title="Add field" onClose={onClose}><form className="space-y-3" onSubmit={event => {
      event.preventDefault();
      setFormError(null);
      try {
        parseLocationInput({
          weekendId: 1,
          name,
          address
        });
        save.mutate();
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Check the field and try again.");
      }
    }}><label className="block space-y-1 text-sm font-semibold">Name<Input value={name} onChange={event => setName(event.target.value)} maxLength={80} required /></label><label className="block space-y-1 text-sm font-semibold">Address<Input value={address} onChange={event => setAddress(event.target.value)} maxLength={160} required /></label><ParkOptions idPrefix="add-field" flags={flags} onChange={setFlags} />{error ? <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">{error}</p> : null}<Button type="submit" className="w-full" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save field"}</Button></form></NestedSheet>;
}
function sheetTitle(open) {
  if (open === "coaches") return "Coaches";
  if (open === "staff") return "Staff";
  if (open === "accounts") return "Accounts";
  return "Fields";
}
function ResourceButton({
  label,
  onClick
}) {
  return <button type="button" onClick={onClick} className="flex min-h-24 items-center justify-center rounded-lg border border-line bg-surface px-3 text-center font-display text-xl font-bold uppercase leading-none">{label}</button>;
}
function byName(a, b) {
  return a.localeCompare(b, void 0, {
    sensitivity: "base"
  });
}
function coachAge(coach) {
  const ages = (coach.teams ?? []).map(team => Number.parseInt(String(team.ageGroup ?? ""), 10)).filter(age => Number.isFinite(age));
  return ages.length === 0 ? 100 : Math.min(...ages);
}
function byCoach(a, b) {
  return coachAge(a) - coachAge(b) || byName(a.name || a.email, b.name || b.email);
}
function AccountDirectory({
  people,
  pending,
  canManage,
  canGrant,
  selfId
}) {
  const queryClient = useQueryClient();
  const coachesQuery = useQuery({
    queryKey: ["coach-directory"],
    queryFn: () => listCoachDirectory()
  });
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [confirmCoach, setConfirmCoach] = useState(null);
  const [confirmGrant, setConfirmGrant] = useState(null);
  const [editingCoach, setEditingCoach] = useState(null);
  const erase = useMutation({
    mutationFn: userId => eraseAccount({
      data: {
        userId
      }
    }),
    onSuccess: async () => {
      setConfirmRemove(null);
      setConfirmCoach(null);
      await queryClient.invalidateQueries({
        queryKey: ["directory"]
      });
      await queryClient.invalidateQueries({
        queryKey: ["coach-directory"]
      });
      await queryClient.invalidateQueries({
        queryKey: ["weekends"]
      });
    }
  });
  const grant = useMutation({
    mutationFn: input => setSuperuser({
      data: input
    }),
    onSuccess: async () => {
      setConfirmGrant(null);
      await queryClient.invalidateQueries({
        queryKey: ["directory"]
      });
    }
  });
  const admins = [...people].sort((a, b) => byName(a.name || a.email, b.name || b.email));
  const coaches = [...(coachesQuery.data ?? [])].sort(byCoach);
  if (pending || coachesQuery.isPending) return <p className="text-sm text-muted">Loading accounts…</p>;
  const error = erase.error instanceof Error && erase.error.message || grant.error instanceof Error && grant.error.message || null;
  return <div className="space-y-5">{!canManage ? <p className="text-sm text-muted">Only an administrator you allow can add or remove other administrators.</p> : null}<section className="space-y-2"><h3 className="font-display text-xl font-bold uppercase">Administrators</h3>{admins.length === 0 ? <p className="text-sm text-muted">No administrators yet.</p> : <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">{admins.map(person => {
          const mine = person.userId === selfId;
          const owner = isSuperuserOwner(person.email);
          return <li className="px-4 py-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-medium">{person.name || person.email}</p>{person.name ? <p className="truncate text-sm text-muted">{person.email}</p> : null}<p className="text-xs font-bold uppercase tracking-wide text-muted">{owner ? "Superuser" : person.canManageAdmins ? "Can manage admins" : "Administrator"}{mine ? " · You" : ""}</p></div>{canManage && !mine && !owner && confirmRemove !== person.userId ? <Button type="button" variant="ghost" className="px-2 text-muted" onClick={() => setConfirmRemove(person.userId)}>Delete</Button> : null}</div>{confirmRemove === person.userId ? <div className="mt-3 space-y-2"><p className="text-sm">Delete {person.email} completely? Their login is removed and cannot be restored.</p><div className="flex gap-2"><Button type="button" className="flex-1" disabled={erase.isPending} onClick={() => erase.mutate(person.userId)}>{erase.isPending ? "Deleting…" : "Delete account"}</Button><Button type="button" variant="outline" className="flex-1" onClick={() => setConfirmRemove(null)}>Cancel</Button></div></div> : null}{canGrant && !mine && !owner ? confirmGrant === person.userId ? <div className="mt-3 space-y-2"><p className="text-sm">{person.canManageAdmins ? `Stop ${person.email} from adding or removing administrators? They stay an administrator.` : `Let ${person.email} add and remove other administrators? They still can’t give that power to anyone else.`}</p><div className="flex gap-2"><Button type="button" className="flex-1" disabled={grant.isPending} onClick={() => grant.mutate({
                  userId: person.userId,
                  grant: !person.canManageAdmins
                })}>{grant.isPending ? "Saving…" : person.canManageAdmins ? "Stop managing admins" : "Allow managing admins"}</Button><Button type="button" variant="outline" className="flex-1" onClick={() => setConfirmGrant(null)}>Cancel</Button></div></div> : <Button type="button" variant="outline" className="mt-3 w-full" onClick={() => setConfirmGrant(person.userId)}>{person.canManageAdmins ? "Stop managing admins" : "Allow managing admins"}</Button> : null}</li>;
        })}</ul>}</section><section className="space-y-2"><h3 className="font-display text-xl font-bold uppercase">Coaches</h3>{coaches.length === 0 ? <p className="text-sm text-muted">No coaches yet.</p> : <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">{coaches.map(coach => <li className="px-4 py-3"><div className="flex items-start justify-between gap-3"><button type="button" className="min-w-0 flex-1 text-left" onClick={() => setEditingCoach(coach)}><p className="truncate font-medium">{coach.name || coach.email}</p><p className="truncate text-sm text-muted">{coach.email}</p><p className="text-xs font-bold uppercase tracking-wide text-muted">Coach{coach.teams.length > 0 ? ` · ${coach.teams.map(team => `${team.name} ${team.ageGroup ?? ""}`.trim()).join(", ")}` : ""}</p></button>{confirmCoach !== coach.userId ? <Button type="button" variant="ghost" className="px-2 text-muted" onClick={() => setConfirmCoach(coach.userId)}>Delete</Button> : null}</div>{confirmCoach === coach.userId ? <div className="mt-3 space-y-2"><p className="text-sm">Delete {coach.name || coach.email} completely? Their login, team, and roster are removed and cannot be restored.</p><div className="flex gap-2"><Button type="button" className="flex-1" disabled={erase.isPending} onClick={() => erase.mutate(coach.userId)}>{erase.isPending ? "Deleting…" : "Delete account"}</Button><Button type="button" variant="outline" className="flex-1" onClick={() => setConfirmCoach(null)}>Cancel</Button></div></div> : null}</li>)}</ul>}</section>{error ? <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">{error}</p> : null}{editingCoach ? <CoachEditForm coach={editingCoach} onClose={() => setEditingCoach(null)} onSaved={next => {
      queryClient.setQueryData(["coach-directory"], current => (current ?? []).map(row => row.userId === next.userId ? next : row));
      setEditingCoach(null);
    }} onRemoved={userId => {
      queryClient.setQueryData(["coach-directory"], current => (current ?? []).filter(row => row.userId !== userId));
      setEditingCoach(null);
      setConfirmCoach(null);
    }} /> : null}</div>;
}
function ResourceSheet({
  title,
  onClose,
  children
}) {
  if (typeof document === "undefined") return null;
  return createPortal(<div className="fixed inset-0 z-[80] flex items-end justify-center bg-scrim sm:items-center" onClick={onClose}><div role="dialog" aria-modal="true" aria-label={title} className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-lg border border-line bg-bg p-4 text-fg shadow-lg sm:rounded-lg" onClick={event => event.stopPropagation()}><div className="flex items-center justify-between gap-3"><h2 className="font-display text-3xl font-bold uppercase">{title}</h2><button type="button" aria-label="Close" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-md text-muted"><X className="h-5 w-5" aria-hidden /></button></div><div className="mt-4">{children}</div></div></div>, document.body);
}
function StaffDirectory() {
  const queryClient = useQueryClient();
  const staffQuery = useQuery({
    queryKey: ["staff"],
    queryFn: () => listStaff()
  });
  const [adding, setAdding] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const remove = useMutation({
    mutationFn: id => removeStaffMember({
      data: {
        id
      }
    }),
    onSuccess: async () => {
      setConfirmId(null);
      await queryClient.invalidateQueries({
        queryKey: ["staff"]
      });
    }
  });
  const people = staffQuery.data ?? [];
  return <div className="space-y-4"><Button type="button" className="h-10 px-4 text-sm" onClick={() => setAdding(true)}>Add staff</Button>{staffQuery.isPending ? <p className="text-sm text-muted">Loading staff…</p> : staffQuery.isError ? <p className="text-sm text-muted">Could not load staff. Close this and open it again.</p> : people.length === 0 ? <p className="text-sm text-muted">No staff saved yet.</p> : <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">{people.map(person => <li className="px-4 py-3"><div className="flex items-center justify-between gap-3"><span className="min-w-0"><span className="block truncate font-medium">{person.name}</span><span className="block text-sm text-muted">{person.phone}</span></span>{confirmId === person.id ? null : <Button type="button" variant="ghost" className="px-2 text-muted" onClick={() => setConfirmId(person.id)}>Delete</Button>}</div>{confirmId === person.id ? <div className="mt-3 space-y-2"><p className="text-sm">Delete {person.name} from staff? This cannot be undone.</p><div className="flex gap-2"><Button type="button" className="flex-1" disabled={remove.isPending} onClick={() => remove.mutate(person.id)}>{remove.isPending ? "Deleting…" : "Delete staff"}</Button><Button type="button" variant="outline" className="flex-1" onClick={() => setConfirmId(null)}>Cancel</Button></div></div> : null}</li>)}</ul>}{adding ? <StaffForm onClose={() => setAdding(false)} onSaved={async () => {
      setAdding(false);
      await queryClient.invalidateQueries({
        queryKey: ["staff"]
      });
    }} /> : null}</div>;
}
function StaffForm({
  onClose,
  onSaved
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const save = useMutation({
    mutationFn: () => saveStaffMember({
      data: {
        name,
        phone
      }
    }),
    onSuccess: () => onSaved()
  });
  const error = save.error instanceof Error ? save.error.message : null;
  return <NestedSheet title="Add staff" onClose={onClose}><form className="space-y-3" onSubmit={event => {
      event.preventDefault();
      save.mutate();
    }}><label className="block space-y-1 text-sm font-semibold">Name<Input value={name} onChange={event => setName(event.target.value)} maxLength={80} required /></label><label className="block space-y-1 text-sm font-semibold">Phone<Input value={phone} onChange={event => setPhone(formatPhoneInput(event.target.value))} placeholder="(555) 555-0100" inputMode="tel" autoComplete="off" name="staff-cell" required /></label>{error ? <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">{error}</p> : null}<Button type="submit" className="w-full" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save staff"}</Button></form></NestedSheet>;
}
function inviteHref(invite) {
  const body = `423Sports Tournaments. Create your coach account here: ${`${window.location.origin}/join?role=coach&invite=${invite.id}`}`;
  if (invite.channel === "email") return `mailto:${invite.destination}?subject=${encodeURIComponent("423Sports coach account")}&body=${encodeURIComponent(body)}`;
  const digits = invite.destination.replace(/\D/g, "");
  return `sms:${digits.length === 10 ? `+1${digits}` : digits.length === 11 && digits.startsWith("1") ? `+${digits}` : digits}?&body=${encodeURIComponent(body)}`;
}
function openCoachText() {
  const link = `${window.location.origin}/join?role=coach`;
  const text = `423Sports Tournaments. Create your coach account here: ${link}`;
  const body = encodeURIComponent(text);
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
  window.location.href = ios ? `sms:&body=${body}` : `sms:?body=${body}`;
}

function CoachInvites() {
  const queryClient = useQueryClient();
  const coachesQuery = useQuery({
    queryKey: ["coach-directory"],
    queryFn: () => listCoachDirectory()
  });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [linkFrom, setLinkFrom] = useState(null);
  const [linkTo, setLinkTo] = useState(null);
  const [ageFilter, setAgeFilter] = useState("All");
  const remove = useMutation({
    mutationFn: userId => removeCoachDirectory({
      data: {
        userId
      }
    }),
    onSuccess: (_result, userId) => {
      queryClient.setQueryData(["coach-directory"], current => (current ?? []).filter(row => row.userId !== userId));
      setConfirmId(null);
    }
  });
  const link = useMutation({
    mutationFn: input => linkCoachAccount({ data: input }),
    onSuccess: (_result, input) => {
      queryClient.setQueryData(["coach-directory"], current => (current ?? []).filter(row => row.userId !== input.fromUserId));
      setLinkFrom(null);
      setLinkTo(null);
    }
  });
  const coaches = [...(coachesQuery.data ?? [])].sort(byCoach);
  const shown = coaches
    .filter((coach) => showsEveryAge(ageFilter) || coach.teams.some((team) => team.ageGroup === ageFilter))
    .sort((a, b) => {
      if (!showsEveryAge(ageFilter)) return byName(a.name || a.email, b.name || b.email);
      const ageOf = (coach) => coach.teams.reduce((best, team) => Math.min(best, ageListRank(team.ageGroup ?? "")), 99);
      return ageOf(a) - ageOf(b) || byName(a.name || a.email, b.name || b.email);
    });
  const accountCoaches = coaches.filter(coach => coach.hasAccount && coach.userId !== linkFrom?.userId);
  return <div className="space-y-4"><div className="flex gap-2"><Button type="button" className="h-10 flex-1 px-4 text-sm" onClick={() => setAdding(true)}>Add coach</Button><Button type="button" variant="outline" className="h-10 flex-1 px-4 text-sm" onClick={openCoachText}>Invite</Button></div><button type="button" className="text-sm font-semibold text-muted" onClick={() => setInviteOpen(true)}>Email an invite</button><AgeFilter value={ageFilter} onChange={setAgeFilter} />{coachesQuery.isPending ? <p className="text-sm text-muted">Loading coaches…</p> : coaches.length === 0 ? <p className="text-sm text-muted">No coaches yet.</p> : shown.length === 0 ? <p className="text-sm text-muted">No coaches in that age.</p> : <ul className="space-y-2">{shown.map(coach => <li className="rounded-lg border border-line bg-surface px-4 py-3"><div className="flex items-start justify-between gap-3"><button type="button" onClick={() => setEditing(coach)} className="min-w-0 flex-1 text-left"><p className="font-semibold">{coach.name || coach.email}</p>{coach.teams.length === 0 ? <p className="text-sm text-muted">No team yet</p> : coach.teams.map((team, index) => <p className="text-sm">{team.name}{team.ageGroup ? ` · ${team.ageGroup}` : ""}</p>)}<p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted">{coach.hasAccount ? "Has an account" : "Added by admin"}</p></button>{confirmId === coach.userId ? null : <div className="flex shrink-0 items-center gap-1">{coach.hasAccount ? null : <Button type="button" variant="ghost" className="px-2 text-muted" onClick={() => { setLinkFrom(coach); setLinkTo(null); }}>Link</Button>}<Button type="button" variant="ghost" className="px-2 text-muted" onClick={() => setConfirmId(coach.userId)}>Delete</Button></div>}</div>{confirmId === coach.userId ? <div className="mt-3 space-y-2"><p className="text-sm">Delete {coach.name || coach.email}? This takes them off the coach list.</p><div className="flex gap-2"><Button type="button" className="flex-1" disabled={remove.isPending} onClick={() => remove.mutate(coach.userId)}>{remove.isPending ? "Deleting…" : "Delete coach"}</Button><Button type="button" variant="outline" className="flex-1" onClick={() => setConfirmId(null)}>Cancel</Button></div>{remove.error instanceof Error ? <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">{remove.error.message}</p> : null}</div> : null}</li>)}</ul>}{linkFrom ? <NestedSheet title="Link this coach" onClose={() => { setLinkFrom(null); setLinkTo(null); }}><p className="text-sm">{linkFrom.name || linkFrom.email} was added by an admin. Pick the account that should keep these teams. The added card goes away.</p>{accountCoaches.length === 0 ? <p className="mt-3 text-sm text-muted">No coach with an account yet.</p> : <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto">{accountCoaches.map(coach => <li><button type="button" onClick={() => setLinkTo(coach)} className={`w-full rounded-lg border px-3 py-2 text-left ${linkTo?.userId === coach.userId ? "border-ink bg-surface" : "border-line"}`}><p className="font-semibold">{coach.name || coach.email}</p><p className="text-sm text-muted">{coach.email}</p></button></li>)}</ul>}{linkTo ? <p className="mt-3 text-sm">Move {linkFrom.name || "this coach"}'s teams onto {linkTo.name || linkTo.email}'s account?</p> : null}{link.error instanceof Error ? <p className="mt-3 rounded-md bg-warn-bg px-3 py-2 text-sm">{link.error.message}</p> : null}<Button type="button" className="mt-4 w-full" disabled={!linkTo || link.isPending} onClick={() => linkTo && link.mutate({ fromUserId: linkFrom.userId, toUserId: linkTo.userId })}>{link.isPending ? "Linking…" : "Link accounts"}</Button></NestedSheet> : null}{adding ? <AddCoachForm onClose={() => setAdding(false)} onSaved={coach => {
      queryClient.setQueryData(["coach-directory"], current => [...(current ?? []).filter(row => row.userId !== coach.userId), coach].sort(byCoach));
      setAdding(false);
    }} /> : null}{inviteOpen ? <InviteForm onClose={() => setInviteOpen(false)} onSent={invite => {
      queryClient.setQueryData(["coach-invites"], current => [invite, ...(current ?? []).filter(row => row.id !== invite.id)]);
    }} /> : null}{editing ? <CoachEditForm coach={editing} onClose={() => setEditing(null)} onSaved={next => {
      queryClient.setQueryData(["coach-directory"], current => (current ?? []).map(row => row.userId === next.userId ? next : row));
      setEditing(null);
    }} onRemoved={userId => {
      queryClient.setQueryData(["coach-directory"], current => (current ?? []).filter(row => row.userId !== userId));
      setEditing(null);
    }} /> : null}</div>;
}
function AddCoachForm({
  onClose,
  onSaved
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [teamName, setTeamName] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const save = useMutation({
    mutationFn: () => addCoachDirectory({
      data: {
        name,
        phone,
        email,
        teamName,
        ageGroup
      }
    }),
    onSuccess: coach => onSaved(coach)
  });
  const error = save.error instanceof Error ? save.error.message : null;
  return <NestedSheet title="Add coach" onClose={onClose}><form className="space-y-3" onSubmit={event => {
      event.preventDefault();
      save.mutate();
    }}><label className="block space-y-1 text-sm font-semibold">Coach name<Input value={name} onChange={event => setName(event.target.value)} autoComplete="name" required /></label><label className="block space-y-1 text-sm font-semibold">Phone<Input value={phone} onChange={event => setPhone(formatPhoneInput(event.target.value))} placeholder="(555) 555-0100" inputMode="numeric" autoComplete="off" name="coach-cell" required /></label><label className="block space-y-1 text-sm font-semibold">Email <span className="font-normal text-muted">(optional)</span><Input value={email} onChange={event => setEmail(event.target.value)} placeholder="name@email.com" inputMode="email" autoComplete="email" autoCapitalize="none" /></label><label className="block space-y-1 text-sm font-semibold">Team name<Input value={teamName} onChange={event => setTeamName(event.target.value)} required /></label><label className="block space-y-1 text-sm font-semibold">Age bracket<select value={ageGroup} onChange={event => setAgeGroup(event.target.value)} required className="h-11 w-full rounded-md border border-line bg-bg px-3 text-sm"><option value="">Pick an age</option>{AGE_GROUPS.map(age => <option value={age}>{age}</option>)}</select></label>{error ? <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">{error}</p> : null}<Button type="submit" className="w-full" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save coach"}</Button></form></NestedSheet>;
}
function InviteForm({
  onClose,
  onSent
}) {
  const invitesQuery = useQuery({
    queryKey: ["coach-invites"],
    queryFn: () => listCoachInvites()
  });
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const send = useMutation({
    mutationFn: input => createCoachInvite({
      data: input
    }),
    onSuccess: invite => {
      if (invite.channel === "phone") setPhone("");else setEmail("");
      onSent(invite);
      window.location.href = inviteHref(invite);
    }
  });
  const error = send.error instanceof Error ? send.error.message : null;
  const invites = invitesQuery.data ?? [];
  return <NestedSheet title="Invite a coach" onClose={onClose}><form className="space-y-3" onSubmit={event => {
      event.preventDefault();
      send.mutate({
        channel: "phone",
        destination: phone
      });
    }}><label className="block space-y-1 text-sm font-semibold">Cell phone<Input value={formatPhoneInput(phone)} onChange={event => setPhone(formatPhoneInput(event.target.value))} inputMode="tel" autoComplete="off" name="invite-cell" placeholder="(555) 555-0100" /></label><Button type="submit" className="w-full" disabled={send.isPending}>Text an invite</Button></form><form className="mt-4 space-y-3" onSubmit={event => {
      event.preventDefault();
      send.mutate({
        channel: "email",
        destination: email
      });
    }}><label className="block space-y-1 text-sm font-semibold">Email<Input value={email} onChange={event => setEmail(event.target.value)} inputMode="email" autoComplete="email" placeholder="name@email.com" /></label><Button type="submit" variant="outline" className="w-full" disabled={send.isPending}>Email an invite</Button></form>{error ? <p className="mt-3 rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">{error}</p> : null}{invites.length > 0 ? <ul className="mt-4 space-y-2">{invites.map(invite => <li className="rounded-lg border border-line bg-surface px-4 py-3"><p className="truncate font-medium">{invite.destination}</p><p className="text-xs font-bold uppercase tracking-wide text-muted">{invite.channel === "phone" ? "Text" : "Email"} · {invite.accountEmail ? "Account created" : "No account yet"}</p></li>)}</ul> : null}</NestedSheet>;
}
function CoachRoster({ userId }) {
  const query = useQuery({
    queryKey: ["coach-roster", userId],
    queryFn: () => listCoachRosters({ data: { userId } }),
  });
  if (query.isPending) return <p className="text-sm text-muted">Loading roster…</p>;
  const teams = query.data ?? [];
  if (teams.length === 0) return null;
  return <div className="space-y-2"><p className="text-sm font-semibold">Roster</p>{teams.map(team => <div key={team.teamId} className="rounded-lg border border-line bg-surface px-3 py-2"><p className="text-xs font-bold uppercase tracking-wide text-muted">{team.name} · {team.ageGroup}</p>{team.players.length === 0 ? <p className="mt-1 text-sm text-muted">No players yet.</p> : <ul className="mt-1 space-y-1">{team.players.map(player => <li key={player.id} className="flex items-baseline justify-between gap-3 text-sm"><span className="min-w-0 truncate"><span className="font-semibold">#{player.jersey}</span> {player.name}</span><span className="shrink-0 text-xs text-muted">{player.gradYear ? `${player.gradYear} grad` : player.birthday ?? ""}</span></li>)}</ul>}</div>)}</div>;
}
function CoachEditForm({
  coach,
  onClose,
  onSaved,
  onRemoved
}) {
  const [name, setName] = useState(coach.name ?? "");
  const [phone, setPhone] = useState(coach.phone ?? "");
  const [email, setEmail] = useState(coach.email);
  const [club, setClub] = useState(coach.club ?? "");
  const [note, setNote] = useState(coach.note);
  const [teams, setTeams] = useState(coach.teams.length > 0 ? coach.teams.map(team => ({
    name: team.name,
    ageGroup: team.ageGroup ?? ""
  })) : [{
    name: "",
    ageGroup: ""
  }]);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const save = useMutation({
    mutationFn: () => updateCoachDirectory({
      data: {
        userId: coach.userId,
        name,
        phone,
        email,
        club,
        note,
        teams
      }
    }),
    onSuccess: next => onSaved(next)
  });
  const remove = useMutation({
    mutationFn: () => removeCoachDirectory({
      data: {
        userId: coach.userId
      }
    }),
    onSuccess: () => onRemoved(coach.userId)
  });
  const error = save.error instanceof Error ? save.error.message : remove.error instanceof Error ? remove.error.message : null;
  return <NestedSheet title={coach.name || "Coach"} onClose={onClose}><form className="space-y-3" onSubmit={event => {
      event.preventDefault();
      save.mutate();
    }}><label className="block space-y-1 text-sm font-semibold">Name<Input value={name} onChange={event => setName(event.target.value)} /></label><label className="block space-y-1 text-sm font-semibold">Cell phone<Input value={formatPhoneInput(phone)} onChange={event => setPhone(formatPhoneInput(event.target.value))} inputMode="tel" /></label><label className="block space-y-1 text-sm font-semibold">Email<Input value={email} onChange={event => setEmail(event.target.value)} inputMode="email" autoCapitalize="none" /></label><label className="block space-y-1 text-sm font-semibold">Organization<Input value={club} onChange={event => setClub(event.target.value)} placeholder="Optional" /></label><div className="space-y-2"><p className="text-sm font-semibold">Teams</p>{teams.map((team, index) => <div className="grid grid-cols-[1fr_5.5rem] gap-2"><Input value={team.name} aria-label="Team name" placeholder="Team name" onChange={event => setTeams(teams.map((row, i) => i === index ? {
            ...row,
            name: event.target.value
          } : row))} /><select aria-label="Age" value={team.ageGroup} onChange={event => setTeams(teams.map((row, i) => i === index ? {
            ...row,
            ageGroup: event.target.value
          } : row))} className="h-11 rounded-md border border-line bg-bg px-2 text-sm"><option value="">Age</option>{AGE_GROUPS.map(age => <option value={age}>{age}</option>)}</select></div>)}<Button type="button" variant="outline" className="w-full" onClick={() => setTeams([...teams, {
          name: "",
          ageGroup: ""
        }])}>Add another team</Button></div><CoachRoster userId={coach.userId} /><label className="block space-y-1 text-sm font-semibold">Private note<textarea value={note} onChange={event => setNote(event.target.value)} maxLength={1e3} rows={3} placeholder="Only you can see this. Example: ejected for arguing a call." className="min-h-20 w-full rounded-md border border-line bg-surface px-3 py-3 text-base text-fg placeholder:text-muted" /><span className="block text-xs font-normal text-muted">Only an admin can see this. The coach never can.</span></label>{error ? <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">{error}</p> : null}<Button type="submit" className="w-full" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button></form>{confirmRemove ? <div className="mt-3 space-y-2"><p className="text-sm">This takes coach access away and removes them from this list.</p><Button type="button" variant="outline" className="w-full" disabled={remove.isPending} onClick={() => remove.mutate()}>{remove.isPending ? "Removing…" : "Remove coach"}</Button><Button type="button" variant="ghost" className="w-full" onClick={() => setConfirmRemove(false)}>Cancel</Button></div> : <Button type="button" variant="ghost" className="mt-3 w-full text-muted" onClick={() => setConfirmRemove(true)}>Remove coach</Button>}</NestedSheet>;
}
function NestedSheet({
  title,
  onClose,
  children
}) {
  if (typeof document === "undefined") return null;
  return createPortal(<div className="fixed inset-0 z-[90] flex items-end justify-center bg-scrim sm:items-center" onClick={onClose}><div role="dialog" aria-modal="true" aria-label={title} className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-lg border border-line bg-bg p-4 text-fg shadow-lg sm:rounded-lg" onClick={event => event.stopPropagation()}><div className="flex items-center justify-between gap-3"><h2 className="font-display text-3xl font-bold uppercase">{title}</h2><button type="button" aria-label="Close" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-md text-muted"><X className="h-5 w-5" aria-hidden /></button></div><div className="mt-4">{children}</div></div></div>, document.body);
}
function ParkCard({
  park,
  editing,
  onEdit,
  onCancel,
  onSaved,
  onRemoved
}) {
  const [name, setName] = useState(park.name);
  const [address, setAddress] = useState(park.address);
  const [flags, setFlags] = useState(() => flagsFrom(park));
  const [formError, setFormError] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const saveMut = useMutation({
    mutationFn: () => updateKnownPark({
      data: {
        id: park.id,
        name,
        address,
        ...flags
      }
    }),
    onSuccess: next => {
      setFormError(null);
      onSaved(next);
    }
  });
  const removeMut = useMutation({
    mutationFn: () => removeKnownPark({
      data: {
        id: park.id
      }
    }),
    onSuccess: () => onRemoved(park.id)
  });
  const summary = parkSummary(park);
  const errorText = formError ?? (saveMut.error instanceof Error ? saveMut.error.message : saveMut.error ? "Could not save that park." : null) ?? (removeMut.error instanceof Error ? removeMut.error.message : removeMut.error ? "Could not remove that park." : null);
  function save() {
    setFormError(null);
    try {
      parseLocationInput({
        weekendId: 1,
        name,
        address
      });
      saveMut.mutate();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Check the park and try again.");
    }
  }
  return <article className="rounded-lg border border-line bg-surface px-4 py-4">{editing ? <div className="space-y-3"><div className="space-y-1.5"><Label htmlFor={`resource-name-${park.id}`}>Name</Label><Input id={`resource-name-${park.id}`} value={name} onChange={event => setName(event.target.value)} /></div><div className="space-y-1.5"><Label htmlFor={`resource-address-${park.id}`}>Address</Label><Input id={`resource-address-${park.id}`} value={address} onChange={event => setAddress(event.target.value)} /></div><ParkOptions idPrefix={`resource-${park.id}`} flags={flags} onChange={setFlags} /><p className="text-xs text-muted">This updates the saved park. Tournaments already using it stay as they are.</p>{errorText ? <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">{errorText}</p> : null}{confirmRemove ? <div className="space-y-2"><p className="text-sm">Delete this park for good? This cannot be undone. Tournaments already using it stay as they are.</p><div className="grid grid-cols-2 gap-2"><Button type="button" variant="outline" onClick={() => setConfirmRemove(false)}>Keep it</Button><Button type="button" variant="danger" disabled={removeMut.isPending} onClick={() => removeMut.mutate()}>{removeMut.isPending ? "Deleting…" : "Delete park"}</Button></div></div> : <div className="grid grid-cols-3 gap-2"><Button type="button" variant="outline" size="sm" className="px-2" onClick={onCancel}>Cancel</Button><Button type="button" variant="danger" size="sm" className="px-2" onClick={() => setConfirmRemove(true)}>Delete park</Button><Button type="button" size="sm" className="px-2" disabled={saveMut.isPending} onClick={save}>{saveMut.isPending ? "Saving…" : "Save"}</Button></div>}</div> : <Fragment><h2 className="font-display text-2xl font-bold uppercase leading-none">{park.name}</h2><p className="mt-2 text-sm">{park.address}</p>{summary ? <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted">{summary}</p> : null}<Button type="button" variant="outline" className="mt-3" onClick={() => {
        setName(park.name);
        setAddress(park.address);
        setFlags(flagsFrom(park));
        setFormError(null);
        onEdit();
      }}>Edit</Button></Fragment>}</article>;
}
