import { keepPreviousData, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { CoachTour } from "@/components/coach-tour";
import { InstallPrompt } from "@/components/install-prompt";
import { noteHref } from "@/lib/screen-back";
import { settleFreshLoad } from "@/lib/chunk-reload";
import appCss from "../styles.css?url";

const APP_NAME = "423Sports Tournaments";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=overlays-content" },
      { title: APP_NAME },
      { name: "theme-color", content: "#1c1c1c" },
      {
        name: "description",
        content: "Travel-ball tournament tools for parents, athletes, coaches, and directors.",
      },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Oxygen:wght@400;700&display=swap",
      },
    ],
  }),
  component: Root,
});

type GlobalQuery = typeof globalThis & { __pbiQueryClient__?: QueryClient };

function getQueryClient(): QueryClient {
  const g = globalThis as GlobalQuery;
  g.__pbiQueryClient__ ??= new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        refetchOnWindowFocus: false,
        placeholderData: keepPreviousData,
      },
    },
  });
  return g.__pbiQueryClient__;
}

function Root() {
  const href = useRouterState({ select: (state) => state.location.href });
  noteHref(href);
  const [queryClient] = useState(getQueryClient);
  useEffect(() => {
    const timer = window.setTimeout(settleFreshLoad, 2500);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    let active: HTMLElement | null = null;
    const isField = (node: EventTarget | null): node is HTMLElement =>
      node instanceof HTMLElement && node.matches("input, textarea, select");
    const lift = () => {
      if (!active || !active.isConnected) return;
      const scroller = active.closest("main");
      if (!(scroller instanceof HTMLElement)) return;
      const viewport = window.visualViewport;
      const visible = viewport?.height ?? window.innerHeight;
      const top = viewport?.offsetTop ?? 0;
      const covered = Math.max(0, window.innerHeight - visible - top);
      const splash = scroller.classList.contains("site-splash");
      if (splash) scroller.classList.add("is-typing");
      scroller.style.paddingBottom = `${Math.round(Math.max(covered, window.innerHeight * 0.5))}px`;
      const rect = active.getBoundingClientRect();
      const target = top + (splash ? 20 : Math.min(visible * 0.3, 140));
      const delta = rect.top - target;
      if (delta > 4) scroller.scrollTop += delta;
    };
    const onFocus = (event: FocusEvent) => {
      if (!isField(event.target)) return;
      active = event.target;
      requestAnimationFrame(lift);
      window.setTimeout(lift, 120);
      window.setTimeout(lift, 400);
      window.setTimeout(lift, 750);
    };
    const onBlur = () => {
      window.setTimeout(() => {
        if (isField(document.activeElement)) {
          active = document.activeElement;
          return;
        }
        active = null;
        document.querySelectorAll("main").forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          node.style.paddingBottom = "";
          node.classList.remove("is-typing");
        });
      }, 0);
    };
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", lift);
    viewport?.addEventListener("scroll", lift);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onBlur);
    return () => {
      viewport?.removeEventListener("resize", lift);
      viewport?.removeEventListener("scroll", lift);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onBlur);
    };
  }, []);
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <Outlet />
            <InstallPrompt />
            <CoachTour />
          </QueryClientProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
