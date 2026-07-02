import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LiveScorePage from "./pages/LiveScorePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route
          path="/live-score/:matchId"
          element={<LiveScorePage />}
        />

        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
