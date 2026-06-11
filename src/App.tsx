import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import { Sparkles } from "lucide-react";

// Lazy load the recipient experience page to ensure creator side loads instantly
const Surprise = React.lazy(() => import("./pages/Surprise"));

function App() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Premium Video Background */}
      <div className="aurora-bg" aria-hidden="true">
        <video
          autoPlay
          loop
          muted
          playsInline
          disablePictureInPicture
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ willChange: "transform" }}
        >
          <source src="/bright shimmering dust flickering particles light background purple video_1080p.mp4" type="video/mp4" />
        </video>
        {/* Thin dark overlay — lets video show, keeps text readable */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

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
