import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";

/* ═════════════════════════════════════════════════════════════════════
   TYPES
   ═════════════════════════════════════════════════════════════════════ */

interface BatsmanInfo {
  batName: string;
  batRuns: number;
  batBalls: number;
}

interface BowlerInfo {
  bowlName: string;
  bowlWkts: number;
  bowlRuns: number;
  bowlOvs: number;
}

interface TeamInfo {
  teamId?: number;
  teamName?: string;
  teamSName?: string;
  imageId?: number;
  imageUrl?: string;
  shortName?: string;
}

interface VenueInfo {
  ground?: string;
  city?: string;
  country?: string;
  timezone?: string;
}

interface TossResults {
  tossWinnerId?: number;
  tossWinnerName?: string;
  decision?: string;
}

interface OfficialsInfo {
  umpire1?: { name?: string; country?: string };
  umpire2?: { name?: string; country?: string };
  umpire3?: { name?: string; country?: string };
  referee?: { name?: string; country?: string };
}

interface WeatherInfo {
  weatherDesc?: string;
  tempC?: number | string;
  rainChance?: number | string;
  humidity?: number | string;
  windSpeed?: number | string;
}

interface HeadToHead {
  matchesPlayed?: number;
  team1Wins?: number;
  team2Wins?: number;
  noResult?: number;
}

interface PlayerLite {
  id?: number;
  name?: string;
  role?: string;
}

interface MatchInfo {
  matchId?: number;
  seriesName?: string;
  matchDesc?: string;
  matchFormat?: string;
  startDate?: string | number;
  state?: string;
  status?: string;
  team1?: TeamInfo;
  team2?: TeamInfo;
  venueInfo?: VenueInfo;
  tossResults?: TossResults;
  officials?: OfficialsInfo;
  weather?: WeatherInfo;
  headToHead?: HeadToHead;
  team1RecentForm?: string[]; // ['W','L','W','W','L']
  team2RecentForm?: string[];
  probablePlayingXi?: {
    team1?: PlayerLite[];
    team2?: PlayerLite[];
  };
}

interface MiniScore {
  status: string;
  overs: number;
  currentRunRate: number;
  target?: number;
  event: string;
  batsmanStriker?: BatsmanInfo;
  batsmanNonStriker?: BatsmanInfo;
  bowlerStriker?: BowlerInfo;
  inningsNbr?: string;
  batTeam?: TeamInfo;
  bowlTeam?: TeamInfo;
  matchScoreDetails?: {
    inningsScoreList?: Array<{
      inningsId?: number;
      batTeamId?: number;
      batTeamName?: string;
      batTeamSName?: string;
      score?: number;
      wickets?: number;
      overs?: number;
      isDeclared?: boolean;
      isFollowOn?: boolean;
    }>;
    matchFormat?: string;
    state?: string;
    customStatus?: string;
  };
  requiredRunRate?: number;
  recentOvsStats?: string;
  lastWicket?: string;
  partnership?: {
    runs?: number;
    balls?: number;
  };
}

interface LiveScoreResponse {
  commentaryList?: any[];
  miniscore?: MiniScore;
  matchInfo?: MatchInfo; // may be nested at top level in some APIs
}

/* ═════════════════════════════════════════════════════════════════════
   HELPERS
   ═════════════════════════════════════════════════════════════════════ */

const cx = (...classes: (string | false | undefined | null)[]) =>
  classes.filter(Boolean).join(" ");

const fmtRate = (v?: number) =>
  v !== undefined && v !== null ? v.toFixed(2) : "—";

const fmtOvers = (v?: number) =>
  v !== undefined && v !== null ? v.toFixed(1) : "—";

const pad2 = (n: number) => n.toString().padStart(2, "0");

const toMs = (v?: string | number) => {
  if (v === undefined || v === null) return 0;
  const n = typeof v === "string" ? Number(v) : v;
  if (Number.isFinite(n) && n > 0) return n < 1e12 ? n * 1000 : n;
  const parsed = Date.parse(String(v));
  return Number.isFinite(parsed) ? parsed : 0;
};

/* ═════════════════════════════════════════════════════════════════════
   PRE-MATCH DETECTION
   ═════════════════════════════════════════════════════════════════════ */

const isPreMatchState = (data: LiveScoreResponse | null): boolean => {
  if (!data) return true;
  const ms = data.miniscore;
  const state =
    ms?.matchScoreDetails?.state ||
    data.matchInfo?.state ||
    "";
  if (state.toLowerCase() === "preview") return true;

  const inns = ms?.matchScoreDetails?.inningsScoreList;
  if (!inns || inns.length === 0) return true;

  const hasStriker = !!ms?.batsmanStriker?.batName;
  const hasNonStriker = !!ms?.batsmanNonStriker?.batName;
  const hasBowler = !!ms?.bowlerStriker?.bowlName;
  if (!hasStriker && !hasNonStriker && !hasBowler) return true;

  return false;
};

/* ═════════════════════════════════════════════════════════════════════
   ICONS
   ═════════════════════════════════════════════════════════════════════ */

const Icon = {
  Bat: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 3.5 20.5 9.5" /><path d="M9 9 3 15a2.5 2.5 0 0 0 3.5 3.5L12 13" /><path d="M12.5 5.5 18.5 11.5 14 16 8 10Z" />
    </svg>
  ),
  Ball: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" /><path d="M12 3c2 3 2 15 0 18M4 8c3-1 13-1 16 0M4 16c3 1 13 1 16 0" />
    </svg>
  ),
  Target: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" />
    </svg>
  ),
  Zap: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></svg>
  ),
  Link: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 17H7a5 5 0 0 1 0-10h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8" /></svg>
  ),
  Activity: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
  ),
  Refresh: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 15.3-6.4L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.3 6.4L3 16M3 21v-5h5" /></svg>
  ),
  Sun: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  Moon: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" /></svg>
  ),
  Alert: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>
  ),
  Fall: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v14M12 16l-4-4M12 16l4-4M5 21h14" /></svg>
  ),
  Clock: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  ),
  Pin: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Trophy: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8M12 17v4M17 4h3v3a4 4 0 0 1-4 4M7 4H4v3a4 4 0 0 0 4 4M17 4H7v6a5 5 0 0 0 10 0V4Z" />
    </svg>
  ),
  Cloud: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.5 19a4.5 4.5 0 1 0-.5-8.98A6 6 0 0 0 5 12a4 4 0 0 0 .5 7.98" />
    </svg>
  ),
  Coin: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </svg>
  ),
  Users: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Info: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
};

/* ═════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ═════════════════════════════════════════════════════════════════════ */

const card =
  "bg-white dark:bg-[#111815] rounded-3xl shadow-[0_2px_10px_-4px_rgba(15,23,20,0.08)] dark:shadow-[0_2px_20px_-8px_rgba(0,0,0,0.5)] border border-black/[0.04] dark:border-white/[0.06] overflow-hidden transition-shadow duration-300 hover:shadow-[0_8px_24px_-8px_rgba(15,23,20,0.12)] dark:hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.6)] w-full";

const glassCard =
  "relative bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/40 dark:border-white/[0.06] shadow-[0_2px_10px_-4px_rgba(15,23,20,0.08)] overflow-hidden w-full";

const sectionTitle =
  "flex items-center gap-2.5 px-3 sm:px-5 py-3 bg-gradient-to-r from-[#009270]/[0.06] via-[#009270]/[0.02] to-transparent dark:from-[#12b985]/[0.09] dark:via-[#12b985]/[0.03] dark:to-transparent border-b border-black/[0.04] dark:border-white/[0.05]";

const titleText =
  "text-[11px] sm:text-[11.5px] font-bold text-[#00734f] dark:text-[#3ddba4] uppercase tracking-[0.08em]";

const badge =
  "inline-flex items-center px-1.5 py-[1px] rounded-md text-[10px] font-bold leading-none";

const AccentBar = () => (
  <span className="w-1 h-5 rounded-full bg-gradient-to-b from-[#00b884] to-[#009270] dark:from-[#3ddba4] dark:to-[#12b985] flex-shrink-0" />
);

/* ═════════════════════════════════════════════════════════════════════
   SKELETON & ERROR
   ═════════════════════════════════════════════════════════════════════ */

const Skeleton = () => (
  <div className="max-w-2xl mx-auto px-3 py-6 space-y-5 animate-pulse">
    <div className="bg-white dark:bg-[#111815] rounded-3xl shadow-sm border border-black/[0.04] dark:border-white/[0.06] p-6 w-full">
      <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-2/3 mb-6" />
      <div className="flex justify-between mb-6">
        <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-2xl w-1/3" />
        <div className="h-12 bg-gray-100 dark:bg-gray-800/60 rounded-2xl w-1/4" />
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, j) => (
          <div key={j} className="h-4 bg-gray-100 dark:bg-gray-800/60 rounded-full" />
        ))}
      </div>
    </div>
  </div>
);

const ErrorState = ({ msg, onRetry }: { msg: string; onRetry: () => void }) => (
  <div className="max-w-2xl mx-auto px-3 py-16 flex flex-col items-center gap-4">
    <div className="h-14 w-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
      <Icon.Alert className="h-7 w-7" />
    </div>
    <p className="text-gray-600 dark:text-gray-400 text-center text-sm max-w-sm">{msg}</p>
    <button
      onClick={onRetry}
      className="px-5 py-2 bg-gradient-to-r from-[#00b884] to-[#009270] text-white rounded-full text-sm font-bold hover:brightness-105 active:scale-95 transition-all duration-200 shadow-sm shadow-[#009270]/30"
    >
      Retry
    </button>
  </div>
);

/* ═════════════════════════════════════════════════════════════════════
   COUNTDOWN HOOK
   ═════════════════════════════════════════════════════════════════════ */

const useCountdown = (targetMs: number) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!targetMs) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [targetMs]);

  const diff = Math.max(0, targetMs - now);
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);

  return { diff, days, hours, minutes, seconds, done: diff <= 0 };
};

/* ═════════════════════════════════════════════════════════════════════
   COUNTDOWN CARD
   ═════════════════════════════════════════════════════════════════════ */

const CountdownUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex-1 min-w-[64px]">
    <div className="relative rounded-2xl bg-gradient-to-br from-white/90 to-white/60 dark:from-white/[0.06] dark:to-white/[0.02] border border-white/60 dark:border-white/[0.08] backdrop-blur-sm px-2 py-3 sm:py-4 text-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
      <div className="text-3xl sm:text-4xl font-black tabular-nums bg-gradient-to-b from-[#00734f] to-[#009270] dark:from-white dark:to-[#3ddba4] bg-clip-text text-transparent leading-none">
        {pad2(value)}
      </div>
      <div className="mt-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
        {label}
      </div>
    </div>
  </div>
);

const Countdown = ({ target }: { target: number }) => {
  const { diff, days, hours, minutes, seconds, done } = useCountdown(target);

  if (done) {
    return (
      <div className="text-center py-4">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#009270]/10 dark:bg-[#3ddba4]/10 text-[#00734f] dark:text-[#3ddba4] font-bold text-sm">
          <span className="h-2 w-2 rounded-full bg-[#009270] dark:bg-[#3ddba4] animate-pulse" />
          Starting soon…
        </span>
      </div>
    );
  }

  const lessThanDay = diff < 86_400_000;
  const lessThanHour = diff < 3_600_000;
  const lessThanMinute = diff < 60_000;

  return (
    <div className="flex items-stretch gap-2 sm:gap-3">
      {!lessThanDay && <CountdownUnit value={days} label="Days" />}
      {!lessThanHour && <CountdownUnit value={hours} label="Hours" />}
      {!lessThanMinute && <CountdownUnit value={minutes} label="Minutes" />}
      <CountdownUnit value={seconds} label="Seconds" />
    </div>
  );
};

/* ═════════════════════════════════════════════════════════════════════
   TEAM CARD (pre-match)
   ═════════════════════════════════════════════════════════════════════ */

const TeamCard = ({ team, align }: { team?: TeamInfo; align: "left" | "right" }) => {
  const name = team?.teamSName || team?.shortName || team?.teamName || "TBC";
  const full = team?.teamName || name;
  const img = team?.imageUrl;

  return (
    <div className={cx("flex flex-col items-center gap-2 flex-1 min-w-0", align === "right" && "items-center")}>
      <div className="relative">
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-[#009270]/30 to-transparent blur-md" aria-hidden />
        <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white dark:bg-[#161d1a] border-2 border-white dark:border-white/10 shadow-md flex items-center justify-center overflow-hidden">
          {img ? (
            <img src={img} alt={full} className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=009270&color=fff&bold=true`;
              }}
            />
          ) : (
            <span className="text-lg font-black text-[#009270] dark:text-[#3ddba4]">{name.slice(0, 3).toUpperCase()}</span>
          )}
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs sm:text-sm font-black text-gray-900 dark:text-white truncate max-w-[120px]">{name}</div>
        <div className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[130px] mt-0.5">{full}</div>
      </div>
    </div>
  );
};

/* ═════════════════════════════════════════════════════════════════════
   FORM PILLS (W W L W W)
   ═════════════════════════════════════════════════════════════════════ */

const FormPill = ({ result }: { result: string }) => {
  const r = result.toUpperCase();
  const cls =
    r === "W"
      ? "bg-emerald-500 text-white"
      : r === "L"
      ? "bg-red-500 text-white"
      : r === "N" || r === "NR"
      ? "bg-gray-400 text-white"
      : "bg-gray-300 text-gray-700";
  return (
    <span className={cx("h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm", cls)}>
      {r === "NR" ? "N" : r}
    </span>
  );
};

/* ═════════════════════════════════════════════════════════════════════
   PRE-MATCH SCREEN
   ═════════════════════════════════════════════════════════════════════ */

const PreMatch = ({
  matchInfo,
  status,
  isComplete,
  onRefresh,
}: {
  matchInfo: MatchInfo;
  status?: string;
  isComplete: boolean;
  onRefresh: () => void;
}) => {
  const startMs = toMs(matchInfo.startDate);
  const { done } = useCountdown(startMs);
  const startsInShort = (() => {
    const diff = Math.max(0, startMs - Date.now());
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    if (diff <= 0) return "Now";
    if (h > 0) return `${pad2(h)}h ${pad2(m)}m`;
    return `${pad2(m)}m`;
  })();

  const gmt = startMs
    ? new Date(startMs).toLocaleTimeString("en-GB", {
        timeZone: "UTC",
        hour: "2-digit",
        minute: "2-digit",
      }) + " GMT"
    : "TBA";

  const dateGmt = startMs
    ? new Date(startMs).toLocaleDateString("en-US", {
        timeZone: "UTC",
        month: "short",
        day: "numeric",
      })
    : "TBA";

  const localTime = startMs
    ? new Date(startMs).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "TBA";

  const venueText = [
    matchInfo.venueInfo?.ground,
    matchInfo.venueInfo?.city,
    matchInfo.venueInfo?.country,
  ]
    .filter((v) => v && v !== "TBC")
    .join(", ");

  const toss = matchInfo.tossResults;
  const hasToss = !!toss?.tossWinnerName;

  const weather = matchInfo.weather;
  const hasWeather =
    !!weather &&
    (weather.tempC !== undefined ||
      weather.humidity !== undefined ||
      weather.rainChance !== undefined ||
      weather.windSpeed !== undefined);

  const officials = matchInfo.officials;
  const hasOfficials =
    !!officials &&
    (officials.umpire1?.name ||
      officials.umpire2?.name ||
      officials.umpire3?.name ||
      officials.referee?.name);

  const h2h = matchInfo.headToHead;
  const hasH2H = !!h2h && (h2h.matchesPlayed ?? 0) > 0;

  const form1 = matchInfo.team1RecentForm || [];
  const form2 = matchInfo.team2RecentForm || [];
  const hasForm = form1.length > 0 || form2.length > 0;

  const xi1 = matchInfo.probablePlayingXi?.team1 || [];
  const xi2 = matchInfo.probablePlayingXi?.team2 || [];
  const hasXI = xi1.length > 0 || xi2.length > 0;

  return (
    <div className="animate-[fadeUp_0.4s_ease]">
      {/* Top bar */}
      <div className="sticky top-0 z-50 w-full">
        <div className="bg-gradient-to-r from-[#00734f] via-[#009270] to-[#00a67d] px-3 sm:px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Icon.Clock className="h-4 w-4 text-white" />
            <span className="text-white/95 text-[11px] sm:text-xs font-semibold tracking-wide truncate">
              UPCOMING MATCH
            </span>
          </div>
          {matchInfo.matchFormat && (
            <span className="text-white text-[10px] sm:text-[10.5px] font-bold bg-white/15 px-2.5 py-0.5 rounded-full tracking-wide flex-shrink-0">
              {matchInfo.matchFormat}
            </span>
          )}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-5 space-y-4 w-full">
        {/* ═══ HERO / COUNTDOWN CARD ═══ */}
        <div className={cx(glassCard, "p-5 sm:p-6")}>
          {/* decorative gradient blobs */}
          <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-[#00b884]/30 dark:bg-[#3ddba4]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#009270]/20 dark:bg-[#12b985]/15 blur-3xl" />

          <div className="relative">
            {/* Emoji + Title */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 dark:bg-white/[0.05] border border-white/60 dark:border-white/[0.08] backdrop-blur">
                <span className="text-base">🏏</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#00734f] dark:text-[#3ddba4]">
                  Upcoming Match
                </span>
              </div>
              <h2 className="mt-3 text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100">
                {status || matchInfo.status || `Match starts at ${dateGmt}, ${gmt}`}
              </h2>
            </div>

            {/* Teams + VS */}
            <div className="flex items-center gap-2 sm:gap-4 py-3">
              <TeamCard team={matchInfo.team1} align="left" />

              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className="relative">
                  <span className="absolute inset-0 rounded-full bg-gradient-to-br from-[#00b884] to-[#009270] blur opacity-40" />
                  <div className="relative h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-[#00b884] to-[#009270] text-white flex items-center justify-center font-black text-xs sm:text-sm shadow-lg">
                    VS
                  </div>
                </div>
                <div className="text-center mt-1">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Starts In
                  </div>
                  <div className="text-xs font-black text-[#00734f] dark:text-[#3ddba4] tabular-nums">
                    {startsInShort}
                  </div>
                </div>
              </div>

              <TeamCard team={matchInfo.team2} align="right" />
            </div>

            {/* Countdown */}
            {!done && startMs > 0 && (
              <div className="mt-4">
                <Countdown target={startMs} />
              </div>
            )}
          </div>
        </div>

        {/* ═══ MATCH INFO CARD ═══ */}
        <div className={card}>
          <div className={sectionTitle}>
            <AccentBar />
            <span className="text-[#009270] dark:text-[#3ddba4]"><Icon.Info className="h-4 w-4" /></span>
            <span className={titleText}>Match Info</span>
          </div>
          <div className="p-3 sm:p-4 space-y-2.5">
            {matchInfo.seriesName && (
              <div className="flex items-start gap-3">
                <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-20 flex-shrink-0 pt-0.5">Series</div>
                <div className="text-[13px] font-semibold text-gray-800 dark:text-gray-200 flex-1">{matchInfo.seriesName}</div>
              </div>
            )}
            {matchInfo.matchDesc && (
              <div className="flex items-start gap-3">
                <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-20 flex-shrink-0 pt-0.5">Match</div>
                <div className="text-[13px] font-semibold text-gray-800 dark:text-gray-200 flex-1">{matchInfo.matchDesc}</div>
              </div>
            )}
            {venueText && (
              <div className="flex items-start gap-3">
                <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-20 flex-shrink-0 pt-0.5">Venue</div>
                <div className="text-[13px] font-semibold text-gray-800 dark:text-gray-200 flex-1 flex items-start gap-1.5">
                  <Icon.Pin className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="break-words">{venueText}</span>
                </div>
              </div>
            )}
            {startMs > 0 && (
              <>
                <div className="flex items-start gap-3">
                  <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-20 flex-shrink-0 pt-0.5">GMT</div>
                  <div className="text-[13px] font-semibold text-gray-800 dark:text-gray-200 flex-1">{dateGmt}, {gmt}</div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-20 flex-shrink-0 pt-0.5">Local</div>
                  <div className="text-[13px] font-semibold text-gray-800 dark:text-gray-200 flex-1">{localTime}</div>
                </div>
              </>
            )}
            {matchInfo.matchFormat && (
              <div className="flex items-start gap-3">
                <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-20 flex-shrink-0 pt-0.5">Format</div>
                <div className="flex-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-[11px] font-black border border-purple-200 dark:border-purple-800">
                    {matchInfo.matchFormat.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══ TOSS ═══ */}
        <div className={card}>
          <div className={sectionTitle}>
            <AccentBar />
            <span className="text-[#009270] dark:text-[#3ddba4]"><Icon.Coin className="h-4 w-4" /></span>
            <span className={titleText}>Toss</span>
          </div>
          <div className="p-4 text-center">
            {hasToss ? (
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Toss Winner</div>
                <div className="text-lg font-black text-gray-900 dark:text-white">{toss?.tossWinnerName}</div>
                {toss?.decision && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Chose to <span className="font-bold text-[#009270] dark:text-[#3ddba4]">{toss.decision}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 py-2">
                <span className="text-2xl animate-bounce">🪙</span>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Toss yet to happen</span>
              </div>
            )}
          </div>
        </div>

        {/* ═══ WEATHER ═══ */}
        {hasWeather && (
          <div className={card}>
            <div className={sectionTitle}>
              <AccentBar />
              <span className="text-[#009270] dark:text-[#3ddba4]"><Icon.Cloud className="h-4 w-4" /></span>
              <span className={titleText}>Weather</span>
            </div>
            <div className="p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {weather?.tempC !== undefined && (
                <div className="rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 border border-orange-100 dark:border-orange-900/30 px-3 py-2.5">
                  <div className="text-[9px] font-bold uppercase text-orange-600 dark:text-orange-400 tracking-wider">Temp</div>
                  <div className="text-lg font-black text-gray-900 dark:text-white">{weather.tempC}°C</div>
                </div>
              )}
              {weather?.rainChance !== undefined && (
                <div className="rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 border border-blue-100 dark:border-blue-900/30 px-3 py-2.5">
                  <div className="text-[9px] font-bold uppercase text-blue-600 dark:text-blue-400 tracking-wider">Rain</div>
                  <div className="text-lg font-black text-gray-900 dark:text-white">{weather.rainChance}%</div>
                </div>
              )}
              {weather?.humidity !== undefined && (
                <div className="rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/10 dark:to-emerald-900/10 border border-teal-100 dark:border-teal-900/30 px-3 py-2.5">
                  <div className="text-[9px] font-bold uppercase text-teal-600 dark:text-teal-400 tracking-wider">Humidity</div>
                  <div className="text-lg font-black text-gray-900 dark:text-white">{weather.humidity}%</div>
                </div>
              )}
              {weather?.windSpeed !== undefined && (
                <div className="rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 border border-gray-200 dark:border-gray-800 px-3 py-2.5">
                  <div className="text-[9px] font-bold uppercase text-gray-600 dark:text-gray-400 tracking-wider">Wind</div>
                  <div className="text-lg font-black text-gray-900 dark:text-white">{weather.windSpeed}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ OFFICIALS ═══ */}
        {hasOfficials && (
          <div className={card}>
            <div className={sectionTitle}>
              <AccentBar />
              <span className="text-[#009270] dark:text-[#3ddba4]"><Icon.Users className="h-4 w-4" /></span>
              <span className={titleText}>Match Officials</span>
            </div>
            <div className="p-3 sm:p-4 space-y-2">
              {[
                { label: "Umpire 1", val: officials?.umpire1 },
                { label: "Umpire 2", val: officials?.umpire2 },
                { label: "3rd Umpire", val: officials?.umpire3 },
                { label: "Referee", val: officials?.referee },
              ]
                .filter((o) => o.val?.name)
                .map((o, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50/60 dark:bg-white/[0.015]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{o.label}</span>
                    <span className="text-[13px] font-bold text-gray-800 dark:text-gray-200 text-right">
                      {o.val?.name}
                      {o.val?.country && <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">({o.val.country})</span>}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ═══ HEAD TO HEAD ═══ */}
        {hasH2H && (
          <div className={card}>
            <div className={sectionTitle}>
              <AccentBar />
              <span className="text-[#009270] dark:text-[#3ddba4]"><Icon.Trophy className="h-4 w-4" /></span>
              <span className={titleText}>Head to Head</span>
            </div>
            <div className="p-3 sm:p-4">
              <div className="text-center mb-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Matches Played</div>
                <div className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">{h2h?.matchesPlayed}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-100 dark:border-emerald-900/30 px-2 py-2.5 text-center">
                  <div className="text-[9px] font-bold uppercase text-emerald-700 dark:text-emerald-400 tracking-wider truncate">
                    {matchInfo.team1?.teamSName || "T1"}
                  </div>
                  <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 tabular-nums">{h2h?.team1Wins ?? 0}</div>
                </div>
                <div className="rounded-xl bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] px-2 py-2.5 text-center">
                  <div className="text-[9px] font-bold uppercase text-gray-600 dark:text-gray-400 tracking-wider">No Result</div>
                  <div className="text-xl font-black text-gray-700 dark:text-gray-300 tabular-nums">{h2h?.noResult ?? 0}</div>
                </div>
                <div className="rounded-xl bg-blue-50 dark:bg-blue-900/15 border border-blue-100 dark:border-blue-900/30 px-2 py-2.5 text-center">
                  <div className="text-[9px] font-bold uppercase text-blue-700 dark:text-blue-400 tracking-wider truncate">
                    {matchInfo.team2?.teamSName || "T2"}
                  </div>
                  <div className="text-xl font-black text-blue-700 dark:text-blue-400 tabular-nums">{h2h?.team2Wins ?? 0}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ RECENT FORM ═══ */}
        {hasForm && (
          <div className={card}>
            <div className={sectionTitle}>
              <AccentBar />
              <span className="text-[#009270] dark:text-[#3ddba4]"><Icon.Activity className="h-4 w-4" /></span>
              <span className={titleText}>Recent Form (Last 5)</span>
            </div>
            <div className="p-3 sm:p-4 space-y-3">
              {form1.length > 0 && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13px] font-bold text-gray-800 dark:text-gray-200 truncate">
                    {matchInfo.team1?.teamSName || matchInfo.team1?.teamName || "Team 1"}
                  </span>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {form1.slice(0, 5).map((r, i) => (
                      <FormPill key={i} result={r} />
                    ))}
                  </div>
                </div>
              )}
              {form2.length > 0 && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13px] font-bold text-gray-800 dark:text-gray-200 truncate">
                    {matchInfo.team2?.teamSName || matchInfo.team2?.teamName || "Team 2"}
                  </span>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {form2.slice(0, 5).map((r, i) => (
                      <FormPill key={i} result={r} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ PROBABLE XI ═══ */}
        <div className={card}>
          <div className={sectionTitle}>
            <AccentBar />
            <span className="text-[#009270] dark:text-[#3ddba4]"><Icon.Users className="h-4 w-4" /></span>
            <span className={titleText}>Probable Playing XI</span>
          </div>
          <div className="p-3 sm:p-4">
            {hasXI ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[{ team: matchInfo.team1, xi: xi1 }, { team: matchInfo.team2, xi: xi2 }].map((t, i) => (
                  <div key={i} className="rounded-xl border border-black/[0.04] dark:border-white/[0.06] bg-gray-50/60 dark:bg-white/[0.015] p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#009270] dark:text-[#3ddba4] mb-2">
                      {t.team?.teamSName || t.team?.teamName || `Team ${i + 1}`}
                    </div>
                    <ul className="space-y-1">
                      {t.xi.map((p, j) => (
                        <li key={j} className="text-[12px] text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <span className="h-1 w-1 rounded-full bg-gray-400 dark:bg-gray-600" />
                          <span className="truncate">{p.name}</span>
                          {p.role && <span className="text-[9px] text-gray-400 dark:text-gray-500 ml-auto">{p.role}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                Playing XI will be available after toss.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white dark:bg-[#111815] rounded-3xl border border-black/[0.04] dark:border-white/[0.06] px-4 sm:px-5 py-4 text-xs sm:text-[11.5px] text-gray-400 dark:text-gray-600 flex flex-wrap items-center justify-between gap-3 w-full">
          <span className="inline-flex items-center gap-1.5 text-[#009270] dark:text-[#3ddba4] font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-[#009270] dark:bg-[#3ddba4] animate-pulse" />
            Auto-refresh 30s
          </span>
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#00b884] to-[#009270] text-white rounded-full font-bold hover:brightness-105 active:scale-95 transition-all duration-200"
          >
            <Icon.Refresh className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </main>
    </div>
  );
};

/* ═════════════════════════════════════════════════════════════════════
   LIVE MATCH SUB COMPONENTS (unchanged)
   ═════════════════════════════════════════════════════════════════════ */

const RecentOvers = ({ recentStr }: { recentStr: string }) => {
  const tokens = recentStr.split(/\s+/).filter(Boolean);
  const getBallStyle = (token: string) => {
    const t = token.toUpperCase();
    if (t === "W") return "bg-red-500 text-white";
    if (t === "4") return "bg-blue-500 text-white";
    if (t === "6") return "bg-purple-500 text-white";
    if (t === "0" || t === ".") return "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400";
    if (t === "|") return null;
    if (t.includes("WD") || t.includes("NB") || t.includes("LB") || t.includes("B"))
      return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400";
    return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
  };
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {tokens.map((token, i) => {
        if (token === "|") return <span key={i} className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 flex-shrink-0" />;
        const style = getBallStyle(token);
        return (
          <span key={i} className={cx("h-6 min-w-[24px] px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0", style)}>
            {token}
          </span>
        );
      })}
    </div>
  );
};

const StatChip = ({ label, value, accent, icon }: { label: string; value: string | number; accent?: boolean; icon?: React.ReactNode }) => (
  <div className={cx("rounded-xl border px-3 py-2.5 flex flex-col gap-0.5 flex-1 min-w-[80px]",
    accent
      ? "bg-gradient-to-br from-[#009270]/[0.07] to-[#009270]/[0.02] dark:from-[#3ddba4]/[0.08] dark:to-[#3ddba4]/[0.02] border-[#009270]/15 dark:border-[#3ddba4]/15"
      : "border-black/[0.04] dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.015]")}>
    <div className="flex items-center gap-1">
      {icon && <span className="text-gray-400 dark:text-gray-500">{icon}</span>}
      <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</span>
    </div>
    <span className={cx("text-lg sm:text-xl font-black tabular-nums", accent ? "text-[#009270] dark:text-[#3ddba4]" : "text-gray-900 dark:text-white")}>
      {value}
    </span>
  </div>
);

const BatsmanRow = ({ batsman, isStriker }: { batsman?: BatsmanInfo; isStriker: boolean }) => {
  if (!batsman?.batName) return null;
  const sr = batsman.batBalls > 0 ? ((batsman.batRuns / batsman.batBalls) * 100).toFixed(1) : "0.0";
  return (
    <div className={cx("flex items-center justify-between gap-3 px-3 sm:px-4 py-3 rounded-xl transition-colors duration-150",
      isStriker
        ? "bg-[#009270]/[0.05] dark:bg-[#3ddba4]/[0.06] border border-[#009270]/15 dark:border-[#3ddba4]/15"
        : "bg-gray-50/60 dark:bg-white/[0.015] border border-transparent")}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {isStriker && <span className="h-2 w-2 rounded-full bg-[#009270] dark:bg-[#3ddba4] flex-shrink-0 animate-pulse" />}
        <span className={cx("text-[13px] sm:text-sm font-semibold truncate",
          isStriker ? "text-[#00734f] dark:text-[#3ddba4]" : "text-gray-700 dark:text-gray-300")}>
          {batsman.batName}
        </span>
        {isStriker && <span className={cx(badge, "bg-[#009270]/10 text-[#00734f] dark:bg-[#3ddba4]/10 dark:text-[#3ddba4]")}>★</span>}
      </div>
      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
        <div className="text-right">
          <span className={cx("text-xl sm:text-2xl font-black tabular-nums", isStriker ? "text-[#009270] dark:text-[#3ddba4]" : "text-gray-900 dark:text-white")}>
            {batsman.batRuns}
          </span>
          <span className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500 ml-0.5">({batsman.batBalls})</span>
        </div>
        <div className="text-right hidden xs:block">
          <div className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">SR</div>
          <div className="text-xs font-bold text-gray-600 dark:text-gray-300 tabular-nums">{sr}</div>
        </div>
      </div>
    </div>
  );
};

const BowlerRow = ({ bowler }: { bowler?: BowlerInfo }) => {
  if (!bowler?.bowlName) return null;
  const econ = bowler.bowlOvs > 0 ? (bowler.bowlRuns / bowler.bowlOvs).toFixed(2) : "0.00";
  return (
    <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-3 rounded-xl bg-gray-50/60 dark:bg-white/[0.015] border border-transparent">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Icon.Ball className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
        <span className="text-[13px] sm:text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">{bowler.bowlName}</span>
      </div>
      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
        <div className="text-right">
          <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tabular-nums">{bowler.bowlWkts}-{bowler.bowlRuns}</span>
          <span className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500 ml-0.5">({fmtOvers(bowler.bowlOvs)})</span>
        </div>
        <div className="text-right hidden xs:block">
          <div className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Econ</div>
          <div className="text-xs font-bold text-gray-600 dark:text-gray-300 tabular-nums">{econ}</div>
        </div>
      </div>
    </div>
  );
};

const InningsScoresList = ({ list }: { list?: NonNullable<MiniScore["matchScoreDetails"]>["inningsScoreList"] }) => {
  if (!list?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {list.map((inn, i) => (
        <div key={inn.inningsId ?? i} className="rounded-xl border border-black/[0.04] dark:border-white/[0.06] bg-gray-50/60 dark:bg-white/[0.015] px-3 py-2 flex items-center gap-2 min-w-0">
          <span className="text-[11px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 truncate">
            {inn.batTeamSName || inn.batTeamName || `Inn ${(inn.inningsId ?? 0)}`}
          </span>
          <span className="text-sm sm:text-[15px] font-black text-gray-900 dark:text-white tabular-nums">
            {inn.score ?? 0}/{inn.wickets ?? 0}
          </span>
          {inn.overs !== undefined && <span className="text-[10px] text-gray-400 dark:text-gray-500">({fmtOvers(inn.overs)})</span>}
          {inn.isDeclared && <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 rounded">Dec</span>}
        </div>
      ))}
    </div>
  );
};

/* ═════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═════════════════════════════════════════════════════════════════════ */

export default function LiveMatch() {
  const params = useParams();
  const matchId = params?.matchId as string | undefined;

  const [data, setData] = useState<LiveScoreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  const fetchData = useCallback(async () => {
    if (!matchId) {
      setError("No match ID provided");
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const res = await fetch(`/api/score/livescore?matchId=${matchId}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`API returned ${res.status}: ${res.statusText || "Unknown error"}`);
      const json: LiveScoreResponse = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch live score");
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  const isPreMatch = useMemo(() => isPreMatchState(data), [data]);

  // Auto-refresh: 30s for pre-match, 10s for live, disabled for complete
  useEffect(() => {
    if (!data) return;
    const state = data.miniscore?.matchScoreDetails?.state || data.matchInfo?.state;
    if (state === "Complete") return;
    const interval = isPreMatch ? 30_000 : 10_000;
    const timer = setInterval(fetchData, interval);
    return () => clearInterval(timer);
  }, [data, fetchData, isPreMatch]);

  const ms = data?.miniscore;
  const isComplete = ms?.matchScoreDetails?.state === "Complete";
  const inningsList = ms?.matchScoreDetails?.inningsScoreList;

  return (
    <div className="min-h-screen bg-[#f2f4f3] dark:bg-[#0a0f0d] transition-colors duration-300 font-sans overflow-x-hidden">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }
        .no-scrollbar::-webkit-scrollbar { display:none; }
        .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
      `}</style>

      {/* Dark mode toggle */}
      <button
        onClick={() => setDarkMode((d) => !d)}
        className="fixed bottom-5 right-5 z-50 h-11 w-11 rounded-full bg-white dark:bg-[#161d1a] shadow-[0_4px_16px_-4px_rgba(0,0,0,0.2)] border border-black/[0.05] dark:border-white/10 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:scale-110 active:scale-95 transition-transform duration-200"
        aria-label="Toggle dark mode"
      >
        {darkMode ? <Icon.Sun className="h-5 w-5" /> : <Icon.Moon className="h-5 w-5" />}
      </button>

      {loading && !data && <Skeleton />}
      {error && !data && <ErrorState msg={error} onRetry={fetchData} />}

      {/* ═══ PRE-MATCH SCREEN ═══ */}
      {data && isPreMatch && (
        <PreMatch
          matchInfo={data.matchInfo || {
            seriesName: undefined,
            matchDesc: undefined,
            matchFormat: ms?.matchScoreDetails?.matchFormat,
            state: ms?.matchScoreDetails?.state,
            status: ms?.status,
            team1: ms?.batTeam,
            team2: ms?.bowlTeam,
          }}
          status={ms?.status || ms?.matchScoreDetails?.customStatus}
          isComplete={!!isComplete}
          onRefresh={fetchData}
        />
      )}

      {/* ═══ LIVE MATCH UI ═══ */}
      {data && !isPreMatch && ms && (
        <div className="animate-[fadeUp_0.35s_ease]">
          {/* TOP BAR */}
          <div className="sticky top-0 z-50 w-full">
            <div className="bg-gradient-to-r from-[#00734f] via-[#009270] to-[#00a67d] px-3 sm:px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {!isComplete && (
                  <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-white/60 animate-ping" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
                  </span>
                )}
                <span className="text-white/95 text-[11px] sm:text-xs font-semibold tracking-wide truncate">
                  {isComplete ? "Match Complete" : "LIVE"}
                </span>
              </div>
              {ms.matchScoreDetails?.matchFormat && (
                <span className="text-white text-[10px] sm:text-[10.5px] font-bold bg-white/15 px-2.5 py-0.5 rounded-full tracking-wide flex-shrink-0">
                  {ms.matchScoreDetails.matchFormat}
                </span>
              )}
            </div>
          </div>

          <main className="max-w-2xl mx-auto px-3 sm:px-4 py-5 space-y-4 w-full">
            {error && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3 text-xs sm:text-[13px] text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <Icon.Alert className="h-4 w-4 shrink-0" />
                <span className="break-words">{error} — Showing cached data.</span>
              </div>
            )}

            {/* STATUS */}
            <div className={card}>
              <div className="px-3 sm:px-5 py-4">
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className={cx("inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-bold px-3 py-1 rounded-full",
                    isComplete
                      ? "text-[#00734f] dark:text-[#3ddba4] bg-[#009270]/[0.08] dark:bg-[#3ddba4]/[0.08]"
                      : "text-amber-700 dark:text-amber-400 bg-amber-500/[0.08]")}>
                    <span className={cx("h-1.5 w-1.5 rounded-full flex-shrink-0",
                      isComplete ? "bg-[#009270] dark:bg-[#3ddba4]" : "bg-amber-500 animate-pulse")} />
                    {ms.status || ms.matchScoreDetails?.customStatus || "—"}
                  </span>
                  {ms.event && ms.event !== "None" && (
                    <span className={cx("text-[10px] font-bold px-2 py-0.5 rounded-full",
                      ms.event.toUpperCase().includes("WICKET")
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : ms.event.toUpperCase().includes("FOUR") || ms.event.toUpperCase().includes("SIX")
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400")}>
                      {ms.event}
                    </span>
                  )}
                </div>

                {inningsList && inningsList.length > 0 && (
                  <div className="mb-4"><InningsScoresList list={inningsList} /></div>
                )}

                <div className="flex items-end justify-between gap-3 flex-wrap">
                  <div>
                    <div className="text-[10px] sm:text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                      {ms.batTeam?.teamName || ms.batTeam?.teamSName || "Batting"}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tabular-nums tracking-tight">
                        {inningsList?.length
                          ? `${inningsList[inningsList.length - 1]?.score ?? 0}/${inningsList[inningsList.length - 1]?.wickets ?? 0}`
                          : "—"}
                      </span>
                      <span className="text-sm sm:text-base font-semibold text-gray-400 dark:text-gray-500">
                        ({fmtOvers(ms.overs)} ov)
                      </span>
                    </div>
                  </div>
                  {ms.target !== undefined && ms.target > 0 && (
                    <div className="text-right">
                      <div className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Target</div>
                      <div className="text-2xl sm:text-3xl font-black text-[#009270] dark:text-[#3ddba4] tabular-nums">{ms.target}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RATE STATS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatChip label="Run Rate" value={fmtRate(ms.currentRunRate)} accent icon={<Icon.Activity className="h-3 w-3" />} />
              {ms.requiredRunRate !== undefined && ms.requiredRunRate > 0 && (
                <StatChip label="Req. Rate" value={fmtRate(ms.requiredRunRate)} icon={<Icon.Target className="h-3 w-3" />} />
              )}
              <StatChip label="Overs" value={fmtOvers(ms.overs)} icon={<Icon.Ball className="h-3 w-3" />} />
              {ms.target !== undefined && ms.target > 0 && (
                <StatChip label="Need" value={(() => {
                  const currentScore = inningsList?.length ? inningsList[inningsList.length - 1]?.score ?? 0 : 0;
                  const need = ms.target - currentScore;
                  return need > 0 ? need : 0;
                })()} accent icon={<Icon.Zap className="h-3 w-3" />} />
              )}
              {ms.partnership?.runs !== undefined && (
                <StatChip label="Partnership" value={`${ms.partnership.runs}(${ms.partnership.balls ?? 0})`} icon={<Icon.Link className="h-3 w-3" />} />
              )}
            </div>

            {/* BATSMEN */}
            {(ms.batsmanStriker?.batName || ms.batsmanNonStriker?.batName) && (
              <div className={card}>
                <div className={sectionTitle}>
                  <AccentBar />
                  <span className="text-[#009270] dark:text-[#3ddba4]"><Icon.Bat className="h-4 w-4" /></span>
                  <span className={titleText}>At the Crease</span>
                </div>
                <div className="p-3 sm:p-4 space-y-2">
                  {ms.batsmanStriker?.batName && <BatsmanRow batsman={ms.batsmanStriker} isStriker />}
                  {ms.batsmanNonStriker?.batName && <BatsmanRow batsman={ms.batsmanNonStriker} isStriker={false} />}
                </div>
              </div>
            )}

            {/* BOWLER */}
            {ms.bowlerStriker?.bowlName && (
              <div className={card}>
                <div className={sectionTitle}>
                  <AccentBar />
                  <span className="text-[#009270] dark:text-[#3ddba4]"><Icon.Ball className="h-4 w-4" /></span>
                  <span className={titleText}>Bowling</span>
                  {ms.bowlTeam?.teamSName && (
                    <span className="ml-0.5 text-xs text-gray-400 dark:text-gray-500 font-medium normal-case truncate">
                      {ms.bowlTeam.teamSName}
                    </span>
                  )}
                </div>
                <div className="p-3 sm:p-4"><BowlerRow bowler={ms.bowlerStriker} /></div>
              </div>
            )}

            {/* RECENT OVERS */}
            {ms.recentOvsStats && (
              <div className={card}>
                <div className={sectionTitle}>
                  <AccentBar />
                  <span className="text-[#009270] dark:text-[#3ddba4]"><Icon.Activity className="h-4 w-4" /></span>
                  <span className={titleText}>Recent Overs</span>
                </div>
                <div className="p-3 sm:p-4 overflow-x-auto no-scrollbar">
                  <RecentOvers recentStr={ms.recentOvsStats} />
                </div>
              </div>
            )}

            {/* LAST WICKET */}
            {ms.lastWicket && (
              <div className={card}>
                <div className={sectionTitle}>
                  <AccentBar />
                  <span className="text-red-500"><Icon.Fall className="h-4 w-4" /></span>
                  <span className={cx(titleText, "!text-red-600 dark:!text-red-400")}>Last Wicket</span>
                </div>
                <div className="px-3 sm:px-5 py-3 text-xs sm:text-[13px] text-gray-700 dark:text-gray-300 break-words leading-relaxed">
                  {ms.lastWicket}
                </div>
              </div>
            )}

            {/* FOOTER */}
            <div className="bg-white dark:bg-[#111815] rounded-3xl border border-black/[0.04] dark:border-white/[0.06] px-4 sm:px-5 py-4 text-xs sm:text-[11.5px] text-gray-400 dark:text-gray-600 flex flex-wrap items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-4 flex-wrap min-w-0">
                {lastUpdated && (
                  <span>
                    Updated {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                )}
                {!isComplete && (
                  <span className="inline-flex items-center gap-1.5 text-[#009270] dark:text-[#3ddba4] font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#009270] dark:bg-[#3ddba4] animate-pulse flex-shrink-0" />
                    Auto-refresh 10s
                  </span>
                )}
              </div>
              <button
                onClick={fetchData}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#00b884] to-[#009270] text-white rounded-full font-bold hover:brightness-105 active:scale-95 transition-all duration-200 flex-shrink-0"
              >
                <Icon.Refresh className="h-3.5 w-3.5" /> Refresh
              </button>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
