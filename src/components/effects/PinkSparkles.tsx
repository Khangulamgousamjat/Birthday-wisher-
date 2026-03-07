"use client";

import { useEffect, useRef } from "react";

interface PinkSparklesProps {
  clickPosition?: { x: number, y: number } | null;
}

export function PinkSparkles({ clickPosition }: PinkSparklesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesArrayRef = useRef<any[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      glow: number;
      opacity: number;
      life: number;
      maxLife: number;
      decay: number;

      constructor(x?: number, y?: number, isClickBurst = false) {
        this.x = x !== undefined ? x : Math.random() * canvas!.width;
        this.y = y !== undefined ? y : Math.random() * canvas!.height;
        this.size = Math.random() * (isClickBurst ? 3 : 2) + 0.1;
        
        const speedMultiplier = isClickBurst ? 5 : 0.5;
        this.speedX = (Math.random() - 0.5) * speedMultiplier;
        this.speedY = (Math.random() - 0.5) * speedMultiplier;
        
        const colors = [
          'rgba(255, 0, 150, 1)',
          'rgba(255, 50, 200, 1)',
          'rgba(255, 255, 255, 1)',
          'rgba(200, 0, 100, 1)',
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.glow = Math.random() * 15 + 5;
        this.opacity = Math.random() * 0.5 + 0.5;
        
        this.life = Math.random() * Math.PI * 2;
        this.maxLife = Math.random() * 0.05 + 0.01;
        this.decay = isClickBurst ? Math.random() * 0.03 + 0.01 : 0; // Only click bursts decay and disappear
      }

      update(index: number, array: any[]) {
        this.x += this.speedX;
        this.y += this.speedY;
        
        if (this.decay > 0) {
          this.opacity -= this.decay;
          if (this.opacity <= 0) {
            array.splice(index, 1);
            return;
          }
        } else {
          if (this.x < 0) this.x = canvas!.width;
          if (this.x > canvas!.width) this.x = 0;
          if (this.y < 0) this.y = canvas!.height;
          if (this.y > canvas!.height) this.y = 0;

          this.life += this.maxLife;
          this.opacity = (Math.sin(this.life) + 1) / 2 * 0.8 + 0.2;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.opacity);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.shadowBlur = this.glow;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
      }
    }

    // Initial background particles
    const particleCount = Math.floor((canvas.width * canvas.height) / 4000);
    particlesArrayRef.current = [];
    for (let i = 0; i < particleCount; i++) {
        particlesArrayRef.current.push(new Particle());
    }

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // completely clear it, no gradient background
      
      for (let i = particlesArrayRef.current.length - 1; i >= 0; i--) {
        particlesArrayRef.current[i].update(i, particlesArrayRef.current);
        if (particlesArrayRef.current[i]) {
            particlesArrayRef.current[i].draw();
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", setCanvasSize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Handle new click bursts
  useEffect(() => {
    if (clickPosition && particlesArrayRef.current) {
        // Spawn 30 particles at the click location
        for (let i = 0; i < 40; i++) {
             // To access the nested class, we define a quick local factory for the burst
             class BurstParticle {
              x = clickPosition.x;
              y = clickPosition.y;
              size = Math.random() * 3 + 0.5;
              speedX = (Math.random() - 0.5) * 8;
              speedY = (Math.random() - 0.5) * 8;
              colors = ['rgba(255, 0, 150, 1)', 'rgba(255, 50, 200, 1)', 'rgba(255, 255, 255, 1)', 'rgba(200, 0, 100, 1)'];
              color = this.colors[Math.floor(Math.random() * this.colors.length)];
              glow = Math.random() * 20 + 10;
              opacity = 1;
              decay = Math.random() * 0.02 + 0.01;

              update(index: number, array: any[]) {
                this.x += this.speedX;
                this.y += this.speedY;
                this.opacity -= this.decay;
                if (this.opacity <= 0) {
                  array.splice(index, 1);
                }
              }

              draw(ctx: CanvasRenderingContext2D) {
                ctx.save();
                ctx.globalAlpha = Math.max(0, this.opacity);
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.shadowBlur = this.glow;
                ctx.shadowColor = this.color;
                ctx.fillStyle = this.color;
                ctx.fill();
                ctx.restore();
              }
            }
            particlesArrayRef.current.push(new BurstParticle());
        }
    }
  }, [clickPosition]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-50 mix-blend-screen opacity-100"
    />
  );
}
