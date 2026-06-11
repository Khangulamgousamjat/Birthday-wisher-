import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import { Sparkles } from "lucide-react";

// Lazy load the recipient experience page to ensure creator side loads instantly
const Surprise = React.lazy(() => import("./pages/Surprise"));

function App() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Background Video (Preloaded as metadata to avoid blocking page load) */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className="fixed inset-0 w-full h-full object-cover z-[-2] pointer-events-none opacity-35 transition-opacity duration-1000"
      >
        <source src="/Digital Marketing Website Background_1080p.mp4" type="video/mp4" />
      </video>
      
      {/* Dark overlay to ensure text contrast and readability */}
      <div className="fixed inset-0 bg-black/45 z-[-1] pointer-events-none" />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/surprise/:id" 
          element={
            <Suspense fallback={
              <div className="min-h-screen bg-black flex items-center justify-center text-white/50">
                <Sparkles className="animate-spin w-8 h-8 mr-2 text-purple-400" />
                Loading your magic...
              </div>
            }>
              <Surprise />
            </Suspense>
          } 
        />
      </Routes>
    </div>
  );
}

export default App;
