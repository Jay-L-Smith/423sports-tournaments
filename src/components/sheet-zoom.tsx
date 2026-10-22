import { useCallback, useEffect, useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from "react";
import { cn } from "@/lib/utils";

function useBlockBrowserPinch() {
  useEffect(() => {
    const block = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault();
    };
    document.addEventListener("touchmove", block, { passive: false });
    return () => document.removeEventListener("touchmove", block);
  }, []);
}
const MIN_SCALE = 0.04;
const MAX_SCALE = 2.8;

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export function SheetZoom({
  children,
  className,
  resetKey,
}: {
  children: ReactNode;
  className?: string;
  resetKey?: string | number;
}) {
  useBlockBrowserPinch();
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const fitRef = useRef(true);
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    tx: number;
    ty: number;
    moved: boolean;
    tap: HTMLElement | null;
  } | null>(null);
  const pinch = useRef<{ dist: number; scale: number; tx: number; ty: number; cx: number; cy: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());

  const measure = useCallback(() => {
    const el = contentRef.current;
    if (!el) return { sw: 1, sh: 1 };
    const child = el.firstElementChild as HTMLElement | null;
    const sw = Math.max(el.scrollWidth, el.offsetWidth, child?.scrollWidth ?? 0, child?.offsetWidth ?? 0, 1);
    const sh = Math.max(el.scrollHeight, el.offsetHeight, child?.scrollHeight ?? 0, child?.offsetHeight ?? 0, 1);
    return { sw, sh };
  }, []);

  const clampPan = useCallback(
    (nextTx: number, nextTy: number, nextScale: number) => {
      const vp = viewportRef.current;
      const { sw, sh } = measure();
      if (!vp) return { tx: nextTx, ty: nextTy };
      const pad = 10;
      const vw = vp.clientWidth;
      const vh = vp.clientHeight;
      const cw = sw * nextScale;
      const ch = sh * nextScale;
      const maxTx = pad;
      const minTx = cw + pad * 2 <= vw ? Math.max((vw - cw) / 2, pad) : vw - cw - pad;
      const maxTy = pad;
      const minTy = ch + pad * 2 <= vh ? pad : vh - ch - pad;
      return {
        tx: clamp(nextTx, Math.min(minTx, maxTx), Math.max(minTx, maxTx)),
        ty: clamp(nextTy, Math.min(minTy, maxTy), Math.max(minTy, maxTy)),
      };
    },
    [measure],
  );

  const fit = useCallback(() => {
    const vp = viewportRef.current;
    const el = contentRef.current;
    if (!vp || !el) return;
    const { sw, sh } = measure();
    const pad = 10;
    const vw = Math.max(vp.clientWidth - pad * 2, 1);
    const vh = Math.max(vp.clientHeight - pad * 2, 1);
    const landscape = window.matchMedia("(orientation: landscape)").matches;
    const pool = el.querySelector(".pool-sheet") as HTMLElement | null;
    const round = el.querySelector(".line-round") as HTMLElement | null;
    const target =
      pool && pool.offsetWidth > 80
        ? pool.offsetWidth
        : round && round.offsetWidth > 80
          ? round.offsetWidth + 16
          : Math.min(sw, vw);
    let next = clamp(vw / target, MIN_SCALE, 1);
    if (landscape) next = clamp(Math.min(next, vh / Math.max(pool?.offsetHeight || sh, 1)), MIN_SCALE, 1);
    if (next > 0.92) next = 1;
    const originX = Math.max((vp.clientWidth - sw * next) / 2, pad);
    const originY = pad;
    const pan = clampPan(originX, originY, next);
    setScale(next);
    setTx(pan.tx);
    setTy(pan.ty);
    fitRef.current = true;
  }, [clampPan, measure]);

  useEffect(() => {
    fitRef.current = true;
    let frames = 0;
    let raf = 0;
    const tick = () => {
      fit();
      frames += 1;
      if (frames < 4) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const extra = window.setTimeout(fit, 180);
    const mq = window.matchMedia("(orientation: landscape)");
    const onOrient = () => {
      fitRef.current = true;
      fit();
    };
    mq.addEventListener("change", onOrient);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(extra);
      mq.removeEventListener("change", onOrient);
    };
  }, [fit, resetKey]);

  useEffect(() => {
    const vp = viewportRef.current;
    const el = contentRef.current;
    if (!vp || !el) return;
    const ro = new ResizeObserver(() => {
      if (fitRef.current) fit();
    });
    ro.observe(vp);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, [fit, resetKey]);

  function zoomBy(factor: number, cx?: number, cy?: number) {
    const vp = viewportRef.current;
    if (!vp) return;
    fitRef.current = false;
    const rect = vp.getBoundingClientRect();
    const px = cx == null ? rect.width / 2 : cx - rect.left;
    const py = cy == null ? rect.height / 2 : cy - rect.top;
    setScale((current) => {
      const next = clamp(current * factor, MIN_SCALE, MAX_SCALE);
      const ratio = next / current;
      const pan = clampPan(px - (px - tx) * ratio, py - (py - ty) * ratio, next);
      setTx(pan.tx);
      setTy(pan.ty);
      return next;
    });
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const hit = event.target as HTMLElement | null;
    if (hit?.closest("input, select, textarea, [role='dialog']")) return;
    const tap = hit?.closest("button, a") as HTMLElement | null;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const view = event.currentTarget as HTMLDivElement;
    if (!tap) {
      event.preventDefault();
      view.setPointerCapture(event.pointerId);
    }
    if (pointers.current.size >= 2) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const vp = viewportRef.current?.getBoundingClientRect();
      pinch.current = {
        dist: Math.max(dist, 1),
        scale,
        tx,
        ty,
        cx: vp ? (pts[0].x + pts[1].x) / 2 - vp.left : 0,
        cy: vp ? (pts[0].y + pts[1].y) / 2 - vp.top : 0,
      };
      drag.current = null;
      return;
    }
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, tx, ty, moved: false, tap };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (pointers.current.has(event.pointerId)) {
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }
    if (pinch.current && pointers.current.size >= 2) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const next = clamp(pinch.current.scale * (dist / pinch.current.dist), MIN_SCALE, MAX_SCALE);
      const ratio = next / pinch.current.scale;
      fitRef.current = false;
      setScale(next);
      const pan = clampPan(
        pinch.current.cx - (pinch.current.cx - pinch.current.tx) * ratio,
        pinch.current.cy - (pinch.current.cy - pinch.current.ty) * ratio,
        next,
      );
      setTx(pan.tx);
      setTy(pan.ty);
      return;
    }
    const d = drag.current;
    if (!d || event.pointerId !== d.id) return;
    const dx = event.clientX - d.x;
    const dy = event.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 8) return;
    if (!d.moved && d.tap) {
      d.tap.addEventListener(
        "click",
        (clickEvent) => {
          clickEvent.preventDefault();
          clickEvent.stopPropagation();
        },
        { capture: true, once: true },
      );
    }
    d.moved = true;
    fitRef.current = false;
    const pan = clampPan(d.tx + dx, d.ty + dy, scale);
    setTx(pan.tx);
    setTy(pan.ty);
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (d?.id === event.pointerId && !d.moved && d.tap && event.currentTarget.hasPointerCapture(event.pointerId)) d.tap.click();
    pointers.current.delete(event.pointerId);
    if (drag.current?.id === event.pointerId) drag.current = null;
    if (pointers.current.size < 2) pinch.current = null;
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div
        ref={viewportRef}
        className="sheet-zoom-view"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={(event) => {
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            fitRef.current = false;
            const pan = clampPan(tx - event.deltaX, ty - event.deltaY, scale);
            setTx(pan.tx);
            setTy(pan.ty);
            return;
          }
          event.preventDefault();
          zoomBy(event.deltaY < 0 ? 1.12 : 1 / 1.12, event.clientX, event.clientY);
        }}
      >
        <div
          ref={contentRef}
          className="sheet-zoom-inner"
          style={{
            transform:
              scale === 1
                ? `translate(${Math.round(tx)}px, ${Math.round(ty)}px)`
                : `translate(${tx}px, ${ty}px) scale(${scale})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function BodyZoom({
  header,
  children,
  spread = 1,
}: {
  header: ReactNode;
  children: ReactNode;
  spread?: number;
}) {
  useBlockBrowserPinch();
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const shiftRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [layoutWidth, setLayoutWidth] = useState(0);
  const drag = useRef<{ id: number; x: number; y: number; tx: number; ty: number; moved: boolean; tap: HTMLElement | null } | null>(null);
  const pinch = useRef<{ dist: number; scale: number; tx: number; ty: number; cx: number; cy: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const frame = useRef({ scale, tx, ty });
  frame.current = { scale, tx, ty };

  const measure = useCallback(() => {
    const el = contentRef.current;
    if (!el) return { sw: 1, sh: 1 };
    return { sw: Math.max(el.scrollWidth, el.offsetWidth, 1), sh: Math.max(el.scrollHeight, el.offsetHeight, 1) };
  }, []);

  const clampPan = useCallback(
    (nextTx: number, nextTy: number, nextScale: number) => {
      const vp = viewportRef.current;
      const { sw, sh } = measure();
      if (!vp) return { tx: nextTx, ty: nextTy };
      const pad = 8;
      const vw = vp.clientWidth;
      const vh = vp.clientHeight;
      const cw = sw * nextScale;
      const ch = sh * nextScale;
      const maxTx = pad;
      const minTx = cw + pad <= vw ? 0 : vw - cw - pad;
      const maxTy = pad;
      const minTy = ch + pad <= vh ? 0 : vh - ch - pad;
      return {
        tx: clamp(nextTx, Math.min(minTx, maxTx), Math.max(minTx, maxTx)),
        ty: clamp(nextTy, Math.min(minTy, maxTy), Math.max(minTy, maxTy)),
      };
    },
    [measure],
  );

  const syncHeader = useCallback(() => {
    const shift = shiftRef.current;
    if (!shift) return;
    shift.style.width = "100%";
    shift.style.transform = "none";
    shift.querySelectorAll("th").forEach((head) => {
      head.style.width = "";
      head.style.minWidth = "";
      head.style.maxWidth = "";
    });
  }, []);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const apply = () => setLayoutWidth(Math.max(1, Math.round(vp.clientWidth * spread)));
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(vp);
    return () => ro.disconnect();
  }, [spread]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    syncHeader();
    const ro = new ResizeObserver(() => syncHeader());
    ro.observe(content);
    return () => ro.disconnect();
  }, [syncHeader, layoutWidth]);

  useEffect(() => {
    const id = requestAnimationFrame(syncHeader);
    return () => cancelAnimationFrame(id);
  }, [scale, tx, ty, syncHeader]);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const hit = event.target as HTMLElement | null;
    if (hit?.closest("input, select, textarea, [role='dialog']")) return;
    const tap = hit?.closest("button, a") as HTMLElement | null;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const view = event.currentTarget as HTMLDivElement;
    if (!tap) {
      event.preventDefault();
      view.setPointerCapture(event.pointerId);
    }
    if (pointers.current.size >= 2) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const vp = viewportRef.current?.getBoundingClientRect();
      const now = frame.current;
      pinch.current = {
        dist: Math.max(dist, 1),
        scale: now.scale,
        tx: now.tx,
        ty: now.ty,
        cx: vp ? (pts[0].x + pts[1].x) / 2 - vp.left : 0,
        cy: vp ? (pts[0].y + pts[1].y) / 2 - vp.top : 0,
      };
      drag.current = null;
      return;
    }
    const now = frame.current;
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, tx: now.tx, ty: now.ty, moved: false, tap };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (pointers.current.has(event.pointerId)) {
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }
    if (pinch.current && pointers.current.size >= 2) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const next = clamp(pinch.current.scale * (dist / pinch.current.dist), MIN_SCALE, MAX_SCALE);
      const ratio = next / pinch.current.scale;
      const pan = clampPan(
        pinch.current.cx - (pinch.current.cx - pinch.current.tx) * ratio,
        pinch.current.cy - (pinch.current.cy - pinch.current.ty) * ratio,
        next,
      );
      setScale(next);
      setTx(pan.tx);
      setTy(pan.ty);
      return;
    }
    const d = drag.current;
    if (!d || event.pointerId !== d.id) return;
    const dx = event.clientX - d.x;
    const dy = event.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 8) return;
    if (!d.moved && d.tap) {
      d.tap.addEventListener("click", (clickEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
      }, { capture: true, once: true });
    }
    d.moved = true;
    const pan = clampPan(d.tx + dx, d.ty + dy, frame.current.scale);
    setTx(pan.tx);
    setTy(pan.ty);
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (d?.id === event.pointerId && !d.moved && d.tap && event.currentTarget.hasPointerCapture(event.pointerId)) d.tap.click();
    pointers.current.delete(event.pointerId);
    if (drag.current?.id === event.pointerId) drag.current = null;
    if (pointers.current.size < 2) pinch.current = null;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="body-zoom-head shrink-0 overflow-hidden">
        <div ref={shiftRef} className="w-full">{header}</div>
      </div>
      <div
        ref={viewportRef}
        className="sheet-zoom-view"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          ref={contentRef}
          className="sheet-zoom-inner"
          style={{
            width: layoutWidth || "100%",
            transform: scale === 1 ? `translate(${Math.round(tx)}px, ${Math.round(ty)}px)` : `translate(${tx}px, ${ty}px) scale(${scale})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
