import { useEffect, useRef } from "react";

export function MouseTrail() {
  const trailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (trailRef.current) {
        trailRef.current.style.background = `radial-gradient(600px circle at ${e.clientX}px ${e.clientY}px, rgba(139, 92, 246, 0.15), transparent 40%)`;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
    return null;
  }

  return (
    <div 
      ref={trailRef}
      className="pointer-events-none fixed inset-0 z-[-1] opacity-60 mix-blend-screen transition-opacity duration-300"
    />
  );
}
