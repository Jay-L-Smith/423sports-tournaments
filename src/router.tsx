import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { isStaleChunkError, reloadForStaleChunk } from "@/lib/chunk-reload";
import { routeTree } from "./routeTree.gen";

if (typeof window !== "undefined") {
  const recover = (error: unknown) => {
    if (!isStaleChunkError(error)) return;
    reloadForStaleChunk();
  };
  window.addEventListener("unhandledrejection", (event) => recover(event.reason));
  window.addEventListener("error", (event) => recover(event.error ?? event.message));
}

export function getRouter() {
  return createRouter({ routeTree, defaultErrorComponent: AppErrorComponent });
}
