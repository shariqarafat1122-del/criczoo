/**
 * SquadPage.tsx
 * ------------------------------------------------------------------
 * Premium, mobile-first Cricket Match Squad screen — Cricbuzz / ESPN
 * Cricinfo inspired. Built as a single self-contained TSX module.
 *
 * Stack: React 19 + TypeScript + Tailwind CSS
 *
 * Component tree (all colocated below, in dependency order):
 *   SquadPage
 *     ├─ SquadHeader
 *     ├─ MatchInfoCard
 *     ├─ TeamTabs
 *     ├─ TeamSection
 *     │    ├─ PlayingXICard
 *     │    │    └─ PlayerRow
 *     │    └─ BenchSection
 *     │         └─ PlayerRow (compact)
 *     ├─ SkeletonLoader
 *     ├─ ErrorState
 *     └─ EmptyState
 *
 * API contract (see fetchSquad):
 *   GET /api/score/squad?matchId=:matchId
 *   -> SquadApiResponse
 * ------------------------------------------------------------------
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/* ================================================================== *
 *  TYPES
 * ================================================================== */

type PlayerRole =
  | "WK Batter"
  | "Batter"
  | "Batting All Rounder"
  | "Bowling All Rounder"
  | "All Rounder"
  | "Fast Bowler"
  | "Spinner"
  | "Bowler";

interface Player {
  profileId: string;
  name: string;
  role: PlayerRole;
  captain: boolean;
  keeper: boolean;
  playingXI: boolean;
  image: string;
}

interface SquadApiResponse {
  success: boolean;
  seriesName: string;
  venue: string;
  matchStatus: string;
  matchDateTime: string;
  team1Name: string;
  team2Name: string;
  team1ShortName: string;
  team2ShortName: string;
  team1Flag: string;
  team2Flag: string;
  team1: Player[];
  team2: Player[];
}

type LoadState = "loading" | "error" | "empty" | "ready";

/* ================================================================== *
 *  MOCK DATA (stand-in for the real API — no hardcoded UI, only data)
 * ================================================================== */

const flag = (seed: string) =>
  `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(
    seed
  )}&backgroundType=gradientLinear`;

const avatar = (seed: string) =>
  `https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(
    seed
  )}&backgroundColor=e8f7f1`;

const ENGLAND_W: Player[] = [
  { profileId: "e1", name: "Amy Jones", role: "WK Batter", captain: false, keeper: true, playingXI: true, image: avatar("Amy Jones") },
  { profileId: "e2", name: "Tammy Beaumont", role: "Batter", captain: false, keeper: false, playingXI: true, image: avatar("Tammy Beaumont") },
  { profileId: "e3", name: "Nat Sciver-Brunt", role: "Batting All Rounder", captain: true, keeper: false, playingXI: true, image: avatar("Nat Sciver-Brunt") },
  { profileId: "e4", name: "Heather Knight", role: "Batter", captain: false, keeper: false, playingXI: true, image: avatar("Heather Knight") },
  { profileId: "e5", name: "Alice Capsey", role: "Batting All Rounder", captain: false, keeper: false, playingXI: true, image: avatar("Alice Capsey") },
  { profileId: "e6", name: "Danni Wyatt", role: "Batter", captain: false, keeper: false, playingXI: true, image: avatar("Danni Wyatt") },
  { profileId: "e7", name: "Sophie Ecclestone", role: "Spinner", captain: false, keeper: false, playingXI: true, image: avatar("Sophie Ecclestone") },
  { profileId: "e8", name: "Charlie Dean", role: "Bowling All Rounder", captain: false, keeper: false, playingXI: true, image: avatar("Charlie Dean") },
  { profileId: "e9", name: "Lauren Filer", role: "Fast Bowler", captain: false, keeper: false, playingXI: true, image: avatar("Lauren Filer") },
  { profileId: "e10", name: "Lauren Bell", role: "Fast Bowler", captain: false, keeper: false, playingXI: true, image: avatar("Lauren Bell") },
  { profileId: "e11", name: "Mahika Gaur", role: "Spinner", captain: false, keeper: false, playingXI: true, image: avatar("Mahika Gaur") },
  { profileId: "e12", name: "Bess Heath", role: "WK Batter", captain: false, keeper: true, playingXI: false, image: avatar("Bess Heath") },
  { profileId: "e13", name: "Issy Wong", role: "Fast Bowler", captain: false, keeper: false, playingXI: false, image: avatar("Issy Wong") },
  { profileId: "e14", name: "Freya Kemp", role: "Bowling All Rounder", captain: false, keeper: false, playingXI: false, image: avatar("Freya Kemp") },
  { profileId: "e15", name: "Linsey Smith", role: "Spinner", captain: false, keeper: false, playingXI: false, image: avatar("Linsey Smith") },
];

const SA_W: Player[] = [
  { profileId: "s1", name: "Tazmin Brits", role: "Batter", captain: false, keeper: false, playingXI: true, image: avatar("Tazmin Brits") },
  { profileId: "s2", name: "Laura Wolvaardt", role: "Batter", captain: true, keeper: false, playingXI: true, image: avatar("Laura Wolvaardt") },
  { profileId: "s3", name: "Anneke Bosch", role: "Batter", captain: false, keeper: false, playingXI: true, image: avatar("Anneke Bosch") },
  { profileId: "s4", name: "Sune Luus", role: "Batting All Rounder", captain: false, keeper: false, playingXI: true, image: avatar("Sune Luus") },
  { profileId: "s5", name: "Marizanne Kapp", role: "Bowling All Rounder", captain: false, keeper: false, playingXI: true, image: avatar("Marizanne Kapp") },
  { profileId: "s6", name: "Sinalo Jafta", role: "WK Batter", captain: false, keeper: true, playingXI: true, image: avatar("Sinalo Jafta") },
  { profileId: "s7", name: "Annerie Dercksen", role: "Batting All Rounder", captain: false, keeper: false, playingXI: true, image: avatar("Annerie Dercksen") },
  { profileId: "s8", name: "Nonkululeko Mlaba", role: "Spinner", captain: false, keeper: false, playingXI: true, image: avatar("Nonkululeko Mlaba") },
  { profileId: "s9", name: "Masabata Klaas", role: "Fast Bowler", captain: false, keeper: false, playingXI: true, image: avatar("Masabata Klaas") },
  { profileId: "s10", name: "Ayabonga Khaka", role: "Fast Bowler", captain: false, keeper: false, playingXI: true, image: avatar("Ayabonga Khaka") },
  { profileId: "s11", name: "Nadine de Klerk", role: "Bowling All Rounder", captain: false, keeper: false, playingXI: true, image: avatar("Nadine de Klerk") },
  { profileId: "s12", name: "Chloe Tryon", role: "Batting All Rounder", captain: false, keeper: false, playingXI: false, image: avatar("Chloe Tryon") },
  { profileId: "s13", name: "Tumi Sekhukhune", role: "Fast Bowler", captain: false, keeper: false, playingXI: false, image: avatar("Tumi Sekhukhune") },
  { profileId: "s14", name: "Miché Prinsloo", role: "WK Batter", captain: false, keeper: true, playingXI: false, image: avatar("Miché Prinsloo") },
];

const MOCK_RESPONSE: SquadApiResponse = {
  success: true,
  seriesName: "ICC Women's Championship 2026",
  venue: "County Ground, Bristol",
  matchStatus: "Preview",
  matchDateTime: "Sat, 04 Jul 2026 · 2:00 PM Local",
  team1Name: "England Women",
  team2Name: "South Africa Women",
  team1ShortName: "ENG-W",
  team2ShortName: "SA-W",
  team1Flag: flag("England"),
  team2Flag: flag("South Africa"),
  team1: ENGLAND_W,
  team2: SA_W,
};

/**
 * Fetches squad data for a given match.
 * GET /api/score/squad?matchId=:matchId
 *
 * In production this performs a real network call. Here it's mocked
 * with a simulated latency so the loading / error states are real.
 */
async function fetchSquad(
  matchId: string,
  opts?: { simulateError?: boolean }
): Promise<SquadApiResponse> {
  await new Promise((resolve) => setTimeout(resolve, 1100));
  if (opts?.simulateError) {
    throw new Error("Network request failed");
  }
  return MOCK_RESPONSE;
}

/* ================================================================== *
 *  ICONS (inline SVG — zero external icon dependency)
 * ================================================================== */

const IconChevronLeft: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M15 18l-6-6 6-6"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconShare: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M12 5v9.5M12 5l3.5 3.5M12 5L8.5 8.5"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6 12v5.5A1.5 1.5 0 007.5 19h9a1.5 1.5 0 001.5-1.5V12"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconLocation: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M12 21s-6.5-5.6-6.5-11A6.5 6.5 0 1118.5 10c0 5.4-6.5 11-6.5 11z"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinejoin="round"
    />
    <circle cx="12" cy="10" r="2.25" stroke="currentColor" strokeWidth={1.75} />
  </svg>
);

const IconClock: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth={1.75} />
    <path
      d="M12 7.5V12l3 2"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconRefresh: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M4 12a8 8 0 0114-5.3M20 12a8 8 0 01-14 5.3"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    />
    <path
      d="M18 4v4h-4M6 20v-4h4"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* Cricket-flavoured illustration for the error state (crossed bat + ball) */
const IllustrationBatBall: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 160 160" fill="none" className={className} aria-hidden="true">
    <circle cx="80" cy="80" r="76" fill="#EEF3F1" />
    <circle cx="80" cy="80" r="76" stroke="#DCE6E1" strokeWidth="1.5" />
    <g transform="rotate(-32 80 80)">
      <rect x="74" y="30" width="12" height="70" rx="6" fill="#C7CED6" />
      <rect x="70" y="94" width="20" height="34" rx="8" fill="#8B6A4A" />
      <rect x="70" y="94" width="20" height="6" rx="3" fill="#6E5237" />
    </g>
    <circle cx="102" cy="54" r="15" fill="#CC3B3B" />
    <path
      d="M92 47a15 15 0 000 14M112 47a15 15 0 010 14"
      stroke="#F6D9D9"
      strokeWidth="1.5"
    />
  </svg>
);

/* Empty-state illustration (single upright bat) */
const IllustrationBat: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 140 140" fill="none" className={className} aria-hidden="true">
    <circle cx="70" cy="70" r="66" fill="#EEF3F1" />
    <rect x="63" y="20" width="14" height="62" rx="7" fill="#C7CED6" />
    <rect x="58" y="80" width="24" height="40" rx="9" fill="#8B6A4A" />
    <rect x="58" y="80" width="24" height="7" rx="3.5" fill="#6E5237" />
  </svg>
);

/* ================================================================== *
 *  PRIMITIVE UI HELPERS
 * ================================================================== */

const RoleBadges: React.FC<{ player: Player }> = ({ player }) => (
  <div className="flex shrink-0 items-center gap-1.5">
    {player.captain && (
      <span
        className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#009270] px-1.5 text-[10px] font-bold leading-none text-white shadow-sm"
        title="Captain"
      >
        C
      </span>
    )}
    {player.keeper && (
      <span
        className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-500 px-1.5 text-[10px] font-bold leading-none text-white shadow-sm"
        title="Wicket Keeper"
      >
        WK
      </span>
    )}
    {player.playingXI && (
      <span
        className="h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-emerald-100"
        title="Playing XI"
      />
    )}
  </div>
);

const LazyAvatar: React.FC<{
  src: string;
  alt: string;
  size: number;
}> = ({ src, alt, size }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <span
      className="relative shrink-0 overflow-hidden rounded-full border border-black/5 bg-gray-100 shadow-sm"
      style={{ width: size, height: size }}
    >
      {!loaded && (
        <span className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-200 to-gray-100" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </span>
  );
};

/* ================================================================== *
 *  PLAYER ROW
 * ================================================================== */

const PlayerRow: React.FC<{ player: Player; compact?: boolean }> = ({
  player,
  compact = false,
}) => {
  const size = compact ? 40 : 48;
  return (
    <div
      className={`group flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3 last:border-b-0 transition-transform duration-[250ms] ease-out hover:z-10 hover:scale-[1.01] hover:shadow-md active:scale-[0.99] ${
        compact ? "min-h-[60px]" : "min-h-[72px]"
      }`}
    >
      <LazyAvatar src={player.image} alt={player.name} size={size} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold leading-tight text-gray-900">
          {player.name}
        </p>
        <p className="mt-0.5 truncate text-[13px] font-medium leading-tight text-gray-500">
          {player.role}
        </p>
      </div>

      <RoleBadges player={player} />
    </div>
  );
};

/* ================================================================== *
 *  HEADER
 * ================================================================== */

const SquadHeader: React.FC<{ onBack?: () => void; onShare?: () => void }> = ({
  onBack,
  onShare,
}) => (
  <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur-md">
    <div className="mx-auto flex h-14 max-w-md items-center justify-between px-3">
      <button
        type="button"
        onClick={onBack}
        aria-label="Go back"
        className="flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition-colors duration-200 hover:bg-gray-100 active:bg-gray-200"
      >
        <IconChevronLeft className="h-5 w-5" />
      </button>

      <h1 className="text-[17px] font-bold tracking-tight text-gray-900">
        Squads
      </h1>

      <button
        type="button"
        onClick={onShare}
        aria-label="Share"
        className="flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition-colors duration-200 hover:bg-gray-100 active:bg-gray-200"
      >
        <IconShare className="h-[18px] w-[18px]" />
      </button>
    </div>
  </header>
);

/* ================================================================== *
 *  MATCH INFO CARD
 * ================================================================== */

const MatchInfoCard: React.FC<{
  data: Pick<
    SquadApiResponse,
    | "team1Name"
    | "team2Name"
    | "team1ShortName"
    | "team2ShortName"
    | "team1Flag"
    | "team2Flag"
    | "seriesName"
    | "venue"
    | "matchStatus"
    | "matchDateTime"
  >;
}> = ({ data }) => (
  <div className="mx-4 mt-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_2px_20px_-4px_rgba(15,23,42,0.08)]">
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-1 flex-col items-center gap-2 text-center">
        <span className="h-12 w-12 overflow-hidden rounded-full border border-gray-100 shadow-sm">
          <img
            src={data.team1Flag}
            alt={data.team1Name}
            className="h-full w-full object-cover"
          />
        </span>
        <span className="text-[13px] font-bold tracking-wide text-gray-900">
          {data.team1ShortName}
        </span>
      </div>

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#009270] shadow-[0_4px_12px_-2px_rgba(0,146,112,0.55)]">
        <span className="text-[11px] font-extrabold tracking-wide text-white">
          VS
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center gap-2 text-center">
        <span className="h-12 w-12 overflow-hidden rounded-full border border-gray-100 shadow-sm">
          <img
            src={data.team2Flag}
            alt={data.team2Name}
            className="h-full w-full object-cover"
          />
        </span>
        <span className="text-[13px] font-bold tracking-wide text-gray-900">
          {data.team2ShortName}
        </span>
      </div>
    </div>

    <div className="mx-auto mt-5 h-px w-full bg-gray-100" />

    <div className="mt-4 flex flex-col items-center gap-1.5 text-center">
      <p className="text-[13px] font-semibold text-[#009270]">
        {data.seriesName}
      </p>
      <p className="flex items-center gap-1 text-[13px] text-gray-500">
        <IconLocation className="h-3.5 w-3.5 text-gray-400" />
        {data.venue}
      </p>
      <span className="mt-1 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-600">
        {data.matchStatus}
      </span>
      <p className="mt-1 flex items-center gap-1 text-[12px] text-gray-400">
        <IconClock className="h-3.5 w-3.5" />
        {data.matchDateTime}
      </p>
    </div>
  </div>
);

/* ================================================================== *
 *  TEAM TABS (segmented control)
 * ================================================================== */

const TeamTabs: React.FC<{
  team1Label: string;
  team2Label: string;
  activeIndex: 0 | 1;
  onChange: (index: 0 | 1) => void;
}> = ({ team1Label, team2Label, activeIndex, onChange }) => {
  const tabs = [team1Label, team2Label];

  return (
    <div className="mx-4 mt-4">
      <div className="relative flex rounded-2xl bg-gray-100 p-1">
        <span
          className="absolute inset-y-1 w-[calc(50%-4px)] rounded-xl bg-[#009270] shadow-[0_2px_10px_-2px_rgba(0,146,112,0.6)] transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(${activeIndex === 0 ? "2px" : "calc(100% + 6px)"})`,
          }}
          aria-hidden="true"
        />
        {tabs.map((label, index) => {
          const selected = index === activeIndex;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onChange(index as 0 | 1)}
              className={`relative z-10 flex-1 rounded-xl py-2.5 text-[13px] font-bold transition-colors duration-300 ${
                selected ? "text-white" : "text-gray-500 hover:text-gray-700"
              }`}
              aria-pressed={selected}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ================================================================== *
 *  PLAYING XI CARD + BENCH SECTION
 * ================================================================== */

const SectionCard: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => (
  <div className="mx-4 mt-4 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_2px_16px_-6px_rgba(15,23,42,0.08)]">
    <div className="flex items-center gap-2.5 px-5 pb-3 pt-5">
      <span className="h-5 w-1 rounded-full bg-[#009270]" />
      <div>
        <h2 className="text-[15px] font-bold tracking-tight text-gray-900">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[11px] font-medium text-gray-400">{subtitle}</p>
        )}
      </div>
    </div>
    <div>{children}</div>
  </div>
);

const PlayingXICard: React.FC<{ players: Player[] }> = ({ players }) => {
  const xi = players.filter((p) => p.playingXI);
  return (
    <SectionCard title="Playing XI" subtitle={`${xi.length} players`}>
      {xi.map((player) => (
        <PlayerRow key={player.profileId} player={player} />
      ))}
    </SectionCard>
  );
};

const BenchSection: React.FC<{ players: Player[] }> = ({ players }) => {
  const bench = players.filter((p) => !p.playingXI);
  if (bench.length === 0) return null;
  return (
    <SectionCard title="Bench Players" subtitle={`${bench.length} players`}>
      {bench.map((player) => (
        <PlayerRow key={player.profileId} player={player} compact />
      ))}
    </SectionCard>
  );
};

/* ================================================================== *
 *  TEAM SECTION
 * ================================================================== */

const TeamSection: React.FC<{
  teamName: string;
  teamFlag: string;
  players: Player[];
}> = ({ teamName, teamFlag, players }) => (
  <section className="pb-2">
    <div className="mx-4 mt-5 flex items-center gap-3">
      <span className="h-9 w-9 overflow-hidden rounded-full border border-gray-100 shadow-sm">
        <img src={teamFlag} alt={teamName} className="h-full w-full object-cover" />
      </span>
      <h2 className="text-[16px] font-extrabold tracking-tight text-gray-900">
        {teamName}
      </h2>
    </div>

    <PlayingXICard players={players} />
    <BenchSection players={players} />
  </section>
);

/* ================================================================== *
 *  SKELETON LOADER
 * ================================================================== */

const SkeletonRow: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <div
    className={`flex items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0 ${
      compact ? "min-h-[60px]" : "min-h-[72px]"
    }`}
  >
    <span
      className="shrink-0 animate-pulse rounded-full bg-gray-200"
      style={{ width: compact ? 40 : 48, height: compact ? 40 : 48 }}
    />
    <div className="flex-1 space-y-2">
      <span className="block h-3.5 w-2/5 animate-pulse rounded-full bg-gray-200" />
      <span className="block h-3 w-1/4 animate-pulse rounded-full bg-gray-150 bg-gray-100" />
    </div>
    <span className="h-5 w-8 animate-pulse rounded-full bg-gray-200" />
  </div>
);

const SkeletonLoader: React.FC = () => (
  <div className="animate-in fade-in duration-300">
    {/* Match card skeleton */}
    <div className="mx-4 mt-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-1 flex-col items-center gap-2">
          <span className="h-12 w-12 animate-pulse rounded-full bg-gray-200" />
          <span className="h-3 w-10 animate-pulse rounded-full bg-gray-200" />
        </div>
        <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-gray-200" />
        <div className="flex flex-1 flex-col items-center gap-2">
          <span className="h-12 w-12 animate-pulse rounded-full bg-gray-200" />
          <span className="h-3 w-10 animate-pulse rounded-full bg-gray-200" />
        </div>
      </div>
      <div className="mt-5 flex flex-col items-center gap-2">
        <span className="h-3 w-40 animate-pulse rounded-full bg-gray-200" />
        <span className="h-3 w-28 animate-pulse rounded-full bg-gray-200" />
        <span className="h-3 w-20 animate-pulse rounded-full bg-gray-200" />
      </div>
    </div>

    {/* Tabs skeleton */}
    <div className="mx-4 mt-4 h-11 animate-pulse rounded-2xl bg-gray-100" />

    {/* Team header skeleton */}
    <div className="mx-4 mt-5 flex items-center gap-3">
      <span className="h-9 w-9 animate-pulse rounded-full bg-gray-200" />
      <span className="h-4 w-32 animate-pulse rounded-full bg-gray-200" />
    </div>

    {/* Playing XI skeleton */}
    <div className="mx-4 mt-4 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 px-5 pb-3 pt-5">
        <span className="h-5 w-1 rounded-full bg-gray-200" />
        <span className="h-4 w-24 animate-pulse rounded-full bg-gray-200" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  </div>
);

/* ================================================================== *
 *  ERROR STATE
 * ================================================================== */

const ErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="flex flex-col items-center px-8 py-20 text-center">
    <IllustrationBatBall className="h-36 w-36" />
    <h2 className="mt-6 text-[17px] font-bold text-gray-900">
      Unable to load Squad
    </h2>
    <p className="mt-1.5 max-w-[240px] text-[13px] leading-relaxed text-gray-500">
      Please check your internet connection.
    </p>
    <button
      type="button"
      onClick={onRetry}
      className="mt-6 flex items-center gap-2 rounded-full bg-[#009270] px-6 py-3 text-[13px] font-bold text-white shadow-[0_6px_16px_-4px_rgba(0,146,112,0.55)] transition-transform duration-200 active:scale-95"
    >
      <IconRefresh className="h-4 w-4" />
      Retry
    </button>
  </div>
);

/* ================================================================== *
 *  EMPTY STATE
 * ================================================================== */

const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center px-8 py-20 text-center">
    <IllustrationBat className="h-32 w-32" />
    <h2 className="mt-6 text-[16px] font-bold text-gray-900">
      No Squad Available
    </h2>
    <p className="mt-1.5 max-w-[240px] text-[13px] leading-relaxed text-gray-500">
      Squad details for this match haven&apos;t been announced yet.
    </p>
  </div>
);

/* ================================================================== *
 *  ROOT: SquadPage
 * ================================================================== */

const Squad: React.FC<{ matchId?: string }> = ({
  matchId = "68421",
}) => {
  const [state, setState] = useState<LoadState>("loading");
  const [data, setData] = useState<SquadApiResponse | null>(null);
  const [activeTeam, setActiveTeam] = useState<0 | 1>(0);
  const forceErrorNext = useRef(false);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetchSquad(`/api/score/squad?matchId=${matchId}`, {
        simulateError: forceErrorNext.current,
      });
      forceErrorNext.current = false;

      if (!response.success) {
        setState("error");
        return;
      }
      const hasPlayers =
        (response.team1?.length ?? 0) > 0 || (response.team2?.length ?? 0) > 0;
      if (!hasPlayers) {
        setData(response);
        setState("empty");
        return;
      }
      setData(response);
      setState("ready");
    } catch {
      setState("error");
    }
  }, [matchId]);

  useEffect(() => {
    load();
  }, [load]);

  const activeTeamData = useMemo(() => {
    if (!data) return null;
    return activeTeam === 0
      ? { name: data.team1Name, flag: data.team1Flag, players: data.team1 }
      : { name: data.team2Name, flag: data.team2Flag, players: data.team2 };
  }, [data, activeTeam]);

  const handleShare = useCallback(() => {
    if (navigator.share && data) {
      navigator
        .share({
          title: "Squads",
          text: `${data.team1ShortName} vs ${data.team2ShortName} — ${data.seriesName}`,
        })
        .catch(() => {});
    }
  }, [data]);

  return (
    <div className="min-h-screen w-full bg-[#F5F7FA] font-sans antialiased">
      <div className="mx-auto w-full max-w-md">
        <SquadHeader onBack={() => {}} onShare={handleShare} />

        {state === "loading" && <SkeletonLoader />}

        {state === "error" && <ErrorState onRetry={load} />}

        {state === "empty" && <EmptyState />}

        {state === "ready" && data && activeTeamData && (
          <>
            <MatchInfoCard
              data={{
                team1Name: data.team1Name,
                team2Name: data.team2Name,
                team1ShortName: data.team1ShortName,
                team2ShortName: data.team2ShortName,
                team1Flag: data.team1Flag,
                team2Flag: data.team2Flag,
                seriesName: data.seriesName,
                venue: data.venue,
                matchStatus: data.matchStatus,
                matchDateTime: data.matchDateTime,
              }}
            />

            <TeamTabs
              team1Label={data.team1Name}
              team2Label={data.team2Name}
              activeIndex={activeTeam}
              onChange={setActiveTeam}
            />

            <TeamSection
              teamName={activeTeamData.name}
              teamFlag={activeTeamData.flag}
              players={activeTeamData.players}
            />

            {/* Bottom safe area for Android gesture nav */}
            <div className="h-8" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
          </>
        )}
      </div>
    </div>
  );
};

export default Squad;
