import { useState, useEffect, useRef } from "react";
import SpotlightCard from "@/components/SpotlightCard";
import { Button } from "@/components/ui/Button";
import { MouseTrail } from "@/components/effects/MouseTrail";
import { m } from "framer-motion";
import { Copy, Sparkles, ArrowRight, CheckCircle2, Play, Pause, Music, User, Mail, Image as ImageIcon, Music2, Eye, Heart } from "lucide-react";
import { saveSurpriseData } from "@/lib/db";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { FloatingInput } from "@/components/FloatingInput";

export default function Home() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [finaleText, setFinaleText] = useState("HAPPY BIRTHDAY! 🎂");
  const [selectedMusic, setSelectedMusic] = useState("/Happy Birthday Song.mp3");
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [musicError, setMusicError] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [imageFileName, setImageFileName] = useState("");
  const [imageError, setImageError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastBlobUrl = useRef<string | null>(null);

  // Upgrade States
  const [theme, setTheme] = useState("midnight");
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [reactionsCount, setReactionsCount] = useState<number | null>(null);

  // Real-time View & Reactions listener
  useEffect(() => {
    if (!generatedLink) {
      setViewCount(null);
      setReactionsCount(null);
      return;
    }
    const id = generatedLink.split("/").pop();
    if (!id) return;

    const docRef = doc(db, 'surprises', id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setViewCount(data.view_count || 0);
        setReactionsCount(data.reactions || 0);
      }
    });
    return () => unsubscribe();
  }, [generatedLink]);

  // Cleanup on unmount
  const previewUrlRef = useRef<string | null>(null);
  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (lastBlobUrl.current) {
        URL.revokeObjectURL(lastBlobUrl.current);
      }
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
      // Release audio resources
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(btn.clientWidth, btn.clientHeight);
    const radius = diameter / 2;
    const rect = btn.getBoundingClientRect();
    circle.style.cssText = `
      width: ${diameter}px; height: ${diameter}px;
      left: ${e.clientX - rect.left - radius}px;
      top: ${e.clientY - rect.top - radius}px;
    `;
    circle.classList.add('cta-ripple');
    btn.querySelector('.cta-ripple')?.remove();
    btn.appendChild(circle);
  };

  const [loadingText, setLoadingText] = useState("Brewing Magic...");

  const funnyLines = [
    "Brewing Magic...",
    "Dividing 0 by eternity...",
    "Consulting the birthday wizards...",
    "Compressing pixels to pure love...",
    "Calculating optimal hype levels...",
    "Polishing the sparkles...",
    "Injecting cake calories into the link...",
    "Stretching the time continuum...",
    "Untangling the confetti strings...",
    "Adding a pinch of stardust...",
    "Baking the digital cake...",
    "Making sure it is 100% magical..."
  ];

  useEffect(() => {
    if (!isGenerating) {
      setLoadingText(funnyLines[0]);
      return;
    }

    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % funnyLines.length;
      setLoadingText(funnyLines[currentIndex]);
    }, 1500);

    return () => clearInterval(interval);
  }, [isGenerating]);

  // Stop preview if selection changes
  useEffect(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPlayingPreview(false);
    }
  }, [selectedMusic]);

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) { // 20MB limit
        setMusicError("Audio file is too large (max 20MB)");
        setMusicFile(null);
      } else {
        setMusicError("");
        setMusicFile(file);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setImageError("Please upload an image file");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_WIDTH = 600;
          const MAX_HEIGHT = 600;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          
          if (compressedBase64.length > 700 * 1024) { 
            setImageError("Image is too large even after compression.");
            setImageBase64("");
            setImageFileName("");
            if (previewUrl) {
              URL.revokeObjectURL(previewUrl);
              setPreviewUrl(null);
            }
          } else {
            setImageError("");
            setImageBase64(compressedBase64);
            setImageFileName(file.name);
            canvas.toBlob((blob) => {
              if (blob) {
                if (previewUrl) {
                  URL.revokeObjectURL(previewUrl);
                }
                setPreviewUrl(URL.createObjectURL(blob));
              }
            }, 'image/jpeg', 0.6);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsGenerating(true);
    try {
      let musicBase64 = "";
      if (musicFile) {
        const reader = new FileReader();
        musicBase64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(musicFile);
        });
      }

      const payload = {
        body: message,
        finaleText: finaleText.trim() || "HAPPY BIRTHDAY! 🎂",
        selectedMusic: selectedMusic,
        theme: theme,
        // Large files are now handled via Storage buckets, not this JSON
      };

      setError("");
      const finalMessageString = JSON.stringify(payload);

      const id = await saveSurpriseData({ 
        name, 
        message: finalMessageString,
        imageBase64: imageBase64 || null,
        musicFile: musicFile
      });
      if (id) {
        setGeneratedLink(`${window.location.origin}/surprise/${id}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate magic link. Please check your connection and tries.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const playSong = (source: string) => {
    if (!audioRef.current) return;
    
    const audio = audioRef.current;
    
    if (!source || source === "none") {
      audio.pause();
      return;
    }

    if (source === "custom" && !musicFile) {
      return;
    }

    let actualSource = source;
    if (source === "custom" && musicFile) {
      if (lastBlobUrl.current) URL.revokeObjectURL(lastBlobUrl.current);
      actualSource = URL.createObjectURL(musicFile);
      lastBlobUrl.current = actualSource;
    }

    const encodedSource = actualSource.startsWith('blob:') ? actualSource : encodeURI(actualSource);

    try {
      if (audio.src !== window.location.origin + encodedSource && audio.src !== encodedSource) {
        audio.src = encodedSource;
        audio.load();
      }
      audio.play().catch(() => { /* Playback blocked by browser policy */ });
    } catch {
      // Audio setup failed silently
    }
  };

  const togglePreview = () => {
    if (!audioRef.current) return;
    
    if (!audioRef.current.paused) {
      audioRef.current.pause();
    } else {
      playSong(selectedMusic);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between p-4 sm:p-8 overflow-hidden">
      <MouseTrail />
      
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-xl z-10 py-8">
        <m.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center space-x-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md mb-6 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-white/80">Digital Surprise Gift</span>
          </div>
          <h1 className="shimmer-title mb-6">
            Create a Magical Page
          </h1>
          <p className="magic-subtitle max-w-md mx-auto">
            Craft a beautiful, personalized animated experience for someone special.
          </p>
        </m.div>

        <m.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
           className="w-full flex flex-col items-center"
        >
          {/* Progress Bar */}
          {!generatedLink && (
            <div className="w-full px-4 mb-6 relative">
              <div className="relative flex items-center justify-between w-full max-w-md mx-auto">
                {/* Connecting Line */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-white/10 z-0">
                  {/* Active Line Fill */}
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out"
                    style={{ 
                      width: `${
                        (imageBase64 !== "" || selectedMusic !== "/Happy Birthday Song.mp3" || musicFile !== null) ? "100%" : 
                        (message.trim().length > 0) ? "66.6%" : 
                        (name.trim().length > 0) ? "33.3%" : "0%"
                      }` 
                    }}
                  />
                </div>

                {/* Nodes */}
                {[
                  { number: 1, label: "Name", icon: <User className="h-4 w-4" />, complete: name.trim().length > 0 },
                  { number: 2, label: "Message", icon: <Mail className="h-4 w-4" />, complete: message.trim().length > 0 || imageBase64 !== "" || selectedMusic !== "/Happy Birthday Song.mp3" || musicFile !== null },
                  { number: 3, label: "Photo", icon: <ImageIcon className="h-4 w-4" />, complete: imageBase64 !== "" || selectedMusic !== "/Happy Birthday Song.mp3" || musicFile !== null },
                  { number: 4, label: "Music", icon: <Music2 className="h-4 w-4" />, complete: true },
                ].map((s, i) => {
                  const isActive = !s.complete && (
                    i === 0 || 
                    (i === 1 && name.trim().length > 0) || 
                    (i === 2 && (message.trim().length > 0 || name.trim().length > 0)) ||
                    (i === 3 && (imageBase64 !== "" || message.trim().length > 0))
                  );
                  return (
                    <div key={s.number} className="relative z-10 flex flex-col items-center gap-1.5">
                      <div 
                        className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 ${
                          s.complete 
                            ? "bg-gradient-to-tr from-purple-500 to-pink-500 border-transparent text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]" 
                            : isActive 
                            ? "bg-black border-purple-500 text-purple-400 ring-4 ring-purple-500/20" 
                            : "bg-black border-white/15 text-white/40"
                        }`}
                      >
                        {s.icon}
                      </div>
                      <span className={`text-[10px] font-medium tracking-wider uppercase ${
                        s.complete ? "text-white/80" : isActive ? "text-purple-400" : "text-white/30"
                      }`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        <m.div
          className="magic-card w-full"
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <SpotlightCard className="p-8 md:p-10 relative group w-full bg-transparent">
            
            {!generatedLink ? (
              <form onSubmit={handleGenerate} className="space-y-6 relative z-10">
                <FloatingInput
                  id="name"
                  label="Who is this for?"
                  icon="👤"
                  value={name}
                  onChange={setName}
                  placeholder="Enter their name"
                  required
                />
                
                <FloatingInput
                  id="message"
                  label="Your Special Message (Optional)"
                  icon="💌"
                  value={message}
                  onChange={setMessage}
                  placeholder="Write something nice..."
                  multiline
                />

                <FloatingInput
                  id="finaleText"
                  label="Finale Message"
                  icon="🎂"
                  value={finaleText}
                  onChange={setFinaleText}
                  placeholder="HAPPY BIRTHDAY! 🎂"
                />
 
                {/* Theme Selector */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white/80 ml-1">
                    Choose a vibe
                  </label>
                  <div className="flex items-center gap-4 bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-xl p-3 justify-around">
                    {[
                      { key: "midnight", name: "Midnight Purple", bg: "bg-purple-600" },
                      { key: "rosegold", name: "Rose Gold", bg: "bg-rose-600" },
                      { key: "ocean", name: "Ocean Blue", bg: "bg-blue-600" },
                      { key: "emerald", name: "Emerald", bg: "bg-emerald-600" },
                    ].map((t) => {
                      const isSelected = theme === t.key;
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => setTheme(t.key)}
                          className="group relative flex flex-col items-center gap-1 focus:outline-none"
                        >
                          <div 
                            className={`w-9 h-9 rounded-full ${t.bg} transition-all duration-300 cursor-pointer ${
                              isSelected 
                                ? "ring-2 ring-white ring-offset-2 ring-offset-black scale-110 shadow-lg shadow-white/10" 
                                : "opacity-60 hover:opacity-100 hover:scale-105"
                            }`}
                            title={t.name}
                          />
                          <span className={`text-[9px] font-medium transition-all ${
                            isSelected ? "text-white font-semibold" : "text-white/40"
                          }`}>
                            {t.key.charAt(0).toUpperCase() + t.key.slice(1)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label htmlFor="photo" className="text-sm font-medium text-white/80">
                      Add Photo
                    </label>
                  </div>
                  <input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-pink-500/20 file:text-pink-300 hover:file:bg-pink-500/30 transition-all font-medium text-sm cursor-pointer"
                  />
                  {imageError && <p className="text-red-400 text-xs mt-1 ml-1">{imageError}</p>}
                  <div className="mt-2 ml-1">
                    {previewUrl ? (
                      <m.div
                        className="photo-preview"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      >
                        <img src={previewUrl} alt="Preview" className="photo-thumb" />
                        <span className="photo-check">✓ Photo ready</span>
                      </m.div>
                    ) : imageFileName && !imageError ? (
                      <p className="text-green-400 text-xs">✓ {imageFileName} attached</p>
                    ) : (
                      <span className="text-xs text-white/30">No file chosen</span>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-sm font-medium text-white/80">
                        Background Music <span className="text-white/40">(Optional)</span>
                      </label>
                      {isPlayingPreview && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-rose-300 font-medium truncate max-w-[120px] select-none">
                            {selectedMusic === "custom" ? (musicFile?.name || "Custom Track") : selectedMusic.split("/").pop()?.replace(".mp3", "")}
                          </span>
                          <div className="waveform">
                            <div className="waveform-bar" />
                            <div className="waveform-bar" />
                            <div className="waveform-bar" />
                            <div className="waveform-bar" />
                            <div className="waveform-bar" />
                            <div className="waveform-bar" />
                            <div className="waveform-bar" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <select 
                          value={selectedMusic}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedMusic(val);
                            if (val !== "custom") {
                              setMusicFile(null);
                              setMusicError("");
                              playSong(val); // Auto-play on change
                            }
                          }}
                          className="w-full bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm cursor-pointer pr-10"
                        >
                          <option value="/Happy Birthday Song.mp3" className="bg-gray-900">Default - Happy Birthday 🎂</option>
                          <option value="/happy birthday slowed.mp3" className="bg-gray-900">Happy Birthday (Slowed) 🎂</option>
                          <option value="/anniversary.mp3" className="bg-gray-900">Anniversary 💍</option>
                          <option value="/happy christmas.mp3" className="bg-gray-900">Happy Christmas 🎄</option>
                          <option value="/romantic.mp3" className="bg-gray-900">Romantic ❤️</option>
                          <option value="/pianocafe.mp3" className="bg-gray-900">Piano Cafe 🎹</option>
                          <option value="/funky groovin.mp3" className="bg-gray-900">Funky Groovin 🕺</option>
                          <option value="/playhouse.mp3" className="bg-gray-900">Playhouse 🎮</option>
                          <option value="none" className="bg-gray-900">No Background Music 🔇</option>
                          <option value="custom" className="bg-gray-900 font-bold text-purple-400">Upload Your Own Song 🎵</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-white/50">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={togglePreview}
                        disabled={selectedMusic === "none" || (selectedMusic === "custom" && !musicFile)}
                        className={`neon-btn neon-icon-btn ${isPlayingPreview ? "border-purple-400 shadow-[inset_0_0_20px_rgba(168,85,247,0.3),0_0_25px_rgba(168,85,247,0.5)]" : ""}`}
                        title={isPlayingPreview ? "Pause Preview" : "Play Preview"}
                      >
                        {isPlayingPreview ? (
                          <Pause className="h-5 w-5 animate-pulse" />
                        ) : (
                          <Play className="h-5 w-5 ml-0.5" />
                        )}
                      </button>

                    </div>
                  </div>

                  {selectedMusic === "custom" && (
                    <m.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-2 pl-2 border-l-2 border-purple-500/30"
                    >
                      <div className="flex justify-between items-center ml-1">
                        <label htmlFor="music" className="text-xs font-medium text-white/60">
                            Choose MP3 File
                        </label>
                        <span className="text-[10px] text-white/40">max 20MB</span>
                      </div>
                      <input
                        id="music"
                        type="file"
                        accept="audio/*"
                        onChange={handleMusicUpload}
                        className="w-full bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2 text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-500/20 file:text-purple-300 hover:file:bg-purple-500/30 transition-all text-sm cursor-pointer"
                      />
                      {musicError && <p className="text-red-400 text-xs mt-1 ml-1">{musicError}</p>}
                    </m.div>
                  )}
                </div>

                {error && (
                  <m.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium"
                  >
                    <p className="flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                       {error}
                    </p>
                    {error.includes("quota") && (
                      <p className="mt-2 text-[10px] text-red-300 opacity-80 leading-relaxed">
                        Tip: If you're on a free plan, you may have used all your storage. Try deleting old links or using a smaller audio file.
                      </p>
                    )}
                  </m.div>
                )}

                <Button 
                  type="submit" 
                  disabled={isGenerating || !name.trim()} 
                  onClick={handleRipple}
                  containerClassName="mt-4 w-full"
                >
                  {isGenerating ? (
                    <span className="flex flex-col items-center justify-center gap-1.5 py-1">
                      <span className="loading-wand">🪄</span>
                      <span className="flex items-center gap-2 text-xs md:text-sm font-medium tracking-wide">
                        <Sparkles className="animate-spin h-4 w-4 text-purple-300" />
                        <span>{loadingText}</span>
                      </span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center space-x-2 w-full">
                      <span>Generate Magic Link</span>
                      <ArrowRight className="h-5 w-5 transition-transform" />
                    </span>
                  )}
                </Button>
              </form>
            ) : (
              <m.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8 text-center relative z-10 py-6"
              >
                <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-green-400 to-emerald-600 flex items-center justify-center p-1 shadow-[0_0_30px_rgba(52,211,153,0.3)]">
                  <div className="bg-black/60 rounded-full w-full h-full flex items-center justify-center backdrop-blur-md">
                    <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-3xl font-bold text-white mb-3 font-serif">Magic Link Ready!</h3>
                  <p className="text-white/70 text-base max-w-xs mx-auto">Send this link to <span className="text-white font-medium">{name}</span> to surprise them.</p>
                </div>

                <div className="space-y-2 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wider text-purple-300/80 ml-1">
                    Your Magic Link
                  </span>
                  <div className="relative flex items-center bg-white/[0.05] backdrop-blur-md border border-white/15 rounded-full p-1.5 pl-5 gap-3 overflow-hidden shadow-inner focus-within:ring-2 focus-within:ring-purple-500/50 transition-all duration-300">
                    <p className="text-sm text-white/90 truncate font-mono select-all flex-1 text-left mr-2">
                      {generatedLink}
                    </p>
                    <Button 
                      onClick={copyToClipboard}
                      className="py-2.5 px-5 text-xs font-semibold flex items-center gap-1.5"
                      containerClassName="flex-shrink-0"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-300 animate-bounce" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {viewCount !== null && (
                  <div className="text-white/60 text-xs font-medium mt-4 flex items-center justify-center gap-1.5 bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 w-fit mx-auto shadow-sm">
                    <span className="flex items-center gap-1 text-white/50">
                      <Eye className="h-3.5 w-3.5" />
                      <span>Opened {viewCount} {viewCount === 1 ? "time" : "times"}</span>
                    </span>
                    {reactionsCount !== null && reactionsCount > 0 && (
                      <>
                        <span className="text-white/20">•</span>
                        <span className="flex items-center gap-1 text-pink-400">
                          <Heart className="h-3.5 w-3.5 fill-pink-500/80 stroke-pink-500 animate-pulse" />
                          <span>{reactionsCount} {reactionsCount === 1 ? "love" : "loves"}</span>
                        </span>
                      </>
                    )}
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full">
                  <Button 
                    onClick={() => { 
                      setGeneratedLink(""); 
                      setName(""); 
                      setMessage(""); 
                      setImageBase64("");
                      setImageFileName("");
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                        setPreviewUrl(null);
                      }
                      setMusicFile(null);
                      setMusicError("");
                      setError("");
                      setTheme("midnight");
                      setViewCount(null);
                      setReactionsCount(null);
                    }}
                    containerClassName="w-full sm:flex-1"
                    className="w-full justify-center text-sm font-semibold select-none"
                  >
                    Create Another
                  </Button>
                  <a 
                    href={generatedLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full sm:flex-1"
                  >
                    <Button 
                      containerClassName="w-full"
                      className="w-full justify-center text-sm font-semibold"
                    >
                      <span>Preview</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              </m.div>
            )}
          </SpotlightCard>
        </m.div>
      </m.div>
    </div>
      
      {/* Footer */}
      <footer className="w-full flex flex-col items-center gap-3 text-sm z-20 pb-6 pt-4">
        <div className="flex items-center gap-1.5 px-5 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:bg-white/10 hover:border-white/20 transition-all duration-300 group">
          <span className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-medium select-none">
            made by
          </span>
          <a 
            href="mailto:gousk2004@gmail.com" 
            className="text-gradient-gold font-bold tracking-wider hover:opacity-80 transition-all cursor-pointer text-xs md:text-sm drop-shadow-[0_0_8px_rgba(251,191,36,0.35)]"
          >
            Gous Khan
          </a>
        </div>
      </footer>

      {/* Hidden Audio Player for Preview */}
      <audio 
        ref={audioRef} 
        onPlay={() => setIsPlayingPreview(true)}
        onPause={() => setIsPlayingPreview(false)}
        onEnded={() => setIsPlayingPreview(false)}
        className="hidden" 
        preload="none"
      />
    </main>
  );
}
