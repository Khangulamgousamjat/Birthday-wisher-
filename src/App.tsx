import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Surprise from "./pages/Surprise";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/surprise/:id" element={<Surprise />} />
    </Routes>
  );
}

export default App;
