import { useCallback, useEffect, useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from "react";
import { cn } from "@/lib/utils";

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
    let next = 1;
    let roundTop = 0;
    if (landscape) {
      next = clamp(Math.min(vw / sw, vh / sh), MIN_SCALE, 1);
    } else {
      const round = el.querySelector(".line-round") as HTMLElement | null;
      let roundRight = 0;
      if (round) {
        let x = 0;
        let y = 0;
        let cur: HTMLElement | null = round;
        while (cur && cur !== el) {
          x += cur.offsetLeft;
          y += cur.offsetTop;
          cur = cur.offsetParent as HTMLElement | null;
        }
        roundRight = x + round.offsetWidth;
        roundTop = y;
      }
      const targetW = roundRight > 40 ? roundRight + 8 : sw;
      const targetH = round && round.offsetHeight > 40 ? round.offsetHeight : sh;
      next = clamp(Math.min(vw / targetW, vh / targetH), MIN_SCALE, MAX_SCALE);
    }
    const originX = landscape ? Math.max((vp.clientWidth - sw * next) / 2, pad) : pad;
    const originY = landscape ? Math.max((vp.clientHeight - sh * next) / 2, pad) : pad - roundTop * next;
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
    if (tap) event.preventDefault();
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 1) {
      drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, tx, ty, moved: false, tap };
      (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
    } else if (pointers.current.size === 2) {
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
    }
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
    d.moved = true;
    fitRef.current = false;
    const pan = clampPan(d.tx + dx, d.ty + dy, scale);
    setTx(pan.tx);
    setTy(pan.ty);
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (d?.id === event.pointerId && !d.moved && d.tap) d.tap.click();
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
          style={{ transform: `translate(${tx}px, ${ty}px) scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
