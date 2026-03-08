import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSurpriseData } from "@/lib/db";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Music4, Play, Share2, Copy, RefreshCw, CheckCircle2, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface ExperienceData {
  name: string;
  message: string;
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
    const fetchData = async () => {
      const result = await getSurpriseData(id);
      if (result) {
        setData({ name: result.name, message: result.message });
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
        <h1 className="text-2xl mb-4 text-white/80">Oops! This magic link doesn't exist.</h1>
        <button 
          onClick={() => navigate("/")}
          className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-white"
        >
          Create One
        </button>
      </div>
    );
  }

  return <ExperienceClient data={data} />;
}

function ExperienceClient({ data }: { data: ExperienceData }) {
  const [scene, setScene] = useState(0); 
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

      const interval: NodeJS.Timeout = setInterval(function() {
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
                {data.message.split("").map((char, index) => (
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
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-12"
                  >
                    <button 
                      onClick={() => setScene(4)}
                      className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 transition-all flex items-center gap-2 mx-auto"
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
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, filter: "blur(20px)" }}
              transition={{ duration: 1 }}
            >
              <div className="flex flex-col items-center gap-8">
                <div className="relative">
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }} 
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-pink-500/20 blur-3xl rounded-full"
                  />
                  <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-2 border-white/30 flex items-center justify-center backdrop-blur-sm relative z-10">
                    <Sparkles className="w-12 h-12 md:w-20 md:h-20 text-yellow-300 animate-pulse" />
                  </div>
                </div>
                <h2 className="text-3xl md:text-4xl font-light text-white/80 tracking-widest uppercase">
                  Tap or click for magic 
                </h2>
                <p className="text-white/50 italic">The real surprise is waiting...</p>
              </div>
            </motion.div>
          )}

          {scene === 5 && (
            <motion.div
              key="finale"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="flex flex-col items-center gap-6"
            >
              <div className="relative mb-8">
                <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                   className="absolute inset-[-40px] border border-dashed border-white/10 rounded-full"
                />
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                  HAPPY BIRTHDAY! 🎂
                </h2>
              </div>
              
              <div className="flex flex-wrap justify-center gap-4 mt-8">
                <button 
                  onClick={copyLink}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all"
                >
                  {copied ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <button 
                  onClick={shareLink}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 border border-purple-500/30 transition-all"
                >
                  <Share2 className="w-5 h-5" />
                  Share Surprise
                </button>
                <button 
                  onClick={replay}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-white/60"
                >
                  <RefreshCw className="w-5 h-5" />
                  Replay
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {scene === 5 && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
             <div className="text-white/5 text-8xl md:text-[20rem] font-black select-none z-[-1]">
                MAGIC
             </div>
        </div>
      )}
      
      {/* Footer */}
      <footer className="absolute bottom-4 text-white/40 text-sm font-light z-20">
        &copy; {new Date().getFullYear()} Digital Surprise Gift. Made by <span className="font-medium text-white/60">Gous Khan</span>.
      </footer>
    </div>
  );
}
