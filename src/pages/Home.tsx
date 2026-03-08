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
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsGenerating(true);
    try {
      const id = await saveSurpriseData({ name, message });
      if (id) {
        setGeneratedLink(`${window.location.origin}/surprise/${id}`);
      }
    } catch (error) {
      console.error(error);
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
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write something nice..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none font-medium"
                  />
                </div>

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
