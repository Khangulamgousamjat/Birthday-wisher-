import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { LazyMotion, domAnimation } from "framer-motion";
import { Sparkles } from "lucide-react";

// Lazy load both pages — Home loads fast, Surprise loads only when navigated to
const Home = React.lazy(() => import("./pages/Home"));
const Surprise = React.lazy(() => import("./pages/Surprise"));

const LoadingScreen = () => (
  <div className="min-h-screen bg-black flex items-center justify-center text-white/50">
    <Sparkles className="animate-spin w-8 h-8 mr-2 text-purple-400" />
    Loading your magic...
  </div>
);

function App() {
  return (
    <LazyMotion features={domAnimation} strict>
      <div className="relative min-h-screen w-full overflow-x-hidden">
        {/* Video Background */}
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
            <source src="/background.mp4" type="video/mp4" />
          </video>
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/30" />
        </div>

        <Routes>
          <Route
            path="/"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <Home />
              </Suspense>
            }
          />
          <Route
            path="/surprise/:id"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <Surprise />
              </Suspense>
            }
          />
        </Routes>
      </div>
    </LazyMotion>
  );
}

export default App;
