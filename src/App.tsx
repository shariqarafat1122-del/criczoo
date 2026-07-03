import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LiveScorePage from "./pages/LiveScorePage";
import LiveMatch from "./pages/LiveMatch";
import LiveTrainPage from "./pages/TrainTracking";
import Squad from './pages/Squad';
import PlayerProfilePage from './pages/Profile';


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/live-score/:matchId" element={<LiveScorePage />}/>
        <Route path="/live-match/:matchId" element={<LiveMatch />}/>
        <Route path="/train-tracking" element={<LiveTrainPage />}/>
        <Route path="/team-squad/:matchId" element={<Squad />}/>
        <Route path="/player/:profileId" element={<PlayerProfilePage />}/>
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
