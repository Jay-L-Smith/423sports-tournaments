import { useEffect, useState } from "react";

const KEY = "pbi-super-view";
const listeners = new Set<() => void>();

export type SuperView = "admin" | "coach";

let current: SuperView = "admin";
let booted = false;

function storedView(): SuperView {
  if (typeof window === "undefined") return "admin";
  return window.localStorage.getItem(KEY) === "coach" ? "coach" : "admin";
}

export function superuserView(): SuperView {
  if (typeof window === "undefined") return "admin";
  current = storedView();
  return current;
}

export function setSuperuserView(view: SuperView) {
  if (typeof window === "undefined") return;
  current = view;
  booted = true;
  window.localStorage.setItem(KEY, view);
  for (const listener of listeners) listener();
}

const COACH_KEY = "pbi-view-coach";

export function rememberedCoach(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(COACH_KEY) || "";
}

export function rememberCoach(userId: string) {
  if (typeof window === "undefined") return;
  if (userId) window.localStorage.setItem(COACH_KEY, userId);
  else window.localStorage.removeItem(COACH_KEY);
}

export function useSuperuserView(): { view: SuperView; ready: boolean } {
  const [view, setView] = useState<SuperView>(() => superuserView());
  const [ready, setReady] = useState(booted);
  useEffect(() => {
    booted = true;
    const sync = () => setView(superuserView());
    sync();
    setReady(true);
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);
  return { view, ready };
}
