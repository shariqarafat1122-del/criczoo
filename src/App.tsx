import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LiveScorePage from "./pages/LiveScorePage";
import LiveMatch from "./pages/LiveMatch";
import LiveTrainPage from ".pages/TrainTracking";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/live-score/:matchId" element={<LiveScorePage />}/>
        <Route path="/live-match/:matchId" element={<LiveMatch />}/>
        <Route path="/train-tracking/:trainNo" element={<LiveTrainPage />}/>
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
