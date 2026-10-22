const OPEN = "pbi-coach-tour-open";
const DONE = "pbi-coach-tour-done";

function storageKey(userId: string) {
  return `pbi-coach-tour:${userId}`;
}

export function coachTourFinished(userId: string | undefined) {
  if (!userId || typeof window === "undefined") return true;
  return window.localStorage.getItem(storageKey(userId)) === "done";
}

export function markCoachTourFinished(userId: string) {
  window.localStorage.setItem(storageKey(userId), "done");
  window.dispatchEvent(new Event(DONE));
}

export function openCoachTour() {
  window.dispatchEvent(new Event(OPEN));
}

export function onCoachTourOpen(handler: () => void) {
  window.addEventListener(OPEN, handler);
  return () => window.removeEventListener(OPEN, handler);
}
