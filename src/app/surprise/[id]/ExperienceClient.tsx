"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ParticleBackground } from "@/components/effects/ParticleBackground";
import { Music, Music4, Play, Share2, Copy, RefreshCw, Sparkles, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";
import * as THREE from "three";

export function ExperienceClient({ data }: { data: any }) {
  const [scene, setScene] = useState(0); 
  // 0: Start Button, 1: Intro, 2: Name Reveal, 3: Message, 4: Interactive, 5: Finale
  
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [showContinue, setShowContinue] = useState(false);

  useEffect(() => {
    audioRef.current = new Audio("/Happy Birthday Song.mp3");
    audioRef.current.loop = true;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const startExperience = () => {
    if (audioRef.current && !isPlaying) {
      audioRef.current.play().catch(e => console.log("Audio play blocked", e));
      setIsPlaying(true);
    }
    setScene(1);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (scene === 1) {
      timer = setTimeout(() => setScene(2), 5000);
    } else if (scene === 2) {
      timer = setTimeout(() => setScene(3), 5000);
    } else if (scene === 3) {
      const typeDuration = Math.max(2000, data.message.length * 50 + 1000);
      timer = setTimeout(() => setShowContinue(true), typeDuration);
    } else if (scene === 4) {
      timer = setTimeout(() => setScene(5), 7000);
    }
    
    return () => clearTimeout(timer);
  }, [scene, data.message.length]);

  // Auto Sparkle for Scene 4
  useEffect(() => {
    let interval: any;
    if (scene === 4) {
      interval = setInterval(() => {
        const x = Math.random() * 0.8 + 0.1;
        const y = Math.random() * 0.8 + 0.1;
        confetti({
          particleCount: 15,
          spread: 80,
          origin: { x, y },
          colors: ['#a855f7', '#ec4899', '#eab308', '#ffffff']
        });
      }, 700);
    }
    return () => clearInterval(interval);
  }, [scene]);

  useEffect(() => {
    if (scene === 5) {
      const duration = 15 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [scene]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (scene >= 3) {
      confetti({
        particleCount: 20,
        spread: 70,
        origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight },
        colors: ['#a855f7', '#ec4899', '#eab308', '#ffffff']
      });
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'A Magic Web Link For You',
          url: window.location.href,
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      copyLink();
    }
  };

  const replay = () => {
    setScene(1);
  };

  return (
    <div 
      className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center p-4 selection:bg-purple-500/30 touch-none"
      onPointerDown={handlePointerDown}
    >
      <ParticleBackground />
      
      {/* Controls */}
      <AnimatePresence>
        {scene > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-6 right-6 z-50 flex gap-4"
          >
            <button 
              onClick={toggleMusic}
              className="p-3 rounded-full bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all backdrop-blur-md"
            >
              {isPlaying ? <Music className="w-5 h-5" /> : <Music4 className="w-5 h-5 opacity-50" />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center Content */}
      <div className="z-10 w-full max-w-4xl text-center">
        <AnimatePresence mode="wait">
          {scene === 0 && (
            <motion.div
              key="start"
              exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
              transition={{ duration: 0.8 }}
            >
              <button 
                onClick={startExperience}
                className="group relative inline-flex items-center justify-center rounded-2xl px-10 py-5 text-lg font-medium transition-all hover:scale-105 active:scale-95 bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20 hover:border-white/40 overflow-hidden shadow-[0_0_40px_rgba(168,85,247,0.4)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="flex items-center gap-3 text-white z-10">
                  <Play className="w-5 h-5 fill-white" />
                  Open Your Gift
                </span>
              </button>
            </motion.div>
          )}

          {scene === 1 && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, filter: "blur(20px)", scale: 0.95 }}
              animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
              exit={{ opacity: 0, filter: "blur(10px)", scale: 1.05 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            >
              <h2 className="text-3xl md:text-5xl font-light text-white/90 font-serif leading-relaxed tracking-wide">
                Someone created something<br />
                <span className="text-gradient font-medium italic mt-2 inline-block">truly special for you...</span>
              </h2>
            </motion.div>
          )}

          {scene === 2 && (
            <motion.div
              key="name"
              initial={{ opacity: 0, scale: 0.5, filter: "brightness(0) blur(20px)" }}
              animate={{ opacity: 1, scale: 1, filter: "brightness(1) blur(0px)" }}
              exit={{ opacity: 0, scale: 1.5, filter: "blur(10px)", y: -50 }}
              transition={{ duration: 2.5, ease: "easeOut" }}
              className="relative px-4 w-full"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-yellow-500/30 blur-[100px] z-[-1]" />
              <h2 className="text-4xl md:text-6xl text-white/80 font-serif mb-4">Dear</h2>
              <h1 className="text-6xl sm:text-7xl md:text-9xl font-bold text-gradient-gold drop-shadow-[0_0_30px_rgba(234,179,8,0.5)] whitespace-normal break-words leading-tight">
                {data.name}
              </h1>
            </motion.div>
          )}

          {scene === 3 && (
            <motion.div
              key="message"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, filter: "blur(10px)", y: -30 }}
              transition={{ duration: 1.5 }}
              className="max-w-full md:max-w-2xl mx-auto px-4 sm:px-6 relative w-full"
            >
              <div className="absolute inset-0 bg-purple-900/10 blur-[60px] z-[-1]" />
              <motion.p 
                className="text-2xl md:text-4xl leading-relaxed font-light text-white/90"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 2, staggerChildren: 0.1 }}
              >
                {data.message.split("").map((char: string, index: number) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                    className={char === '\n' ? 'block mb-4' : ''}
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.p>
              <AnimatePresence>
                {showContinue && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-12 flex justify-center w-full pb-8"
                  >
                    <button 
                      onClick={() => setScene(4)}
                      className="px-8 py-4 sm:py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all backdrop-blur-md active:scale-95 text-lg font-medium shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                      Continue Magic ✨
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {scene === 4 && (
            <motion.div
              key="interactive"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="px-4"
            >
              <h3 className="text-2xl md:text-4xl font-light text-white/80 animate-pulse leading-snug">
                Tap or click around for magic...
              </h3>
            </motion.div>
          )}

          {scene === 5 && (
            <motion.div
              key="finale"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 2, type: "spring" }}
              className="space-y-12"
            >
              <div className="relative px-2 z-10">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/40 via-pink-500/40 to-yellow-500/40 blur-[100px] z-[-1]" />
                <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold text-white mb-6 font-serif drop-shadow-[0_0_50px_rgba(255,255,255,0.4)] leading-tight">
                  You are <span className="text-gradient block md:inline mt-2 md:mt-0">truly special</span>
                </h1>
                <div className="flex justify-center -mt-8 -mb-4 opacity-50 blur-[2px] hidden md:flex">
                   <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold text-transparent font-serif" style={{ WebkitTextStroke: '2px white' }}>
                    You are truly special
                  </h1>
                </div>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2, duration: 1 }}
                className="flex flex-col sm:flex-row flex-wrap justify-center items-stretch sm:items-center gap-4 pt-4 md:pt-12 relative z-50 pointer-events-auto w-full max-w-[280px] sm:max-w-none mx-auto"
              >
                <button 
                  onClick={replay}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all backdrop-blur-md shadow-lg"
                >
                  <RefreshCw className="w-5 h-5" /> Replay Magic
                </button>
                <button 
                  onClick={shareLink}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white transition-all shadow-lg"
                >
                  <Share2 className="w-5 h-5" /> Share
                </button>
                <button 
                  onClick={copyLink}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all backdrop-blur-md shadow-lg"
                >
                  {copied ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />} 
                  {copied ? "Copied!" : "Copy Link"}
                </button>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
