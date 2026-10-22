const KEY = "pbi-coach-notices";

export function armCoachNotices() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(KEY, "1");
}

export function coachNoticesArmed() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(KEY) === "1";
}

export function clearCoachNotices() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(KEY);
}
