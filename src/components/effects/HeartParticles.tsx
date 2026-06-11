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
  midnight: ["#ff69b4", "#ff1493", "#ff7676", "#ffb6c1", "#c084fc", "#e879f9"],
  rosegold: ["#fb7185", "#f43f5e", "#fda4af", "#ff1493", "#ec4899"],
  ocean: ["#60a5fa", "#3b82f6", "#93c5fd", "#38bdf8", "#00f0ff"],
  emerald: ["#34d399", "#22c55e", "#6ee7b7", "#a7f3d0", "#4ade80"],
};

function drawHeartPath(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  // Use a smaller width ratio (0.7) relative to size height to make it a slim, real heart
  const widthScale = 0.7;
  const topCleftY = y - size * 0.25;
  ctx.moveTo(x, topCleftY);
  
  // Left half of the heart
  ctx.bezierCurveTo(
    x - size * 0.4 * widthScale, y - size * 0.65, 
    x - size * widthScale, y - size * 0.2, 
    x - size * widthScale, y + size * 0.15
  );
  ctx.bezierCurveTo(
    x - size * widthScale, y + size * 0.5, 
    x - size * 0.45 * widthScale, y + size * 0.8, 
    x, y + size * 1.05
  );
  
  // Right half of the heart
  ctx.bezierCurveTo(
    x + size * 0.45 * widthScale, y + size * 0.8, 
    x + size * widthScale, y + size * 0.5, 
    x + size * widthScale, y + size * 0.15
  );
  ctx.bezierCurveTo(
    x + size * widthScale, y - size * 0.2, 
    x + size * 0.4 * widthScale, y - size * 0.65, 
    x, topCleftY
  );
  ctx.closePath();
}

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
    const count = 45; // Decreased count for a cleaner background
    const palette = themePalettes[theme] || themePalettes.midnight;
    for (let i = 0; i < count; i++) {
      ambientParticles.current.push({
        x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000),
        y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 1000),
        vy: -(Math.random() * 1.6 + 1.2), // moving faster
        size: Math.random() * 14 + 10, // 10px to 24px sizes
        color: palette[Math.floor(Math.random() * palette.length)],
        alpha: Math.random() * 0.45 + 0.45, // 0.45 to 0.90 opacity
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
        // Sway back and forth using a sine wave so they don't just move straight up
        p.x += Math.sin(p.y * 0.025 + p.size) * 0.5;

        if (p.y < -20) {
          p.y = canvas.height + 20;
          p.x = Math.random() * canvas.width;
        }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        
        // Draw the custom Bezier heart path
        drawHeartPath(ctx, p.x, p.y, p.size * 0.5);
        ctx.fill();
        
        // Add a subtle glowing white stroke core for a neon look
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();
        
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

          // Keep them breathing/swaying slightly while assembling
          p.x += Math.sin(p.elapsedTime * 0.006 + p.targetX) * 0.45;
          p.y += Math.cos(p.elapsedTime * 0.006 + p.targetY) * 0.45;

          if (p.elapsedTime >= 800) {
            p.phase = "explode";
            // Transition immediately to an elegant outward drift
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3.5 + 1.5;
            p.vx = Math.cos(angle) * speed;
            // Drift slightly upwards as they explode
            p.vy = Math.sin(angle) * speed - 0.6;
          }
        } else if (p.phase === "explode") {
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.025; // Fades out slightly quicker for performance
          if (p.alpha <= 0) return false;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 20;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        
        // Draw the custom Bezier heart path
        drawHeartPath(ctx, p.x, p.y, p.size * 0.5);
        ctx.fill();
        
        // White stroke overlay core for a neon burst glow
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
        
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
