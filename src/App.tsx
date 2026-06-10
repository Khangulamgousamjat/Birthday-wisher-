import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Surprise from "./pages/Surprise";

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
        <Route path="/surprise/:id" element={<Surprise />} />
      </Routes>
    </div>
  );
}

export default App;
