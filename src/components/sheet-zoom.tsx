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
  const drag = useRef<{ id: number; x: number; y: number; tx: number; ty: number } | null>(null);
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

  const fit = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const { sw, sh } = measure();
    const pad = 10;
    const vw = Math.max(vp.clientWidth - pad * 2, 1);
    const vh = Math.max(vp.clientHeight - pad * 2, 1);
    const next = clamp(Math.min(vw / sw, vh / sh), MIN_SCALE, 1);
    setScale(next);
    setTx(Math.max((vp.clientWidth - sw * next) / 2, pad));
    setTy(pad);
    fitRef.current = true;
  }, [measure]);

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
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(extra);
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
      setTx((x) => px - (px - x) * ratio);
      setTy((y) => py - (py - y) * ratio);
      return next;
    });
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 1) {
      drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, tx, ty };
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
      setTx(pinch.current.cx - (pinch.current.cx - pinch.current.tx) * ratio);
      setTy(pinch.current.cy - (pinch.current.cy - pinch.current.ty) * ratio);
      return;
    }
    const d = drag.current;
    if (!d || event.pointerId !== d.id) return;
    fitRef.current = false;
    setTx(d.tx + (event.clientX - d.x));
    setTy(d.ty + (event.clientY - d.y));
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
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
            setTx((x) => x - event.deltaX);
            setTy((y) => y - event.deltaY);
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
