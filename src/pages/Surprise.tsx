import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getSurpriseData, incrementViewCount, incrementReactions } from "@/lib/db";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Music4, Play, Share2, Copy, RefreshCw, CheckCircle2, Sparkles, ArrowRight, Heart } from "lucide-react";
// Import components and assets
import { Button } from "@/components/ui/Button";
import confetti from "canvas-confetti";

interface ExperienceData {
  name: string;
  message: string;
  image_path?: string;
  music_path?: string;
}

export default function Surprise() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ExperienceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate("/");
      return;
    }
    // Increment view count in Firestore
    incrementViewCount(id);

    const fetchData = async () => {
      const result = await getSurpriseData(id);
      if (result) {
        setData({ 
          name: result.name, 
          message: result.message,
          image_path: result.image_path,
          music_path: result.music_path
        });
      } else {
        console.error("Surprise not found");
      }
      setIsLoading(false);
    };
    fetchData();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white/50">
        <Sparkles className="animate-spin w-8 h-8 mr-2" />
        Loading your magic...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl mb-4 text-white/80">Oops! This magic link doesn't exist or has expired.</h1>
        <button
          onClick={() => navigate("/")}
          className="premium-button text-sm px-6 py-2.5 shadow-md"
        >
          Create One
        </button>
      </div>
    );
  }

  return <ExperienceClient data={data} />;
}

const themeMap: Record<string, { primary: string; accent: string; particle: string }> = {
  midnight: { primary: "#6d28d9", accent: "#a78bfa", particle: "#c084fc" },
  rosegold: { primary: "#be123c", accent: "#fb7185", particle: "#fda4af" },
  ocean: { primary: "#1d4ed8", accent: "#60a5fa", particle: "#93c5fd" },
  emerald: { primary: "#065f46", accent: "#34d399", particle: "#6ee7b7" },
};

const confettiColors: Record<string, string[]> = {
  midnight: ['#a855f7', '#ec4899', '#eab308', '#ffffff'],
  rosegold: ['#fb7185', '#be123c', '#fda4af', '#ffffff'],
  ocean: ['#60a5fa', '#1d4ed8', '#93c5fd', '#ffffff'],
  emerald: ['#34d399', '#065f46', '#6ee7b7', '#ffffff'],
};

import HeartParticles from "@/components/effects/HeartParticles";

function ExperienceClient({ data }: { data: ExperienceData }) {
  const navigate = useNavigate();
  const [scene, setScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [showContinue, setShowContinue] = useState(false);

  // Upgrade States
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);
  const [burstTrigger, setBurstTrigger] = useState<{ x: number; y: number; time: number } | null>(null);
  const [hasSentReaction, setHasSentReaction] = useState(false);
  const [showReactionToast, setShowReactionToast] = useState(false);

  // Cake Scene 6 states
  const [areCandlesBlown, setAreCandlesBlown] = useState(false);
  const [showSmoke, setShowSmoke] = useState(false);
  const [showFinalSummary, setShowFinalSummary] = useState(false);
  const sceneTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Parse custom parameters
  let bodyText = data.message;
  let finaleText = "HAPPY BIRTHDAY! 🎂";
  let customMusic = "";
  let imageBase64 = "";
  let theme = "midnight";

  // 1. Get URLs directly if they exist
  if (data.image_path) {
    imageBase64 = data.image_path;
  }

  if (data.music_path) {
    customMusic = data.music_path;
  }

  // 2. Fallback to JSON-embedded data
  try {
    const parsed = JSON.parse(data.message);
    if (parsed && typeof parsed === 'object') {
      bodyText = parsed.body || "";
      if (parsed.finaleText) finaleText = parsed.finaleText;
      if (parsed.theme) theme = parsed.theme;
      
      // Only use JSON base64 if storage version doesn't exist
      if (parsed.imageBase64 && !imageBase64) imageBase64 = parsed.imageBase64;

      if (parsed.selectedMusic && parsed.selectedMusic !== "custom") {
        customMusic = parsed.selectedMusic;
      } else if (parsed.musicBase64 && !customMusic) {
        customMusic = parsed.musicBase64;
      }
    }
  } catch (e) {
    // Legacy plain text message fallback
  }

  // Apply Theme CSS Custom Variables
  useEffect(() => {
    const currentTheme = themeMap[theme] || themeMap.midnight;
    document.documentElement.style.setProperty('--theme-primary', currentTheme.primary);
    document.documentElement.style.setProperty('--theme-accent', currentTheme.accent);
    document.documentElement.style.setProperty('--theme-particle', currentTheme.particle);
  }, [theme]);

  // Audio lifecycle
  useEffect(() => {
    if (customMusic === "none") return;

    audioRef.current = new Audio(customMusic || "/Happy Birthday Song.mp3");
    audioRef.current.loop = true;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [customMusic]);

  const toggleMusic = () => {
    if (customMusic === "none") return;

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleEnvelopeClick = (e: React.MouseEvent) => {
    if (isEnvelopeOpen) return;

    // Autoplay gate workaround - play audio with volume ramp from 0 to 1 over 2000ms
    if (customMusic !== "none" && audioRef.current && !isPlaying) {
      audioRef.current.volume = 0;
      audioRef.current.play().catch(e => console.log("Audio play blocked", e));
      setIsPlaying(true);
      
      let currentVolume = 0;
      const volumeInterval = setInterval(() => {
        currentVolume += 0.05;
        if (currentVolume >= 1.0) {
          currentVolume = 1.0;
          clearInterval(volumeInterval);
        }
        if (audioRef.current) {
          audioRef.current.volume = currentVolume;
        }
      }, 100); // 20 steps of 100ms = 2000ms
    }

    setIsEnvelopeOpen(true);
    
    // Transition to scene 1 after envelope flap animation completes
    setTimeout(() => {
      setScene(1);
    }, 800);
  };

  const startExperience = () => {
    // Legacy fallback (no envelope clicked)
    if (customMusic !== "none" && audioRef.current && !isPlaying) {
      audioRef.current.play().catch(e => console.log("Audio play blocked", e));
      setIsPlaying(true);
    }
    setScene(1);
  };

  // Scene transition timers
  useEffect(() => {
    if (scene === 1) {
      sceneTimerRef.current = setTimeout(() => setScene(2), 5000);
    } else if (scene === 2) {
      sceneTimerRef.current = setTimeout(() => setScene(3), 5000);
    } else if (scene === 3) {
      const typeDuration = Math.max(2000, bodyText.length * 50 + 1000);
      sceneTimerRef.current = setTimeout(() => setShowContinue(true), typeDuration);
    } else if (scene === 4) {
      sceneTimerRef.current = setTimeout(() => setScene(5), 10000); // 10 seconds of auto-wait
    }

    return () => {
      if (sceneTimerRef.current) {
        clearTimeout(sceneTimerRef.current);
      }
    };
  }, [scene, bodyText.length]);


  // Auto-scroll as text types
  useEffect(() => {
    if (scene === 3) {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [scene, bodyText.length, showContinue]);

  // Scene 4 Auto Confetti
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (scene === 4) {
      interval = setInterval(() => {
        const x = Math.random() * 0.8 + 0.1;
        const y = Math.random() * 0.8 + 0.1;
        confetti({
          particleCount: 15,
          spread: 80,
          origin: { x, y },
          colors: confettiColors[theme] || confettiColors.midnight
        });
      }, 700);
    }
    return () => clearInterval(interval);
  }, [scene, theme]);

  // Scene 5 Confetti Fountain
  useEffect(() => {
    if (scene === 5) {
      const duration = 15 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { 
        startVelocity: 30, 
        spread: 360, 
        ticks: 60, 
        zIndex: 0,
        colors: confettiColors[theme] || confettiColors.midnight
      };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: NodeJS.Timeout = setInterval(function () {
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
  }, [scene, theme]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (scene >= 3) {
      confetti({
        particleCount: 20,
        spread: 70,
        origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight },
        colors: confettiColors[theme] || confettiColors.midnight
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
    setAreCandlesBlown(false);
    setShowSmoke(false);
    setShowFinalSummary(false);
    setHasSentReaction(false);
    setShowReactionToast(false);
    setScene(1);
  };

  // Reactions Update
  const handleSendReaction = async (e: React.MouseEvent) => {
    if (hasSentReaction) return;
    setHasSentReaction(true);

    // Trigger Mode B heart burst at cursor center
    setBurstTrigger({ x: e.clientX, y: e.clientY, time: Date.now() });

    // Update Firestore Reactions
    const id = window.location.pathname.split("/").pop();
    if (id) {
      await incrementReactions(id);
    }

    setShowReactionToast(true);
    setTimeout(() => {
      setShowReactionToast(false);
    }, 2500);
  };

  // Blow out candles (Scene 6)
  const blowOutCandles = () => {
    if (areCandlesBlown) return;
    setAreCandlesBlown(true);
    setShowSmoke(true);

    // Blow out Confetti Burst
    confetti({
      particleCount: 85,
      spread: 85,
      origin: { x: 0.5, y: 0.5 },
      colors: confettiColors[theme] || confettiColors.midnight
    });

    // Advance to final summary screen
    setTimeout(() => {
      setShowFinalSummary(true);
    }, 2500);
  };

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden flex flex-col items-center justify-between p-4 sm:p-8 selection:bg-[var(--theme-accent)]/30"
    >
      {/* Heart Particle Canvas System (Fullscreen, z-index 10) */}
      <HeartParticles scene={scene} burstTrigger={burstTrigger} theme={theme} />

      <AnimatePresence>
        {scene > 0 && customMusic !== "none" && (
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

      <div className="flex-1 flex flex-col items-center justify-center z-10 w-full max-w-4xl text-center py-8">
        <AnimatePresence mode="wait">
          {/* Reaction toast notification */}
          <AnimatePresence>
            {showReactionToast && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-tr from-purple-900/90 to-pink-900/90 border border-pink-500/30 px-5 py-3 rounded-full text-white text-sm font-semibold shadow-lg backdrop-blur-md flex items-center gap-2"
              >
                <span>💌</span> Your love was sent!
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scene 0: Sealed Envelope Autoplay Gate */}
          {scene === 0 && (
            <motion.div
              key="start"
              exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center gap-8 py-8"
            >
              <h2 className="text-2xl md:text-3xl font-light text-white/80 font-serif tracking-wide mb-4 animate-pulse">
                You received a sealed letter...
              </h2>

              <motion.div
                whileHover={{ rotateY: 5, scale: 1.03 }}
                animate={{ scale: [1, 1.03, 1] }}
                transition={{
                  scale: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                  type: "spring", stiffness: 200, damping: 15
                }}
                onClick={handleEnvelopeClick}
                className="relative w-64 h-44 md:w-80 md:h-56 bg-white/5 border border-white/10 rounded-2xl shadow-[0_0_30px_rgba(244,63,94,0.15)] flex items-center justify-center cursor-pointer perspective-1000 transform-style-3d hover:shadow-[0_0_40px_rgba(244,63,94,0.3)]"
              >
                {/* Envelope Back/Inside Body */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 to-slate-900/40 rounded-2xl overflow-hidden z-10 border border-white/5 shadow-inner" />

                {/* Golden light burst from inside */}
                {isEnvelopeOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.2 }}
                    animate={{ opacity: [0, 0.9, 0], scale: [0.2, 2.5, 4] }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 bg-gradient-to-tr from-amber-400/80 to-yellow-300/80 rounded-full filter blur-xl z-20 pointer-events-none"
                  />
                )}

                {/* Envelope Flap (Triangle) */}
                <motion.div
                  animate={isEnvelopeOpen ? { rotateX: -180 } : { rotateX: 0 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-[#3b2269] to-[#28144b] z-30 rounded-t-2xl shadow-md transform-style-3d"
                  style={{
                    clipPath: "polygon(0 0, 50% 65%, 100% 0)",
                    transformOrigin: "top center",
                  }}
                />

                {/* Left and Right Fold Overlays */}
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-white/2 to-transparent z-15 pointer-events-none rounded-2xl" 
                  style={{ clipPath: "polygon(0 0, 50% 50%, 0 100%)" }}
                />
                <div 
                  className="absolute inset-0 bg-gradient-to-l from-white/2 to-transparent z-15 pointer-events-none rounded-2xl" 
                  style={{ clipPath: "polygon(100% 0, 50% 50%, 100% 100%)" }}
                />
                <div 
                  className="absolute inset-0 bg-[#1d0e3a]/10 border-t border-white/5 z-16 pointer-events-none rounded-2xl" 
                  style={{ clipPath: "polygon(0 100%, 50% 45%, 100% 100%)" }}
                />

                {/* Wax Seal */}
                <motion.div
                  animate={isEnvelopeOpen ? { scale: 0, opacity: 0 } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-rose-700 border border-rose-500 flex items-center justify-center text-white text-xl font-bold shadow-[0_4px_10px_rgba(220,38,38,0.4)] z-40 cursor-pointer"
                >
                  ♥
                </motion.div>

                {/* Sealed Text Label */}
                {!isEnvelopeOpen && (
                  <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/35 text-[10px] tracking-widest font-mono uppercase z-20">
                    Click to Open
                  </span>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* Scene 1: Cinematic Preface */}
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

          {/* Scene 2: Name Reveal */}
          {scene === 2 && (
            <motion.div
              key="name"
              initial={{ opacity: 0, scale: 0.5, filter: "brightness(0) blur(20px)" }}
              animate={{ opacity: 1, scale: 1, filter: "brightness(1) blur(0px)" }}
              exit={{ opacity: 0, scale: 1.5, filter: "blur(10px)", y: -50 }}
              transition={{ duration: 2.5, ease: "easeOut" }}
              className="relative px-4 w-full"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--theme-primary)]/30 via-[var(--theme-accent)]/20 to-[var(--theme-primary)]/10 blur-[100px] z-[-1]" />
              <h2 className="text-4xl md:text-6xl text-white/80 font-serif mb-4">Dear</h2>
              <h1 className="text-6xl sm:text-7xl md:text-9xl font-bold text-gradient-gold drop-shadow-[0_0_30px_rgba(234,179,8,0.5)] whitespace-normal break-words leading-tight">
                {data.name}
              </h1>
            </motion.div>
          )}

          {/* Scene 3: Message Typing */}
          {scene === 3 && (
            <motion.div
              key="message"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, filter: "blur(10px)", y: -30 }}
              transition={{ duration: 1.5 }}
              className="max-w-full md:max-w-2xl mx-auto px-4 sm:px-6 relative w-full"
            >
              <div className="absolute inset-0 bg-[var(--theme-primary)]/10 blur-[60px] z-[-1]" />
              <motion.p
                className="text-2xl md:text-4xl leading-relaxed font-light text-white/90"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 2, staggerChildren: 0.1 }}
              >
                {bodyText.split(/(\n|\s+)/).map((word, index) => {
                  if (word === "\n") {
                    return <br key={index} />;
                  }
                  if (word.trim() === "") {
                    return <span key={index}> </span>;
                  }
                  return (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, y: 5, filter: "blur(3px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      transition={{ delay: index * 0.03, duration: 0.35 }}
                      className="inline-block"
                    >
                      {word}
                    </motion.span>
                  );
                })}
              </motion.p>
              <AnimatePresence>
                {showContinue && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-12"
                  >
                    <button
                      onClick={() => setScene(4)}
                      className="premium-button mx-auto text-lg px-10 py-4 shadow-xl shadow-pink-500/10"
                    >
                      Continue Magic
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Scene 4: Beating heart click interactive */}
          {scene === 4 && (
            <motion.div
              key="interactive"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, filter: "blur(20px)" }}
              transition={{ duration: 1 }}
              onPointerDown={handlePointerDown}
              className="cursor-pointer py-12"
            >
              <div className="flex flex-col items-center gap-8">
                <div className="relative w-40 h-40 md:w-56 md:h-56 flex items-center justify-center mb-4">
                  {/* Smooth Performance Aura Background for the icon */}
                  <div className="absolute inset-[-20px] md:inset-[-40px] z-[-1] pointer-events-none flex items-center justify-center">
                    <div 
                      className="absolute w-full h-full opacity-70 rounded-full"
                      style={{ background: `radial-gradient(circle at center, var(--theme-accent) 0%, var(--theme-primary) 50%, rgba(0,0,0,0) 80%)` }}
                    />
                    {/* Smooth rotating outer ring */}
                    <div className="absolute w-[110%] h-[110%] rounded-full border border-[var(--theme-accent)]/50 border-t-white/80 border-r-[var(--theme-accent)]/60 shadow-[0_0_25px_var(--theme-accent)] animate-spin-clockwise" />
                    {/* Counter rotating inner dashed/glow ring */}
                    <div className="absolute w-[95%] h-[95%] rounded-full border border-dashed border-[var(--theme-accent)]/40 border-b-white/80 animate-spin-counter-clockwise" />
                  </div>
                  
                  {/* The Beating Neon Heart */}
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                    onClick={(e) => {
                      e.stopPropagation(); // prevent triggering general confetti
                      setBurstTrigger({ x: e.clientX, y: e.clientY, time: Date.now() });
                      if (sceneTimerRef.current) {
                        clearTimeout(sceneTimerRef.current);
                      }
                      setTimeout(() => {
                        setScene(5);
                      }, 1200);
                    }}
                    className="relative z-10 flex items-center justify-center p-6 bg-white/10 rounded-full backdrop-blur-md border border-[var(--theme-accent)]/40 cursor-pointer shadow-[0_0_35px_rgba(255,255,255,0.1)] hover:border-white/60 transition-all duration-300"
                  >
                    <Heart className="w-16 h-16 md:w-20 md:h-20 text-[var(--theme-accent)] fill-[var(--theme-accent)]/90 drop-shadow-[0_0_20px_var(--theme-accent)]" />
                  </motion.div>
                </div>
                <h2 className="text-3xl md:text-4xl font-light text-white/80 tracking-widest uppercase">
                  Tap or click for magic
                </h2>
                <p className="text-white/50 italic">The real surprise is waiting...</p>
              </div>
            </motion.div>
          )}

          {/* Scene 5: Photo + Climax Message */}
          {scene === 5 && (
            <motion.div
              key="finale"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="flex flex-col items-center gap-6 animate-pulse-reduced"
            >
              {imageBase64 && (
                <motion.img
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.5 }}
                  src={imageBase64}
                  alt="Surprise Photo"
                  className="relative z-20 mx-auto max-w-[85vw] md:max-w-lg max-h-[40vh] md:max-h-[50vh] w-auto h-auto object-contain rounded-3xl border-2 border-white/20 drop-shadow-[0_0_25px_var(--theme-accent)] shadow-2xl"
                />
              )}

              <div className="relative mb-8 mt-4">
                {/* Smooth Performance Aura Background */}
                <div className="absolute inset-[-40px] md:inset-[-80px] z-[-1] pointer-events-none flex items-center justify-center">
                  <div 
                    className="absolute w-full h-full opacity-60 rounded-full"
                    style={{ background: `radial-gradient(circle at center, var(--theme-primary) 0%, var(--theme-accent) 50%, rgba(0,0,0,0) 80%)` }}
                  />
                  {/* Smooth rotating ring */}
                  <div className="absolute w-[110%] h-[110%] rounded-full border border-[var(--theme-primary)]/20 border-t-[var(--theme-accent)]/50 border-r-[var(--theme-primary)]/30 shadow-[0_0_15px_var(--theme-primary)] animate-spin-clockwise" />
                  {/* Counter rotating inner ring */}
                  <div className="absolute w-[100%] h-[100%] rounded-full border border-[var(--theme-accent)]/10 border-b-[var(--theme-primary)]/40 animate-spin-counter-clockwise" />
                </div>
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] px-4">
                  {finaleText}
                </h2>
              </div>

              {/* Continue to Cake Button */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, type: "spring", stiffness: 200, damping: 15 }}
                className="my-4 relative z-20 flex justify-center w-full"
              >
                <button
                  onClick={() => setScene(6)}
                  className="premium-button text-sm px-8 py-3.5 shadow-[0_4px_20px_rgba(124,58,237,0.3)]"
                >
                  <span>Continue to Cake 🎂</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* Scene 6: Interactive Birthday Cake Blowout */}
          {scene === 6 && (
            <motion.div
              key="cakeScene"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="flex flex-col items-center gap-6 py-6"
            >
              {!showFinalSummary ? (
                <>
                  <div 
                    onClick={blowOutCandles}
                    className="relative cursor-pointer transition-transform hover:scale-105 active:scale-98"
                  >
                    <svg viewBox="0 0 200 200" className="w-48 h-48 md:w-64 md:h-64 mx-auto overflow-visible">
                      {/* Cake Platform */}
                      <rect x="20" y="170" width="160" height="10" rx="5" fill="#e2e8f0" />
                      
                      {/* Tier 1 (Bottom) */}
                      <rect x="30" y="110" width="140" height="60" rx="8" fill="var(--theme-primary)" opacity="0.9" />
                      <path d="M 30 130 C 50 140, 70 120, 90 135 C 110 120, 130 140, 150 130 C 160 125, 170 135, 170 135 L 170 110 L 30 110 Z" fill="#ffffff" opacity="0.25" />
                      
                      {/* Tier 2 (Top) */}
                      <rect x="50" y="60" width="100" height="50" rx="6" fill="var(--theme-accent)" opacity="0.95" />
                      <path d="M 50 80 C 70 85, 90 75, 110 85 C 130 75, 150 80, 150 80 L 150 60 L 50 60 Z" fill="#ffffff" opacity="0.25" />

                      {/* Frosting details */}
                      <circle cx="45" cy="140" r="3" fill="#f43f5e" />
                      <circle cx="75" cy="150" r="3" fill="#eab308" />
                      <circle cx="105" cy="135" r="3" fill="#3b82f6" />
                      <circle cx="135" cy="145" r="3" fill="#10b981" />
                      <circle cx="155" cy="130" r="3" fill="#a855f7" />

                      <circle cx="65" cy="85" r="2.5" fill="#f43f5e" />
                      <circle cx="95" cy="95" r="2.5" fill="#eab308" />
                      <circle cx="125" cy="80" r="2.5" fill="#3b82f6" />

                      {/* Candles */}
                      <rect x="70" y="35" width="6" height="25" rx="2" fill="#3b82f6" />
                      <rect x="97" y="30" width="6" height="30" rx="2" fill="#f43f5e" />
                      <rect x="124" y="35" width="6" height="25" rx="2" fill="#10b981" />

                      {/* Candle Flames */}
                      {!areCandlesBlown && (
                        <>
                          {/* Flame 1 */}
                          <path 
                            d="M 73 15 C 68 25, 78 25, 73 15 Z" 
                            fill="#f97316" 
                            className="animate-flicker" 
                            style={{ transformOrigin: '73px 25px' }} 
                          />
                          <path 
                            d="M 73 18 C 70 23, 76 23, 73 18 Z" 
                            fill="#eab308" 
                            className="animate-flicker" 
                            style={{ transformOrigin: '73px 23px' }} 
                          />

                          {/* Flame 2 */}
                          <path 
                            d="M 100 8 C 95 18, 105 18, 100 8 Z" 
                            fill="#f97316" 
                            className="animate-flicker" 
                            style={{ transformOrigin: '100px 18px', animationDelay: '0.1s' }} 
                          />
                          <path 
                            d="M 100 11 C 97 16, 103 16, 100 11 Z" 
                            fill="#eab308" 
                            className="animate-flicker" 
                            style={{ transformOrigin: '100px 16px', animationDelay: '0.1s' }} 
                          />

                          {/* Flame 3 */}
                          <path 
                            d="M 127 15 C 122 25, 132 25, 127 15 Z" 
                            fill="#f97316" 
                            className="animate-flicker" 
                            style={{ transformOrigin: '127px 25px', animationDelay: '0.2s' }} 
                          />
                          <path 
                            d="M 127 18 C 124 23, 130 23, 127 18 Z" 
                            fill="#eab308" 
                            className="animate-flicker" 
                            style={{ transformOrigin: '127px 23px', animationDelay: '0.2s' }} 
                          />
                        </>
                      )}

                      {/* Smoke puffs */}
                      {showSmoke && (
                        <>
                          <circle cx="73" cy="20" r="3" fill="#cbd5e1" className="animate-smoke animate-smoke-delay-0" />
                          <circle cx="100" cy="15" r="3" fill="#cbd5e1" className="animate-smoke animate-smoke-delay-1" />
                          <circle cx="127" cy="20" r="3" fill="#cbd5e1" className="animate-smoke animate-smoke-delay-2" />
                        </>
                      )}
                    </svg>
                  </div>
                  
                  <h3 className="text-2xl md:text-3xl font-light text-white/80 tracking-wide font-serif">
                    {!areCandlesBlown ? "Make a wish... then blow! 🎂" : "Wish made! ✨"}
                  </h3>
                  <p className="text-sm text-white/40 italic">
                    {!areCandlesBlown ? "Click or tap on the cake to blow out the candles" : "Enjoy your special day!"}
                  </p>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8 py-8"
                >
                  <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-2 font-serif text-white">
                    Happy Birthday
                  </h2>
                  <h1 className="text-6xl sm:text-7xl md:text-9xl font-extrabold gold-shimmer drop-shadow-[0_0_35px_rgba(234,179,8,0.3)] select-none">
                    {data.name}
                  </h1>

                  <div className="flex flex-wrap justify-center gap-4 pt-8">
                    <motion.button
                      onClick={handleSendReaction}
                      disabled={hasSentReaction}
                      whileTap={{ scale: 0.95 }}
                      className={`px-6 py-3 rounded-full font-semibold flex items-center justify-center gap-2 border backdrop-blur-md transition-all text-sm shadow-md active:scale-98 select-none ${
                        hasSentReaction 
                          ? "bg-white/5 border-white/10 text-white/40 cursor-not-allowed" 
                          : "bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/30 text-white shadow-lg active:scale-105"
                      }`}
                    >
                      {hasSentReaction ? (
                        <>
                          <span>💌</span>
                          <span>Love sent!</span>
                        </>
                      ) : (
                        <>
                          <Heart className="h-4 w-4 text-rose-500 fill-rose-500 animate-pulse" />
                          <span>Send love back</span>
                        </>
                      )}
                    </motion.button>
                    <button
                      onClick={shareLink}
                      className="premium-button text-sm px-6 py-3 shadow-[0_4px_20px_rgba(124,58,237,0.3)] flex items-center justify-center gap-1.5"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share This Moment</span>
                    </button>
                    <button
                      onClick={copyLink}
                      className="px-6 py-3 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white hover:border-white/20 transition-all font-semibold text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-98 select-none"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                    <button
                      onClick={replay}
                      className="px-6 py-3 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white hover:border-white/20 transition-all font-semibold text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-98 select-none"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Replay Surprise</span>
                    </button>
                    <button
                      onClick={() => navigate("/")}
                      className="premium-button text-sm px-6 py-3 shadow-[0_4px_20px_rgba(124,58,237,0.3)] flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Create Your Own</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
