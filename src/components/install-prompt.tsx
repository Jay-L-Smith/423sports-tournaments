import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

const DAY_KEY = "pbi-install-day-423";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function standalone() {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || window.matchMedia("(display-mode: fullscreen)").matches || nav.standalone === true;
}

function iphone() {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function parentLink() {
  const params = new URLSearchParams(window.location.search);
  return window.location.pathname.startsWith("/bracket/") && params.get("live") === "1";
}

function today() {
  return new Date().toDateString();
}

function askedToday() {
  return window.localStorage.getItem(DAY_KEY) === today();
}

function markAsked() {
  window.localStorage.setItem(DAY_KEY, today());
}

export function InstallPrompt() {
  const href = useRouterState({ select: (state) => state.location.href });
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [ios, setIos] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      if (standalone() || parentLink()) return;
      event.preventDefault();
      setDeferred(event as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  useEffect(() => {
    if (standalone()) {
      setOpen(false);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const forced = params.get("previewInstall");
    if (forced === "iphone" || forced === "android") {
      setPreview(true);
      setIos(forced === "iphone");
      setOpen(true);
      return;
    }
    if (parentLink()) {
      setOpen(false);
      return;
    }
    if (askedToday()) return;
    setIos(iphone());
    const timer = window.setTimeout(() => {
      if (standalone() || parentLink()) return;
      markAsked();
      setOpen(true);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [href]);

  function close() {
    setOpen(false);
  }

  async function install() {
    if (!deferred) return;
    setOpen(false);
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  if (!open) return null;

  return (
    <div className="install-banner fixed inset-x-3 top-[max(0.6rem,env(safe-area-inset-top))] z-[90] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-black/10 bg-white px-3 py-2.5 text-[#1a1a1a] shadow-[0_10px_30px_rgb(0_0_0/0.28)]">
      <img src="/__grok/icon-192.png" alt="" className="h-11 w-11 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p id="install-title" className="truncate text-sm font-semibold">
          {ios ? "Add 423Sports" : "Install 423Sports"}
        </p>
        <p className="truncate text-xs text-[#5c5c5c]">
          {ios ? (
            <>
              Tap <ShareMark /> then Add to Home Screen
            </>
          ) : (
            "Opens from your home screen"
          )}
        </p>
      </div>
      {ios ? null : (
        <button type="button" className="shrink-0 text-sm font-semibold text-[#1a73e8]" onClick={() => void install()}>
          Install
        </button>
      )}
      <button type="button" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-lg leading-none text-[#666]" aria-label="Not now" onClick={close}>
        ×
      </button>
    </div>
  );
}

function ShareMark() {
  return (
    <span className="mx-0.5 inline-grid h-4 w-4 translate-y-[2px] place-items-center rounded bg-[#1a1a1a] text-white" aria-hidden>
      <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 16V4" />
        <path d="M7.5 8.5 12 4l4.5 4.5" />
        <path d="M6 10.5H5a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6.5a2 2 0 0 0-2-2h-1" />
      </svg>
    </span>
  );
}
