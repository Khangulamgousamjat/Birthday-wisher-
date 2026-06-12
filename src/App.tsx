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
        {/* GPU-friendly CSS Aurora Background — replaces heavy MP4 video */}
        <div className="aurora-bg" aria-hidden="true">
          <div className="aurora-blob aurora-blob--1" />
          <div className="aurora-blob aurora-blob--2" />
          <div className="aurora-blob aurora-blob--3" />
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
