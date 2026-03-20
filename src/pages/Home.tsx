import { useState } from "react";
import SpotlightCard from "@/components/SpotlightCard";
import { Button } from "@/components/ui/Button";
import { MouseTrail } from "@/components/effects/MouseTrail";
import { motion } from "framer-motion";
import { Copy, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { saveSurpriseData } from "@/lib/db";

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
          
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          
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
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          
          if (compressedBase64.length > 800 * 1024) { 
            setImageError("Image is too large even after compression.");
            setImageBase64("");
            setImageFileName("");
          } else {
            setImageError("");
            setImageBase64(compressedBase64);
            setImageFileName(file.name);
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
        musicBase64: musicBase64,
        selectedMusic: selectedMusic,
        imageBase64: imageBase64
      };

      setError("");
      const finalMessageString = JSON.stringify(payload);

      const id = await saveSurpriseData({ name, message: finalMessageString });
      if (id) {
        setGeneratedLink(`${window.location.origin}/surprise/${id}`);
      }
    } catch (err: any) {
      console.error(err);
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

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between p-4 sm:p-8 overflow-hidden">
      <MouseTrail />
      
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-xl z-10 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center space-x-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md mb-6 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-white/80">Digital Surprise Gift</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 font-serif text-gradient-gold drop-shadow-lg">
            Create a Magical Page
          </h1>
          <p className="text-lg text-white/70 font-light max-w-md mx-auto">
            Craft a beautiful, personalized animated experience for someone special.
          </p>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          <SpotlightCard className="p-8 md:p-10 border-white/10 !bg-black/40 relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            {!generatedLink ? (
              <form onSubmit={handleGenerate} className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-white/80 ml-1">
                    Who is this for?
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter their name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium text-white/80 ml-1">
                    Your Special Message <span className="text-white/40">(Optional)</span>
                  </label>
                  <textarea
                    id="message"
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write something nice..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none font-medium text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label htmlFor="finaleText" className="text-sm font-medium text-white/80">
                      Finale Message
                    </label>
                    <span className="text-[10px] text-white/40">e.g. Happy Anniversary!</span>
                  </div>
                  <input
                    id="finaleText"
                    type="text"
                    value={finaleText}
                    onChange={(e) => setFinaleText(e.target.value)}
                    placeholder="HAPPY BIRTHDAY! 🎂"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label htmlFor="photo" className="text-sm font-medium text-white/80">
                      Heart Photo <span className="text-white/40">(Optional)</span>
                    </label>
                  </div>
                  <input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-pink-500/20 file:text-pink-300 hover:file:bg-pink-500/30 transition-all font-medium text-sm cursor-pointer"
                  />
                  {imageError && <p className="text-red-400 text-xs mt-1 ml-1">{imageError}</p>}
                  {imageFileName && !imageError && <p className="text-green-400 text-xs mt-1 ml-1">✓ {imageFileName} attached</p>}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80 ml-1">
                      Background Music <span className="text-white/40">(Optional)</span>
                    </label>
                    <div className="relative">
                      <select 
                        value={selectedMusic}
                        onChange={(e) => {
                          setSelectedMusic(e.target.value);
                          if (e.target.value !== "custom") {
                            setMusicFile(null);
                            setMusicError("");
                          }
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm cursor-pointer"
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
                  </div>

                  {selectedMusic === "custom" && (
                    <motion.div 
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
                        className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-500/20 file:text-purple-300 hover:file:bg-purple-500/30 transition-all text-sm cursor-pointer"
                      />
                      {musicError && <p className="text-red-400 text-xs mt-1 ml-1">{musicError}</p>}
                    </motion.div>
                  )}
                </div>

                {error && (
                  <motion.div 
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
                  </motion.div>
                )}

                <Button 
                  type="submit" 
                  disabled={isGenerating || !name.trim()} 
                  className="w-full group py-4 text-base mt-4"
                >
                  {isGenerating ? (
                    <span className="flex items-center space-x-2">
                      <Sparkles className="animate-spin h-5 w-5" />
                      <span>Brewing Magic...</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-2">
                      <span>Generate Magic Link</span>
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </span>
                  )}
                </Button>
              </form>
            ) : (
              <motion.div 
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

                <div className="p-4 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between gap-3 overflow-hidden shadow-inner">
                  <p className="text-sm text-white/90 truncate font-mono select-all flex-1 text-left">{generatedLink}</p>
                  <button 
                    onClick={copyToClipboard}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-white flex-shrink-0 active:scale-95"
                  >
                    {copied ? <CheckCircle2 className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5" />}
                  </button>
                </div>
                
                <div className="flex gap-4 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => { setGeneratedLink(""); setName(""); setMessage(""); }}
                    className="w-full"
                  >
                    Create Another
                  </Button>
                  <Button 
                    onClick={() => window.open(generatedLink, '_blank')}
                    className="w-full"
                  >
                    Preview
                  </Button>
                </div>
              </motion.div>
            )}
          </SpotlightCard>
        </motion.div>
      </div>
      
      {/* Footer */}
      <footer className="w-full flex flex-col items-center gap-1.5 text-white/40 text-sm font-light z-20 pb-2 md:pb-4">
        <p>
          Made by <span className="font-medium text-white/70">Gous Khan</span>
        </p>
        <p className="text-xs">
          &copy; {new Date().getFullYear()} Digital Surprise Gift
        </p>
        <div className="mt-1">
          <a 
            href="mailto:gousk2004@gmail.com" 
            className="text-white/40 hover:text-white/80 transition-colors text-xs flex items-center gap-1 border border-white/10 rounded-full px-3 py-1 bg-white/5 hover:bg-white/10"
          >
            Contact
          </a>
        </div>
      </footer>
    </main>
  );
}
