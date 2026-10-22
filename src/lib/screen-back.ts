let current = "";
let previous = "";

export function noteHref(href: string) {
  if (typeof window === "undefined" || !href || href === current) return;
  previous = current;
  current = href;
}

function isInsideTournament(href: string) {
  const path = pathOf(href);
  return path.startsWith("/weekends") || path.startsWith("/bracket");
}

/** Remember the screen that opened this event. A tournament opened from the event does not replace it. */
export function rememberOrigin(id: number) {
  const key = `pbi-back:${id}`;
  const from = previous;
  if (!from || isInsideTournament(from)) return;
  try {
    sessionStorage.setItem(key, from);
  } catch {
    /* private mode */
  }
}

export function originBack(id: number, fallback = "/") {
  rememberOrigin(id);
  try {
    const saved = sessionStorage.getItem(`pbi-back:${id}`);
    if (saved && !isInsideTournament(saved)) return saved;
  } catch {
    /* private mode */
  }
  return fallback;
}

function pathOf(href: string) {
  return href.split("?")[0].replace(/\/$/, "") || "/";
}

function openedFromHere(href: string, id: number) {
  const path = pathOf(href);
  return (
    !href ||
    path === "/weekends" ||
    path === `/weekends/${id}` ||
    path.startsWith(`/weekends/${id}/`) ||
    path === `/bracket/${id}`
  );
}

/** The screen that opened this tournament. Menus opened from the tournament do not move it. */
export function lockedBack(id: number, fallback: string) {
  const key = `pbi-back:${id}`;
  const from = previous;
  if (!openedFromHere(from, id)) {
    try {
      sessionStorage.setItem(key, from);
    } catch {
      /* private mode */
    }
    return from;
  }
  try {
    const saved = sessionStorage.getItem(key);
    if (saved && !openedFromHere(saved, id)) return saved;
  } catch {
    /* private mode */
  }
  return fallback;
}
