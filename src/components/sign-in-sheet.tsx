import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode, type RefObject, type TouchEvent } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Navigate, useRouter } from "@tanstack/react-router";
import { authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SessionSkeleton } from "@/components/session-gate";
import { PublicLanding } from "@/components/public-landing";
import {
  checkSignupOpen,
  claimAddedCoach,
  completeOnboarding,
  ensureBootAccounts,
  previewCoachSignup,
  type SignupPreview,
} from "@/lib/pbi/api";
import { clientEmailIssue, clientPasswordIssue, plainAuthError } from "@/lib/pbi/auth-errors";
import { enterApp, signInWithEmail, signUpWithEmail } from "@/lib/pbi/email-auth";
import { armCoachNotices } from "@/lib/pbi/login-notices";
import { formatPhoneInput } from "@/lib/utils";

const ACCENT = "#3B9EFF";
const HOLD_KEY = "pbi-hold-landing";
const HOLD_EVENT = "pbi-hold-landing";
const SCROLL_KEY = "pbi-landing-scroll";
const TOP_KEY = "pbi-scroll-top";

type Mode = "in" | "up";
type SheetState = {
  open: boolean;
  mode: Mode;
  stay: boolean;
};

let sheetState: SheetState = { open: false, mode: "in", stay: false };
let returnFocus: HTMLElement | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readSheet() {
  return sheetState;
}

export function holdLanding(on: boolean) {
  if (typeof window === "undefined") return;
  if (on) window.sessionStorage.setItem(HOLD_KEY, "1");
  else window.sessionStorage.removeItem(HOLD_KEY);
  window.dispatchEvent(new Event(HOLD_EVENT));
}

export function landingHeld() {
  return window.sessionStorage.getItem(HOLD_KEY) === "1";
}

export function subscribeHold(listener: () => void) {
  window.addEventListener(HOLD_EVENT, listener);
  return () => window.removeEventListener(HOLD_EVENT, listener);
}

function rememberFocus() {
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
}

function restoreFocus() {
  const el = returnFocus;
  returnFocus = null;
  if (el?.isConnected) el.focus();
}

type OpenRequest = { mode: Mode; stay: boolean; entry: boolean; gen: number };

let pendingOpen: OpenRequest | null = null;
let sheetGeneration = 0;

export function openSignInSheet(opts?: { mode?: Mode; returnTo?: string | null; stay?: boolean; entry?: boolean }) {
  if (typeof window === "undefined") return;
  const mode = opts?.mode ?? "in";
  const stay = Boolean(opts?.stay);
  const gen = ++sheetGeneration;
  if (opts?.returnTo) window.sessionStorage.setItem("pbi-return", opts.returnTo);
  if (stay) window.sessionStorage.removeItem("pbi-return");
  rememberFocus();
  window.sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
  sheetState = { open: true, mode, stay };
  pendingOpen = { mode, stay, entry: Boolean(opts?.entry), gen };
  window.dispatchEvent(new Event("pbi-open-sheet"));
  emit();
}

export function setSignInMode(mode: Mode) {
  sheetState = { ...sheetState, mode };
  window.dispatchEvent(new CustomEvent("pbi-sheet-mode", { detail: mode }));
  emit();
}

export function closeSignInSheet(opts?: { top?: boolean }) {
  if (typeof window === "undefined") return;
  sheetGeneration += 1;
  if (opts?.top) window.sessionStorage.setItem(TOP_KEY, "1");
  window.dispatchEvent(new Event("pbi-close-sheet"));
}

function credentialMessage(error: unknown) {
  const message = plainAuthError(error);
  if (message === "Wrong email or password.") return "Email or password doesn't match.";
  return message;
}

export function SignInSheetHost() {
  const router = useRouter();
  const state = useSyncExternalStore(subscribe, readSheet, readSheet);
  const phone = useSyncExternalStore(
    (listener) => {
      const query = window.matchMedia("(max-width: 767px)");
      query.addEventListener("change", listener);
      return () => query.removeEventListener("change", listener);
    },
    () => window.matchMedia("(max-width: 767px)").matches,
    () => true,
  );
  const dialogRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const dragStart = useRef<number | null>(null);
  const [drag, setDrag] = useState(0);
  const [lift, setLift] = useState(0);

  useEffect(() => {
    const quiet = (fn: () => void) => {
      const history = router.history as { _ignoreSubscribers?: boolean };
      history._ignoreSubscribers = true;
      try {
        fn();
      } finally {
        history._ignoreSubscribers = false;
      }
    };
    const onOpen = () => {
      const request = pendingOpen;
      pendingOpen = null;
      if (!request || window.history.state?.pbiSheet) return;
      const prev = window.history.state && typeof window.history.state === "object" ? window.history.state : {};
      quiet(() => {
        window.history.pushState({ ...prev, pbiSheet: request.mode }, "");
      });
    };
    const onMode = (event: Event) => {
      const mode = (event as CustomEvent<Mode>).detail;
      if (mode !== "in" && mode !== "up" || !window.history.state?.pbiSheet) return;
      const prev = window.history.state && typeof window.history.state === "object" ? window.history.state : {};
      quiet(() => {
        window.history.replaceState({ ...prev, pbiSheet: mode }, "");
      });
    };
    const onClose = () => {
      if (window.history.state?.pbiSheet) {
        window.history.back();
        return;
      }
      sheetState = { ...sheetState, open: false };
      emit();
      restoreFocus();
    };
    window.addEventListener("pbi-open-sheet", onOpen);
    window.addEventListener("pbi-sheet-mode", onMode);
    window.addEventListener("pbi-close-sheet", onClose);
    return () => {
      window.removeEventListener("pbi-open-sheet", onOpen);
      window.removeEventListener("pbi-sheet-mode", onMode);
      window.removeEventListener("pbi-close-sheet", onClose);
    };
  }, [router]);

  useEffect(() => {
    const onPop = () => {
      if (window.history.state?.pbiSheet === "in" || window.history.state?.pbiSheet === "up") {
        sheetState = { ...sheetState, open: true, mode: window.history.state.pbiSheet };
        emit();
        return;
      }
      if (!sheetState.open) return;
      sheetState = { ...sheetState, open: false };
      emit();
      restoreFocus();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const shown = state.open;
  const mode = state.mode;

  const wasShown = useRef(false);
  useEffect(() => {
    if (shown) {
      wasShown.current = true;
      return;
    }
    if (!wasShown.current) return;
    wasShown.current = false;
    const top = window.sessionStorage.getItem(TOP_KEY) === "1";
    window.sessionStorage.removeItem(TOP_KEY);
    const y = top ? 0 : Number(window.sessionStorage.getItem(SCROLL_KEY) || "0");
    window.sessionStorage.removeItem(SCROLL_KEY);
    restoreFocus();
    window.requestAnimationFrame(() => window.scrollTo(0, Number.isFinite(y) ? y : 0));
  }, [shown]);

  useEffect(() => {
    if (!shown) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [shown]);

  useEffect(() => {
    if (!shown) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSignInSheet();
        return;
      }
      if (event.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;
      const items = [...root.querySelectorAll<HTMLElement>("a, button, input, textarea, select, [tabindex]")].filter(
        (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1 && !el.hasAttribute("aria-hidden"),
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shown]);

  useEffect(() => {
    if (!shown || mode !== "in") return;
    const desktop = window.matchMedia("(min-width: 768px)").matches;
    const timer = window.setTimeout(() => {
      if (desktop) emailRef.current?.focus();
      else dialogRef.current?.focus();
    }, 40);
    return () => window.clearTimeout(timer);
  }, [shown, mode]);

  useEffect(() => {
    if (!shown) return;
    const viewport = window.visualViewport;
    if (!viewport) return;
    const apply = () => {
      const covered = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setLift(covered);
    };
    apply();
    viewport.addEventListener("resize", apply);
    viewport.addEventListener("scroll", apply);
    return () => {
      viewport.removeEventListener("resize", apply);
      viewport.removeEventListener("scroll", apply);
      setLift(0);
    };
  }, [shown]);

  if (!shown || typeof document === "undefined") return null;

  function onHandleStart(event: TouchEvent) {
    if (!phone) return;
    dragStart.current = event.touches[0]?.clientY ?? null;
  }
  function onHandleMove(event: TouchEvent) {
    if (dragStart.current == null) return;
    const y = event.touches[0]?.clientY ?? dragStart.current;
    setDrag(Math.max(0, y - dragStart.current));
  }
  function onHandleEnd() {
    if (drag > 72) closeSignInSheet();
    setDrag(0);
    dragStart.current = null;
  }

  const sheetStyle = phone
    ? {
        bottom: lift,
        maxHeight: `min(85dvh, calc(100dvh - ${lift}px - 8px))`,
        transform: drag ? `translateY(${drag}px)` : undefined,
      }
    : { maxHeight: `min(90dvh, calc(100dvh - ${lift}px - 32px))` };

  return createPortal(
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => closeSignInSheet()} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sign-in-sheet-title"
        tabIndex={-1}
        className={`fixed z-[91] flex w-full flex-col border border-white/[0.08] bg-[#16181D] text-white shadow-[0_24px_80px_rgb(0_0_0/0.45)] outline-none ${
          phone
            ? "inset-x-0 rounded-t-2xl"
            : "left-1/2 top-1/2 w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-2xl"
        }`}
        style={sheetStyle}
      >
        <div
          className="flex shrink-0 touch-none items-center justify-between px-3 pt-2"
          onTouchStart={onHandleStart}
          onTouchMove={onHandleMove}
          onTouchEnd={onHandleEnd}
        >
          {mode === "up" ? (
            <button
              type="button"
              className="inline-flex h-11 items-center px-2 text-sm text-white/60"
              onClick={() => setSignInMode("in")}
            >
              ← Back to sign in
            </button>
          ) : (
            <span className="h-11 w-11" />
          )}
          {phone ? <span aria-hidden className="h-1 w-10 rounded-full bg-white/25" /> : <span />}
          <button
            type="button"
            aria-label="Close"
            className="grid h-11 w-11 place-items-center text-white/80"
            onClick={() => closeSignInSheet()}
          >
            <span aria-hidden className="text-xl leading-none">
              ×
            </span>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
          <button
            type="button"
            className="mx-auto mb-4 block"
            aria-label="Back to 423 Sports"
            onClick={() => closeSignInSheet({ top: true })}
          >
            <img src="/logo.png" alt="" className="h-auto w-24" />
          </button>
          {mode === "in" ? <SignInForm emailRef={emailRef} /> : <CreateForm />}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs text-white/55">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-2 text-sm text-[#ffb4b4]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const fieldClass =
  "h-12 w-full rounded-xl border border-white/[0.12] bg-[#1F2228] px-3 text-base text-white outline-none placeholder:text-white/35 focus:border-[#3B9EFF] focus:shadow-[0_0_0_3px_rgb(59_158_255/0.28)]";
const passwordClass = `${fieldClass} pr-12 [-webkit-text-security:disc]`;

function SignInForm({ emailRef }: { emailRef: RefObject<HTMLInputElement | null> }) {
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const emailIssue = clientEmailIssue(email);
    const passwordIssue = clientPasswordIssue(password);
    setEmailError(emailIssue);
    setPasswordError(passwordIssue);
    if (emailIssue || passwordIssue) return;
    setBusy(true);
    try {
      await ensureBootAccounts();
      await signInWithEmail(email.trim().toLowerCase(), password);
      armCoachNotices();
      holdLanding(false);
      enterApp();
    } catch (error) {
      holdLanding(false);
      setPasswordError(credentialMessage(error));
      setBusy(false);
    }
  }

  return (
    <form noValidate onSubmit={(event) => void onSubmit(event)}>
      <h2 id="sign-in-sheet-title" className="font-display text-center text-3xl font-bold uppercase leading-none text-white">
        Welcome back
      </h2>
      <p className="mt-2 text-center text-sm text-white/55">Sign in to manage your team.</p>
      {!authEnabled ? (
        <p className="mt-6 text-sm text-white/60">Sign-in is disabled.</p>
      ) : (
        <div className="mt-6 space-y-4">
          <Field id={emailId} label="Email" error={emailError}>
            <input
              ref={emailRef}
              id={emailId}
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="email"
              placeholder="name@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldClass}
            />
          </Field>
          <Field id={passwordId} label="Password" error={passwordError}>
            <div className="relative">
              <input
                id={passwordId}
                type="text"
                name="password"
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={showPassword ? `${fieldClass} pr-12` : passwordClass}
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-1 top-0 grid h-12 w-11 place-items-center text-white/55"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </Field>
          <button
            type="submit"
            disabled={busy}
            className="flex h-12 w-full items-center justify-center rounded-xl text-base font-semibold disabled:opacity-60"
            style={{ backgroundColor: ACCENT, color: "#0E0F12" }}
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign in"}
          </button>
        </div>
      )}
      <p className="mt-4 text-center text-sm text-white/55">
        New here?{" "}
        <button
          type="button"
          className="font-semibold"
          style={{ color: ACCENT }}
          onClick={() => {
            if (!window.sessionStorage.getItem("pbi-return")) {
              window.sessionStorage.setItem("pbi-return", "/teams/new");
              sheetState = { ...sheetState, stay: false };
            }
            setSignInMode("up");
          }}
        >
          Register your team
        </button>
      </p>
    </form>
  );
}

function CreateForm() {
  const nameId = useId();
  const phoneId = useId();
  const emailId = useId();
  const passwordId = useId();
  const teamId = useId();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teamName, setTeamName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [busy, setBusy] = useState(false);
  const [claim, setClaim] = useState<Extract<SignupPreview, { kind: "claim" }> | null>(null);

  async function finish() {
    armCoachNotices();
    holdLanding(false);
    enterApp();
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const next: Record<string, string | null> = {};
    if (!name.trim()) next.name = "Enter your name.";
    if (phone.replace(/\D/g, "").length < 10) next.phone = "Enter a cell phone.";
    next.email = clientEmailIssue(email);
    next.password = clientPasswordIssue(password);
    if (teamName.trim().length < 2) next.team = "What team do you coach?";
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setBusy(true);
    const normalized = email.trim().toLowerCase();
    try {
      const preview = await previewCoachSignup({ data: { email: normalized, phone } });
      if (preview.kind === "taken" || preview.kind === "conflict") {
        setErrors({ email: preview.message });
        setBusy(false);
        return;
      }
      if (preview.kind === "claim") {
        setClaim(preview);
        setBusy(false);
        return;
      }
      await checkSignupOpen({ data: { email: normalized, phone } });
      await signUpWithEmail(normalized, password, name.trim());
      await completeOnboarding({
        data: {
          role: "coach",
          name: name.trim(),
          phone,
          teamName: teamName.trim(),
          club: "",
        },
      });
      await finish();
    } catch (error) {
      setErrors({ password: credentialMessage(error) });
      setBusy(false);
    }
  }

  async function confirmClaim() {
    if (!claim || busy) return;
    setBusy(true);
    try {
      const claimed = await claimAddedCoach({
        data: {
          confirm: true,
          userId: claim.userId,
          email: email.trim().toLowerCase(),
          phone,
          password,
          name: name.trim(),
          club: "",
        },
      });
      await signInWithEmail(claimed.email, password);
      await finish();
    } catch (error) {
      setClaim(null);
      setErrors({ password: credentialMessage(error) });
      setBusy(false);
    }
  }

  if (claim) {
    return (
      <div>
        <h2 id="sign-in-sheet-title" className="font-display text-center text-2xl font-bold uppercase leading-tight text-white">
          This is your team — claim it
        </h2>
        <p className="mt-3 text-center text-sm font-semibold text-white">{claim.name || "Coach"}</p>
        {claim.teams.length === 0 ? (
          <p className="mt-1 text-center text-sm text-white/55">No team yet</p>
        ) : (
          claim.teams.map((team) => (
            <p key={`${team.name}-${team.ageGroup}`} className="mt-1 text-center text-sm text-white/70">
              {team.name} · {team.ageGroup}
            </p>
          ))
        )}
        <p className="mt-3 text-center text-sm text-white/55">Is this you?</p>
        <button
          type="button"
          disabled={busy}
          className="mt-4 flex h-12 w-full items-center justify-center rounded-xl text-base font-semibold disabled:opacity-60"
          style={{ backgroundColor: ACCENT, color: "#0E0F12" }}
          onClick={() => void confirmClaim()}
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "Yes, that's my team"}
        </button>
        <button
          type="button"
          className="mt-2 h-12 w-full text-sm text-white/70"
          disabled={busy}
          onClick={() => {
            setClaim(null);
            setErrors({ phone: "That phone is already on a coach we added. Use a different one, or ask the director to fix it." });
          }}
        >
          No, that's not me
        </button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={(event) => void onSubmit(event)}>
      <h2 id="sign-in-sheet-title" className="font-display text-center text-3xl font-bold uppercase leading-none text-white">
        Register your team
      </h2>
      <p className="mt-2 text-center text-sm text-white/55">Create the coach account, then hold the spot.</p>
      <div className="mt-6 space-y-4">
        <Field id={nameId} label="Name" error={errors.name}>
          <input id={nameId} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} />
        </Field>
        <Field id={phoneId} label="Cell phone" error={errors.phone}>
          <input
            id={phoneId}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={formatPhoneInput(phone)}
            onChange={(event) => setPhone(formatPhoneInput(event.target.value))}
            className={fieldClass}
          />
        </Field>
        <Field id={emailId} label="Email" error={errors.email}>
          <input
            id={emailId}
            type="email"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={fieldClass}
          />
        </Field>
        <Field id={passwordId} label="Password" error={errors.password}>
          <div className="relative">
            <input
              id={passwordId}
              type="text"
              name="new-password"
              autoComplete="new-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={showPassword ? `${fieldClass} pr-12` : passwordClass}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-1 top-0 grid h-12 w-11 place-items-center text-white/55"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </Field>
        <Field id={teamId} label="Team name" error={errors.team}>
          <input id={teamId} value={teamName} onChange={(event) => setTeamName(event.target.value)} className={fieldClass} />
        </Field>
        <button
          type="submit"
          disabled={busy}
          className="flex h-12 w-full items-center justify-center rounded-xl text-base font-semibold disabled:opacity-60"
          style={{ backgroundColor: ACCENT, color: "#0E0F12" }}
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create account"}
        </button>
      </div>
    </form>
  );
}

export function PublicSignInEntry() {
  const { user, isPending } = useCurrentUserState();

  useEffect(() => {
    if (isPending || user || sheetState.open) return;
    openSignInSheet({ entry: true, stay: !window.sessionStorage.getItem("pbi-return") });
  }, [isPending, user]);

  if (isPending) return <SessionSkeleton />;
  if (user) {
    const next = window.sessionStorage.getItem("pbi-return");
    if (next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/login") && !next.startsWith("/sign-in")) {
      window.sessionStorage.removeItem("pbi-return");
      window.location.replace(next);
      return <SessionSkeleton />;
    }
    return <Navigate to="/" />;
  }
  return <PublicLanding />;
}
