import { useEffect, useRef } from "react";

// Only render on pointer devices — touch screens don't fire mousemove
const isTouchDevice = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;

export function MouseTrail() {
  const trailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isTouchDevice()) return; // Skip on mobile — no-op cleanup is fine

    let lastMove = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastMove < 33) return; // throttle to ~30fps
      lastMove = now;
      if (trailRef.current) {
        trailRef.current.style.background = `radial-gradient(600px circle at ${e.clientX}px ${e.clientY}px, rgba(139, 92, 246, 0.15), transparent 40%)`;
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  if (isTouchDevice()) return null;

  return (
    <div
      ref={trailRef}
      className="pointer-events-none fixed inset-0 z-[-1] opacity-60 mix-blend-screen transition-opacity duration-300"
    />
  );
}
