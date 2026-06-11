import { useEffect, useRef } from "react";

interface HeartParticlesProps {
  scene: number;
  burstTrigger: { x: number; y: number; time: number } | null;
  theme?: string;
}

interface BurstParticle {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  elapsedTime: number;
  phase: "assemble" | "explode";
}

interface AmbientParticle {
  x: number;
  y: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

const themePalettes: Record<string, string[]> = {
  midnight: ["#ff69b4", "#ff1493", "#ff6b6b", "#ffb6c1"],
  rosegold: ["#fb7185", "#be123c", "#fda4af", "#ff1493"],
  ocean: ["#60a5fa", "#1d4ed8", "#93c5fd", "#38bdf8"],
  emerald: ["#34d399", "#065f46", "#6ee7b7", "#a7f3d0"],
};

export default function HeartParticles({ scene, burstTrigger, theme = "midnight" }: HeartParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Particle lists
  const burstParticles = useRef<BurstParticle[]>([]);
  const ambientParticles = useRef<AmbientParticle[]>([]);
  
  // White flash state
  const flashAlpha = useRef(0);
  const lastTime = useRef(0);

  // Initialize ambient particles once
  useEffect(() => {
    ambientParticles.current = [];
    const count = 120; // Increased to 120 for a much richer background
    const palette = themePalettes[theme] || themePalettes.midnight;
    for (let i = 0; i < count; i++) {
      ambientParticles.current.push({
        x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000),
        y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 1000),
        vy: -(Math.random() * 0.5 + 0.25), // slightly faster drift: -0.25 to -0.75
        size: Math.random() * 16 + 12, // 12px to 28px font size for better visibility
        color: palette[Math.floor(Math.random() * palette.length)],
        alpha: Math.random() * 0.4 + 0.45, // 0.45 to 0.85 opacity (much brighter)
      });
    }
  }, [theme]);

  // Handle burst triggers (Mode B)
  useEffect(() => {
    if (!burstTrigger) return;
    const { x, y } = burstTrigger;
    const palette = themePalettes[theme] || themePalettes.midnight;

    // Trigger white flash (opacity 0.4)
    flashAlpha.current = 0.4;

    // Compute parametric heart coordinates
    const scale = 8;
    const burstCount = 100;
    const newBurstParticles: BurstParticle[] = [];

    for (let i = 0; i < burstCount; i++) {
      const t = (i / burstCount) * Math.PI * 2;
      
      // Parametric formula
      const dx = 16 * Math.pow(Math.sin(t), 3) * scale;
      const dy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * scale;

      const size = Math.random() * 8 + 12; // 12px to 20px
      newBurstParticles.push({
        startX: x,
        startY: y,
        targetX: x + dx,
        targetY: y + dy,
        x,
        y,
        vx: 0,
        vy: 0,
        size,
        color: palette[Math.floor(Math.random() * palette.length)],
        alpha: 1.0,
        elapsedTime: 0,
        phase: "assemble",
      });
    }

    // Append to existing bursts
    burstParticles.current = [...burstParticles.current, ...newBurstParticles];
  }, [burstTrigger, theme]);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let animationId: number;

    const updateAndDraw = (timestamp: number) => {
      if (!lastTime.current) lastTime.current = timestamp;
      const dt = timestamp - lastTime.current;
      lastTime.current = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render Ambient Hearts (Mode C) in all scenes automatically
      ambientParticles.current.forEach((p) => {
        p.y += p.vy;
        if (p.y < -20) {
          p.y = canvas.height + 20;
          p.x = Math.random() * canvas.width;
        }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.font = `${p.size}px serif`;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.fillText("♥", p.x, p.y);
        ctx.restore();
      });

      // Render Heart Bursts (Mode B)
      burstParticles.current = burstParticles.current.filter((p) => {
        p.elapsedTime += dt;

        if (p.phase === "assemble") {
          const progress = Math.min(p.elapsedTime / 800, 1.0);
          // Ease-out cubic formula
          const ease = 1 - Math.pow(1 - progress, 3);
          
          p.x = p.startX + (p.targetX - p.startX) * ease;
          p.y = p.startY + (p.targetY - p.startY) * ease;

          if (p.elapsedTime >= 1200) {
            p.phase = "explode";
            // Generate random explosion velocity
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 2;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
          }
        } else if (p.phase === "explode") {
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.02; // Fades out gradually
          if (p.alpha <= 0) return false;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.font = `${p.size}px serif`;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.fillText("♥", p.x, p.y);
        ctx.restore();
        return true;
      });

      // Render White Flash Overlay (Mode B trigger effect)
      if (flashAlpha.current > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha.current})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        flashAlpha.current -= dt / 500;
      }

      animationId = requestAnimationFrame(updateAndDraw);
    };

    animationId = requestAnimationFrame((t) => {
      lastTime.current = t;
      updateAndDraw(t);
    });

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [scene]);

  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 mix-blend-screen"
      style={{ opacity: 0.9 }}
    />
  );
}
