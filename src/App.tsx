import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LiveScorePage from "./pages/LiveScorePage";
import LiveMatch from "./pages/LiveMatch";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/live-score/:matchId" element={<LiveScorePage />}/>
        <Router path="/live-match/:matchId" element={<LiveMatch />}/>
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
