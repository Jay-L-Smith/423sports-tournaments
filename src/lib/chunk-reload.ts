const KEY = "pbi-chunk-reload";

export function isStaleChunkError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message ?? "")
          : "";
  return (
    message.startsWith("Failed to fetch dynamically imported module") ||
    message.startsWith("error loading dynamically imported module") ||
    message.startsWith("Importing a module script failed") ||
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("reading 'component'")
  );
}

function freshUrl(): string {
  const url = new URL(window.location.href);
  url.searchParams.set("__fresh", String(Date.now()));
  return url.toString();
}

/** Load the document again, skipping a cached copy from the last publish. */
export function reloadForStaleChunk(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(KEY) === "1") return false;
    sessionStorage.setItem(KEY, "1");
  } catch {
    return false;
  }
  window.location.replace(freshUrl());
  return true;
}

export function forceFreshLoad() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* private mode */
  }
  window.location.replace(freshUrl());
}

/** After the new page stays up, drop the one-time reload lock. */
export function settleFreshLoad() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (url.searchParams.has("__fresh")) {
    url.searchParams.delete("__fresh");
    const next = url.pathname + url.search + url.hash;
    window.history.replaceState(window.history.state, "", next);
  }
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* private mode */
  }
}
