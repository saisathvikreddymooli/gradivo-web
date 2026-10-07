import { useEffect, useRef } from "react";

type GlobePoint = {
  x: number;
  y: number;
  z: number;
};

const TARGET_LAND_POINTS = 1400;
const CANDIDATE_MULTIPLIER = 3;
const GOLDEN_ANGLE = 2.399963;
const TILT_X = -0.32;
const IDLE_VELOCITY = 0.0035;
const DRAG_FACTOR = 0.006;
const MAX_VELOCITY = 0.05;
const MAX_DPR = 2;

/**
 * Evenly distributed candidates on a unit sphere (Fibonacci lattice —
 * no pole bunching like a lat/lon grid).
 */
function buildCandidates(count: number): { point: GlobePoint; lat: number; lon: number }[] {
  const out: { point: GlobePoint; lat: number; lon: number }[] = [];
  for (let i = 0; i < count; i += 1) {
    const y = 1 - (i / count) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * GOLDEN_ANGLE;
    const point = { x: Math.cos(theta) * r, y, z: Math.sin(theta) * r };
    out.push({ point, lat: Math.asin(Math.max(-1, Math.min(1, y))), lon: theta });
  }
  return out;
}

/** Cheap 3-term noise carving abstract continents out of the lattice. */
function landScore(lat: number, lon: number): number {
  return (
    Math.sin(lat * 3.1) * Math.cos(lon * 2.2) +
    Math.sin(lon * 1.3 + 1.1) * Math.cos(lat * 1.7) +
    0.6 * Math.sin((lat + lon) * 4.3)
  );
}

function buildLandPoints(): GlobePoint[] {
  const candidates = buildCandidates(TARGET_LAND_POINTS * CANDIDATE_MULTIPLIER);
  const land: GlobePoint[] = [];
  for (const candidate of candidates) {
    if (land.length >= TARGET_LAND_POINTS) break;
    if (landScore(candidate.lat, candidate.lon) > 0.25) {
      land.push(candidate.point);
    }
  }
  return land;
}

/**
 * Indigo point Earth on Canvas 2D. No Three.js, WebGL, textures, or images.
 * Far-side points stay faintly visible (depth drives colour/opacity only).
 */
export default function ConnectGlobe() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const land = buildLandPoints();
    // Deterministic draw order buffer, re-sorted by depth every frame.
    const order = land.map((_, index) => index);

    let width = 0;
    let height = 0;
    let dpr = 1;
    let rotation = 0.6;
    let velocity = IDLE_VELOCITY;
    let dragging = false;
    let previousX = 0;
    let frame = 0;
    let running = true;

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return false;
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      return true;
    };

    const draw = () => {
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      if (land.length === 0) return;

      const cx = width / 2;
      const cy = height / 2;
      const size = Math.min(width, height);
      const radius = size * 0.36;
      const baseRadius = Math.max(1.1, Math.min(2.4, size / 300));

      // Soft indigo halo behind the sphere (theme-neutral, very subtle).
      const halo = context.createRadialGradient(cx, cy, radius * 0.4, cx, cy, radius * 1.7);
      halo.addColorStop(0, "rgba(79, 70, 229, 0.10)");
      halo.addColorStop(1, "rgba(79, 70, 229, 0)");
      context.fillStyle = halo;
      context.fillRect(0, 0, width, height);

      const cosR = Math.cos(rotation);
      const sinR = Math.sin(rotation);
      const cosT = Math.cos(TILT_X);
      const sinT = Math.sin(TILT_X);

      // Project once, then paint far-to-near. Far side is never culled.
      const projected: { sx: number; sy: number; depth: number; index: number }[] = new Array(
        land.length,
      );
      for (let i = 0; i < land.length; i += 1) {
        const point = land[i];
        const rx = point.x * cosR + point.z * sinR;
        const rz = -point.x * sinR + point.z * cosR;
        const ry = point.y * cosT - rz * sinT;
        const rz2 = point.y * sinT + rz * cosT;
        const depth = (rz2 + 1) / 2;
        const perspective = 0.86 + depth * 0.28;
        projected[i] = {
          sx: cx + rx * radius * perspective,
          sy: cy + ry * radius * perspective,
          depth,
          index: i,
        };
      }
      order.sort((a, b) => projected[a].depth - projected[b].depth);

      for (let k = 0; k < order.length; k += 1) {
        const item = projected[order[k]];
        const dotRadius = baseRadius * (0.45 + item.depth * 0.85);
        if (item.depth >= 0.5) {
          const alpha = 0.18 + item.depth * 0.72;
          context.fillStyle = `rgba(99, 102, 241, ${alpha.toFixed(3)})`;
        } else {
          const alpha = 0.06 + item.depth * 0.3;
          context.fillStyle = `rgba(191, 219, 254, ${alpha.toFixed(3)})`;
        }
        context.beginPath();
        context.arc(item.sx, item.sy, dotRadius, 0, Math.PI * 2);
        context.fill();
      }
    };

    const step = () => {
      if (!running) return;
      if (!dragging) {
        velocity += (IDLE_VELOCITY - velocity) * 0.02;
        rotation += velocity;
      }
      draw();
      frame = window.requestAnimationFrame(step);
    };

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      velocity = 0;
      previousX = event.clientX;
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is best-effort; dragging still works.
      }
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const dx = event.clientX - previousX;
      previousX = event.clientX;
      rotation += dx * DRAG_FACTOR;
      velocity = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, dx * DRAG_FACTOR));
      draw();
    };
    const onPointerUp = () => {
      dragging = false;
    };

    if (!resize()) return;
    if (reducedMotion) {
      draw();
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (!running) draw();
    });
    resizeObserver.observe(canvas);

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        running = false;
        window.cancelAnimationFrame(frame);
        return;
      }
      if (!running) {
        running = true;
        frame = window.requestAnimationFrame(step);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    frame = window.requestAnimationFrame(step);
    return () => {
      running = false;
      window.cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  return (
    <div className="connect-globe" aria-hidden="true">
      <canvas ref={canvasRef} className="connect-globe-canvas" />
    </div>
  );
}
