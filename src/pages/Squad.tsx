import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

type Player = {
  profileId: string;
  name: string;
  role: string;
  captain: boolean;
  keeper: boolean;
};

export default function Squad() {
  const { matchId } = useParams();

  const [team1, setTeam1] = useState<Player[]>([]);
  const [team2, setTeam2] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchId) return;

    async function loadSquad() {
      try {
        const res = await fetch(`/api/score/squad?matchId=${matchId}`);
        const data = await res.json();

        setTeam1(data.team1 || []);
        setTeam2(data.team2 || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadSquad();
  }, [matchId]);

  if (loading) {
    return <div style={{ padding: 20 }}>Loading...</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Team 1</h2>

      {team1.map((p) => (
        <div
          key={p.profileId}
          style={{
            padding: "10px 0",
            borderBottom: "1px solid #ddd",
          }}
        >
          <div>
            <strong>{p.name}</strong>
            {p.captain && " (C)"}
            {p.keeper && " (WK)"}
          </div>

          <div>{p.role}</div>
        </div>
      ))}

      <br />
      <br />

      <h2>Team 2</h2>

      {team2.map((p) => (
        <div
          key={p.profileId}
          style={{
            padding: "10px 0",
            borderBottom: "1px solid #ddd",
          }}
        >
          <div>
            <strong>{p.name}</strong>
            {p.captain && " (C)"}
            {p.keeper && " (WK)"}
          </div>

          <div>{p.role}</div>
        </div>
      ))}
    </div>
  );
}
