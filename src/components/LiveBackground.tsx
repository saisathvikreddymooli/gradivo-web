import { useEffect, useMemo, useRef } from "react";

type Particle = {
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  opacity: number;
};

/** Deterministic PRNG soSSR/markup stays stable between renders. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildParticles(count: number, seed: number): Particle[] {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, () => ({
    left: rand() * 100,
    top: rand() * 100,
    size: 1 + rand() * 2.2,
    duration: 9 + rand() * 14,
    delay: -rand() * 20,
    drift: 12 + rand() * 30,
    opacity: 0.12 + rand() * 0.3,
  }));
}

const DUST = [
  { left: "12%", top: "28%", size: 180, duration: "34s", delay: "-6s" },
  { left: "78%", top: "18%", size: 220, duration: "40s", delay: "-14s" },
  { left: "62%", top: "68%", size: 200, duration: "30s", delay: "-10s" },
  { left: "28%", top: "76%", size: 160, duration: "36s", delay: "-3s" },
  { left: "48%", top: "44%", size: 240, duration: "28s", delay: "-18s" },
];

/**
 * Global cinematic background: pure-black base, slow blue aurora orbs,
 * drifting particles, floating dust, moving grid, pulsing center glow and
 * a lagging cursor light. Fixed, pointer-transparent, always behind content.
 */
export default function LiveBackground() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const particles = useMemo(() => buildParticles(64, 20260923), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(hover: none)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const node = cursorRef.current;
    if (!node) return;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 3;
    let tx = x;
    let ty = y;
    let raf = 0;
    const onMove = (event: MouseEvent) => {
      tx = event.clientX;
      ty = event.clientY;
    };
    const tick = () => {
      x += (tx - x) * 0.055;
      y += (ty - y) * 0.055;
      node.style.transform = `translate(${x - 320}px, ${y - 320}px)`;
      raf = window.requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    raf = window.requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="live-wallpaper" aria-hidden="true">
      <div className="live-base" />
      <div className="live-orb live-orb-1" />
      <div className="live-orb live-orb-2" />
      <div className="live-orb live-orb-3" />
      <div className="live-orb live-orb-4" />
      <div className="live-center" />
      <div className="live-grid" />
      {DUST.map((dust, index) => (
        <div
          key={index}
          className="live-dust"
          style={{
            left: dust.left,
            top: dust.top,
            width: dust.size,
            height: dust.size,
            animationDuration: dust.duration,
            animationDelay: dust.delay,
          }}
        />
      ))}
      {particles.map((particle, index) => (
        <span
          key={index}
          className="live-particle"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
            ["--drift" as string]: `${particle.drift}px`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
      <div ref={cursorRef} className="live-cursor" />
    </div>
  );
}
