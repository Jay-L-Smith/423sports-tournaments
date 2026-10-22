import { useEffect, useState } from "react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { isStaleChunkError, forceFreshLoad, reloadForStaleChunk } from "@/lib/chunk-reload";

const FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return FALLBACK_MESSAGE;
}

export function AppErrorComponent({ error }: ErrorComponentProps) {
  const stale = isStaleChunkError(error);
  const [reloading, setReloading] = useState(stale);

  useEffect(() => {
    if (!stale) return;
    const started = reloadForStaleChunk();
    if (!started) setReloading(false);
  }, [stale]);

  return (
    <main
      className={
        "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center " +
        "bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50"
      }
    >
      <span className="text-red-500" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="text-lg font-semibold">{reloading ? "Updating the app" : "Something went wrong"}</h1>
      <p className="max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400">
        {reloading ? "A new version just went out. Reloading…" : errorMessage(error)}
      </p>
      {reloading ? null : (
        <button type="button" className="mt-2 text-sm font-semibold underline" onClick={() => forceFreshLoad()}>
          Reload
        </button>
      )}
    </main>
  );
}
