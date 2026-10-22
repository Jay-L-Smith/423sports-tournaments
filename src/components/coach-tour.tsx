import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAppSession } from "@/components/session-gate";
import { coachTourFinished, markCoachTourFinished, onCoachTourOpen } from "@/lib/coach-tour-flag";

const STEPS: { title: string; body: string; target?: string; path?: string }[] = [
  {
    title: "Tournaments",
    body: "Tournaments you are in sit at the top. Everything else you can still join is under Open. Tap one you are not in, then Register or Not interested. The X just closes it.",
    path: "/",
  },
  {
    title: "The year",
    body: "The year in the corner is the one on this page. Upcoming tournaments are listed by date. Past ones stay folded at the bottom.",
    target: "year",
    path: "/",
  },
  {
    title: "Tournament cards",
    body: "Each card shows the dates, the age, the fee, and how many teams are registered. If your team is already in, tap the card to open the tournament.",
    target: "events",
    path: "/",
  },
  {
    title: "Notifications",
    body: "New tournaments and changes land here. Pick Register or Not interested. It stays unread until you choose. A change notice means something on a tournament moved.",
    target: "notifications",
    path: "/notifications",
  },
  {
    title: "My team",
    body: "Your team name and age are on this card. Tap them to edit. Add players underneath. A check next to a birthday means they make the age cutoff. An X means they are too old for that age.",
    target: "my-team",
    path: "/teams",
  },
  {
    title: "Account and sharing",
    body: "The person icon opens your account. Update your name, phone, email, organization, and teams there, or change your password. The share icon sends this app to another coach.",
    target: "header-tools",
    path: "/",
  },
  {
    title: "The bottom bar",
    body: "Schedule is your tournaments. Notifications is where new ones show up. My team is your roster. That is the whole coach view.",
    target: "tab-bar",
    path: "/",
  },
];

function finishTour(userId: string) {
  markCoachTourFinished(userId);
}

export function CoachTour() {
  const { user, profile } = useAppSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [open, setOpen] = useState(false);
  const [replay, setReplay] = useState(false);
  const [step, setStep] = useState(0);
  const [snap, setSnap] = useState<{ html: string; width: number; height: number; scale: number } | null>(null);
  const current = STEPS[step];
  const coachScreen = profile?.homeRole === "coach" && Boolean(user);
  const autoCoach = coachScreen && !profile?.isSuperuser && !profile?.coachPreview;

  useEffect(() => onCoachTourOpen(() => {
    setStep(0);
    setReplay(true);
    setOpen(true);
  }), []);

  useEffect(() => {
    if (!autoCoach || !user || replay) return;
    if (coachTourFinished(user.id)) return;
    setOpen(true);
  }, [autoCoach, user, replay]);

  useEffect(() => {
    if (!open || !current?.path || pathname === current.path) return;
    void navigate({ to: current.path });
  }, [open, current?.path, pathname, navigate]);

  useEffect(() => {
    if (!open || !current?.target) {
      setSnap(null);
      return;
    }
    let cancel = false;
    const grab = () => {
      const el = document.querySelector(`[data-tour="${current.target}"]`);
      if (!el || cancel) return false;
      el.scrollIntoView({ block: "nearest", inline: "nearest" });
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return false;
      const side = 20;
      const maxW = Math.max(160, window.innerWidth - side * 2);
      const maxH = Math.max(120, Math.round(window.innerHeight * 0.4));
      const fit = Math.min(maxW / rect.width, maxH / rect.height);
      const zoomCap = rect.width < 180 ? 2 : 1.06;
      const scale = Math.min(fit, zoomCap);
      const html = (el as HTMLElement).outerHTML.replace(/\bfixed\b/g, "relative").replace(/\binset-x-0\b/g, "").replace(/\bbottom-0\b/g, "");
      setSnap({ html, width: rect.width, height: rect.height, scale });
      return true;
    };
    const first = window.setTimeout(grab, 80);
    const second = window.setTimeout(grab, 450);
    return () => {
      cancel = true;
      window.clearTimeout(first);
      window.clearTimeout(second);
    };
  }, [open, current?.target, pathname, step, profile?.homeRole]);

  if (!open || !coachScreen || !user || !current || typeof document === "undefined") return null;

  function close(done: boolean) {
    if (!user) return;
    if (done && !profile?.isSuperuser) finishTour(user.id);
    setReplay(false);
    setOpen(false);
    if (pathname !== "/") void navigate({ to: "/" });
  }

  const last = step === STEPS.length - 1;
  const welcome = step === 0;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/60">
      <div className={`flex w-full flex-1 items-start justify-center overflow-hidden px-5 ${welcome ? "" : "pt-14"}`}>
        {snap && !welcome ? (
          <div className="relative max-w-full" style={{ width: snap.width * snap.scale, height: snap.height * snap.scale }}>
            <div
              className={`pointer-events-none absolute left-0 top-0 origin-top-left overflow-hidden rounded-lg shadow-2xl ring-4 ring-white ${
                current.target === "header-tools" ? "bg-[#1c1c1c] p-2" : "bg-white"
              }`}
              style={{ width: snap.width, transform: `scale(${snap.scale})` }}
              dangerouslySetInnerHTML={{ __html: snap.html }}
            />
          </div>
        ) : null}
      </div>
      <div className={`px-4 pb-6 ${welcome ? "absolute inset-x-0 top-1/2 -translate-y-1/2" : ""}`}>
        <div className="relative mx-auto max-w-md rounded-2xl bg-white px-4 py-4 text-[#1c1c1c] shadow-2xl">
          {snap && !welcome ? <span className="absolute -top-2 left-10 h-4 w-4 rotate-45 bg-white" aria-hidden /> : null}
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#1c1c1c]/45">
            {step + 1} of {STEPS.length}
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold uppercase leading-none">{current.title}</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{current.body}</p>
          <div className="mt-4 flex items-center gap-2">
            {step > 0 ? (
              <button type="button" onClick={() => setStep((value) => value - 1)} className="rounded-full px-3 py-2 text-sm font-semibold text-[#1c1c1c]/70">
                Back
              </button>
            ) : null}
            {!last ? (
              <button type="button" onClick={() => close(true)} className="rounded-full px-3 py-2 text-sm font-semibold text-[#1c1c1c]/70">
                Skip
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => (last ? close(true) : setStep((value) => value + 1))}
              className="ml-auto rounded-full bg-[#1c1c1c] px-5 py-2 text-sm font-semibold text-white"
            >
              {last ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
