import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

const createParticle = (x: number, y: number): Particle => {
  const angle = Math.random() * Math.PI * 2;
  const speed = Math.random() * 1.2 + 0.3;
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 0.2, // slight upward drift
    size: Math.random() * 2 + 1,
    color: Math.random() > 0.5 ? "rgba(168, 85, 247, 0.6)" : "rgba(236, 72, 153, 0.6)",
    alpha: 1,
  };
};

export function MouseTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastMoveTime = useRef(0);
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // DO NOT mount on touch devices — they have no mousemove
    if (window.matchMedia("(hover: none)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Resize handler
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    // Throttled mousemove — max 30 events/second
    const handleMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastMoveTime.current < 33) return; // 33ms = ~30fps
      lastMoveTime.current = now;
      mousePos.current = { x: e.clientX, y: e.clientY };

      // Spawn max 3 particles per event
      if (particles.current.length < 60) {
        for (let i = 0; i < 3; i++) {
          particles.current.push(createParticle(e.clientX, e.clientY));
        }
      }
    };

    // Single rAF loop
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.current = particles.current.filter((p) => p.alpha > 0.01);
      particles.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04; // gravity
        p.alpha -= 0.025;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    rafRef.current = requestAnimationFrame(draw);

    // CRITICAL — cleanup everything on unmount
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      particles.current = [];
    };
  }, []);

  // Don't render canvas on touch/mobile devices
  if (typeof window !== "undefined" && window.matchMedia("(hover: none)").matches) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 5 }}
    />
  );
}
