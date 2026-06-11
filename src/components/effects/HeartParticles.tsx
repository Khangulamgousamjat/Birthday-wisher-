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
  baseSpeedY: number;
  speedY: number;
  speedX: number;
  size: number;
  color: string;
  alpha: number;
  swaySpeed: number;
  swayAmount: number;
  seed: number;
}

const themePalettes: Record<string, string[]> = {
  midnight: ["#ff69b4", "#ff1493", "#ff7676", "#ffb6c1", "#c084fc", "#e879f9"],
  rosegold: ["#fb7185", "#f43f5e", "#fda4af", "#ff1493", "#ec4899"],
  ocean: ["#60a5fa", "#3b82f6", "#93c5fd", "#38bdf8", "#00f0ff"],
  emerald: ["#34d399", "#22c55e", "#6ee7b7", "#a7f3d0", "#4ade80"],
};

// Helper to convert hex to RGBA base string
function hexToRgbaBase(hex: string): string {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, `;
}

// Function to draw a perfect heart path
function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  const topCurveHeight = size * 0.3;
  
  // Start at the top center cleft of the heart
  ctx.moveTo(x, y + topCurveHeight);
  
  // Top left curve
  ctx.bezierCurveTo(
    x, y, 
    x - size / 2, y, 
    x - size / 2, y + topCurveHeight
  );
  
  // Bottom left curve
  ctx.bezierCurveTo(
    x - size / 2, y + (size + topCurveHeight) / 2, 
    x, y + (size + topCurveHeight) / 2, 
    x, y + size
  );
  
  // Bottom right curve
  ctx.bezierCurveTo(
    x, y + (size + topCurveHeight) / 2, 
    x + size / 2, y + (size + topCurveHeight) / 2, 
    x + size / 2, y + topCurveHeight
  );
  
  // Top right curve
  ctx.bezierCurveTo(
    x + size / 2, y, 
    x, y, 
    x, y + topCurveHeight
  );
  
  ctx.closePath();
}

export default function HeartParticles({ scene, burstTrigger, theme = "midnight" }: HeartParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Particle lists
  const burstParticles = useRef<BurstParticle[]>([]);
  const ambientParticles = useRef<AmbientParticle[]>([]);
  
  // Mouse position tracking (Dodging interaction)
  const mouse = useRef({ x: -1000, y: -1000 });
  const INTERACTION_RADIUS = 120; // How far the mouse pushes bubbles

  // White flash state
  const flashAlpha = useRef(0);
  const lastTime = useRef(0);

  // Helper to reset/initialize a single ambient particle
  const resetAmbientParticle = (p: AmbientParticle, initial = false) => {
    p.size = Math.random() * 20 + 15; // Heart bubble size
    p.x = Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000);
    p.y = initial 
      ? Math.random() * (typeof window !== "undefined" ? window.innerHeight : 1000) 
      : (typeof window !== "undefined" ? window.innerHeight : 1000) + p.size + Math.random() * 100;
    
    p.baseSpeedY = Math.random() * 1.5 + 0.5;
    p.speedY = p.baseSpeedY;
    p.speedX = 0;
    p.swaySpeed = Math.random() * 0.03 + 0.01;
    p.swayAmount = Math.random() * 1.5 + 0.5;
    p.seed = Math.random() * Math.PI * 2;
    p.alpha = Math.random() * 0.4 + 0.4; // 0.4 to 0.8 opacity

    const palette = themePalettes[theme] || themePalettes.midnight;
    p.color = palette[Math.floor(Math.random() * palette.length)];
  };

  // Initialize ambient particles once
  useEffect(() => {
    ambientParticles.current = [];
    const count = 75; // Adjust for romantic density
    for (let i = 0; i < count; i++) {
      const p = {} as AmbientParticle;
      resetAmbientParticle(p, true);
      ambientParticles.current.push(p);
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

    // Mouse and touch listeners to track cursor
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.current.x = e.touches[0].clientX;
        mouse.current.y = e.touches[0].clientY;
      }
    };

    const handleMouseLeave = () => {
      mouse.current.x = -1000;
      mouse.current.y = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("touchcancel", handleMouseLeave);
    window.addEventListener("touchend", handleMouseLeave);

    let animationId: number;

    const updateAndDraw = (timestamp: number) => {
      if (!lastTime.current) lastTime.current = timestamp;
      const dt = timestamp - lastTime.current;
      lastTime.current = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render Ambient Hearts (Mode C) in all scenes automatically
      ambientParticles.current.forEach((p) => {
        // Apply normal floating physics
        p.y -= p.speedY;
        
        // Base swaying motion
        const sway = Math.sin(p.seed) * p.swayAmount;
        p.x += sway + p.speedX;
        p.seed += p.swaySpeed;

        // Mouse/Touch Interaction (Dodging)
        const dx = p.x - mouse.current.x;
        // Adjust Y calculation slightly because the heart path is offset
        const dy = (p.y + p.size / 2) - mouse.current.y; 
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < INTERACTION_RADIUS) {
          const force = (INTERACTION_RADIUS - distance) / INTERACTION_RADIUS;
          // Push bubbles away from cursor
          p.speedX += (dx / distance) * force * 0.5;
          p.y -= (dy / distance) * force * 0.5; 
        }

        // Friction to gradually stop dodging and return to normal float
        p.speedX *= 0.95;
        p.speedY = p.baseSpeedY + (p.speedY - p.baseSpeedY) * 0.95;

        // Reset bubble if it floats off the top
        if (p.y < -p.size - 50) {
          resetAmbientParticle(p, false);
        }

        // Keep within horizontal bounds smoothly
        if (p.x < -p.size) p.x = canvas.width + p.size;
        if (p.x > canvas.width + p.size) p.x = -p.size;

        // Draw Ambient Heart
        ctx.save();
        ctx.translate(p.x, p.y);

        const rgbaBase = hexToRgbaBase(p.color);

        // 1. Realistic 3D Edge Gradient (Fresnel Effect)
        const gradient = ctx.createRadialGradient(
          0, p.size * 0.3, 0, // Inner center point
          0, p.size * 0.3, p.size * 1.1 // Outer edge
        );
        
        gradient.addColorStop(0, `rgba(255, 255, 255, 0)`); // Completely clear center
        gradient.addColorStop(0.5, `rgba(255, 255, 255, ${p.alpha * 0.05})`); // Soft inner clarity
        gradient.addColorStop(0.85, `${rgbaBase}${p.alpha * 0.8})`); // Color gathers at the edge
        gradient.addColorStop(1, `rgba(255, 255, 255, ${p.alpha + 0.3})`); // Bright rim lighting

        ctx.fillStyle = gradient;
        
        // Add a soft glow to the outside of the bubble
        ctx.shadowColor = rgbaBase + `${p.alpha * 0.6})`;
        ctx.shadowBlur = 10;
        
        // Draw the main heart path
        drawHeart(ctx, 0, 0, p.size);
        ctx.fill();
        
        // 2. Physical Glass Surface Stroke
        ctx.strokeStyle = `rgba(255, 255, 255, ${p.alpha + 0.4})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Turn off shadow blur for the crisp internal glints
        ctx.shadowBlur = 0;

        // 3. Specular Highlights (Volume & 3D Lighting)
        // Main Highlight: Top Left Lobe (Curved to follow the volume)
        ctx.beginPath();
        ctx.ellipse(-p.size * 0.22, p.size * 0.18, p.size * 0.12, p.size * 0.05, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha + 0.5})`;
        ctx.fill();

        // Secondary Highlight: Top Right Lobe (Smaller and softer)
        ctx.beginPath();
        ctx.ellipse(p.size * 0.22, p.size * 0.18, p.size * 0.08, p.size * 0.03, Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha + 0.1})`;
        ctx.fill();

        // Ambient Bounce Light: Bottom Tip
        const bottomBounce = ctx.createRadialGradient(
          0, p.size * 0.85, 0,
          0, p.size * 0.85, p.size * 0.25
        );
        bottomBounce.addColorStop(0, `${rgbaBase}${p.alpha + 0.1})`);
        bottomBounce.addColorStop(1, `rgba(255, 255, 255, 0)`);
        
        ctx.beginPath();
        ctx.ellipse(0, p.size * 0.85, p.size * 0.15, p.size * 0.08, 0, 0, Math.PI * 2);
        ctx.fillStyle = bottomBounce;
        ctx.fill();

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
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3.5 + 1.5;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed - 0.6; // upward drift
          }
        } else if (p.phase === "explode") {
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.025;
          if (p.alpha <= 0) return false;
        }

        // Draw Burst Heart
        ctx.save();
        ctx.translate(p.x, p.y);

        const rgbaBase = hexToRgbaBase(p.color);

        // 1. Realistic 3D Edge Gradient (Fresnel Effect)
        const gradient = ctx.createRadialGradient(
          0, p.size * 0.3, 0,
          0, p.size * 0.3, p.size * 1.1
        );
        
        gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
        gradient.addColorStop(0.5, `rgba(255, 255, 255, ${p.alpha * 0.05})`);
        gradient.addColorStop(0.85, `${rgbaBase}${p.alpha * 0.8})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, ${p.alpha + 0.3})`);

        ctx.fillStyle = gradient;
        
        // Add a soft glow to the outside of the bubble
        ctx.shadowColor = rgbaBase + `${p.alpha * 0.6})`;
        ctx.shadowBlur = 10;
        
        // Draw the main heart path
        drawHeart(ctx, 0, 0, p.size);
        ctx.fill();
        
        // 2. Physical Glass Surface Stroke
        ctx.strokeStyle = `rgba(255, 255, 255, ${p.alpha + 0.4})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Turn off shadow blur for the crisp internal glints
        ctx.shadowBlur = 0;

        // 3. Specular Highlights (Volume & 3D Lighting)
        ctx.beginPath();
        ctx.ellipse(-p.size * 0.22, p.size * 0.18, p.size * 0.12, p.size * 0.05, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha + 0.5})`;
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(p.size * 0.22, p.size * 0.18, p.size * 0.08, p.size * 0.03, Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha + 0.1})`;
        ctx.fill();

        // Ambient Bounce Light: Bottom Tip
        const bottomBounce = ctx.createRadialGradient(
          0, p.size * 0.85, 0,
          0, p.size * 0.85, p.size * 0.25
        );
        bottomBounce.addColorStop(0, `${rgbaBase}${p.alpha + 0.1})`);
        bottomBounce.addColorStop(1, `rgba(255, 255, 255, 0)`);
        
        ctx.beginPath();
        ctx.ellipse(0, p.size * 0.85, p.size * 0.15, p.size * 0.08, 0, 0, Math.PI * 2);
        ctx.fillStyle = bottomBounce;
        ctx.fill();

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
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("touchcancel", handleMouseLeave);
      window.removeEventListener("touchend", handleMouseLeave);
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
