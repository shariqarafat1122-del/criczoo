import React, { useEffect, useState, useCallback } from "react";
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

interface MiniScore {
  status: string;
  overs: number;
  currentRunRate: number;
  target?: number;
  event: string;
  batsmanStriker: BatsmanInfo;
  batsmanNonStriker: BatsmanInfo;
  bowlerStriker: BowlerInfo;
  inningsNbr?: string;
  batTeam?: {
    teamId?: number;
    teamName?: string;
    teamSName?: string;
  };
  bowlTeam?: {
    teamId?: number;
    teamName?: string;
    teamSName?: string;
  };
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
  commentaryList: any[];
  miniscore: MiniScore;
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

/* ═════════════════════════════════════════════════════════════════════
   ICONS
   ═════════════════════════════════════════════════════════════════════ */

const Icon = {
  Bat: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 3.5 20.5 9.5" />
      <path d="M9 9 3 15a2.5 2.5 0 0 0 3.5 3.5L12 13" />
      <path d="M12.5 5.5 18.5 11.5 14 16 8 10Z" />
    </svg>
  ),
  Ball: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3c2 3 2 15 0 18M4 8c3-1 13-1 16 0M4 16c3 1 13 1 16 0" />
    </svg>
  ),
  Target: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  ),
  Zap: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  ),
  Link: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 17H7a5 5 0 0 1 0-10h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8" />
    </svg>
  ),
  Activity: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  Refresh: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 15.3-6.4L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.3 6.4L3 16M3 21v-5h5" />
    </svg>
  ),
  Sun: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  Moon: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  ),
  Alert: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v4M12 17h.01M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  ),
  Fall: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v14M12 16l-4-4M12 16l4-4M5 21h14" />
    </svg>
  ),
};

/* ═════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ═════════════════════════════════════════════════════════════════════ */

const card =
  "bg-white dark:bg-[#111815] rounded-3xl shadow-[0_2px_10px_-4px_rgba(15,23,20,0.08)] dark:shadow-[0_2px_20px_-8px_rgba(0,0,0,0.5)] border border-black/[0.04] dark:border-white/[0.06] overflow-hidden transition-shadow duration-300 hover:shadow-[0_8px_24px_-8px_rgba(15,23,20,0.12)] dark:hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.6)] w-full";

const sectionTitle =
  "flex items-center gap-2.5 px-3 sm:px-5 py-3 bg-gradient-to-r from-[#009270]/[0.06] via-[#009270]/[0.02] to-transparent dark:from-[#12b985]/[0.09] dark:via-[#12b985]/[0.03] dark:to-transparent border-b border-black/[0.04] dark:border-white/[0.05]";

const titleText =
  "text-[11px] sm:text-[11.5px] font-bold text-[#00734f] dark:text-[#3ddba4] uppercase tracking-[0.08em]";

const badge =
  "inline-flex items-center px-1.5 py-[1px] rounded-md text-[10px] font-bold leading-none";

/* ═════════════════════════════════════════════════════════════════════
   ACCENT BAR
   ═════════════════════════════════════════════════════════════════════ */

const AccentBar = () => (
  <span className="w-1 h-5 rounded-full bg-gradient-to-b from-[#00b884] to-[#009270] dark:from-[#3ddba4] dark:to-[#12b985] flex-shrink-0" />
);

/* ═════════════════════════════════════════════════════════════════════
   SKELETON
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

/* ═════════════════════════════════════════════════════════════════════
   ERROR STATE
   ═════════════════════════════════════════════════════════════════════ */

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
   RECENT OVERS — renders balls as colored dots
   ═════════════════════════════════════════════════════════════════════ */

const RecentOvers = ({ recentStr }: { recentStr: string }) => {
  // recentStr looks like "1 1 W 4 0 2 | 1 0 6 ..."
  const tokens = recentStr.split(/\s+/).filter(Boolean);

  const getBallStyle = (token: string) => {
    const t = token.toUpperCase();
    if (t === "W")
      return "bg-red-500 text-white";
    if (t === "4")
      return "bg-blue-500 text-white";
    if (t === "6")
      return "bg-purple-500 text-white";
    if (t === "0" || t === ".")
      return "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400";
    if (t === "|")
      return null; // over separator
    if (t.includes("WD") || t.includes("NB") || t.includes("LB") || t.includes("B"))
      return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400";
    return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {tokens.map((token, i) => {
        if (token === "|") {
          return (
            <span
              key={i}
              className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 flex-shrink-0"
            />
          );
        }
        const style = getBallStyle(token);
        return (
          <span
            key={i}
            className={cx(
              "h-6 min-w-[24px] px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0",
              style
            )}
          >
            {token}
          </span>
        );
      })}
    </div>
  );
};

/* ═════════════════════════════════════════════════════════════════════
   STAT CHIP — small stat block used throughout
   ═════════════════════════════════════════════════════════════════════ */

const StatChip = ({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  icon?: React.ReactNode;
}) => (
  <div
    className={cx(
      "rounded-xl border px-3 py-2.5 flex flex-col gap-0.5 flex-1 min-w-[80px]",
      accent
        ? "bg-gradient-to-br from-[#009270]/[0.07] to-[#009270]/[0.02] dark:from-[#3ddba4]/[0.08] dark:to-[#3ddba4]/[0.02] border-[#009270]/15 dark:border-[#3ddba4]/15"
        : "border-black/[0.04] dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.015]"
    )}
  >
    <div className="flex items-center gap-1">
      {icon && (
        <span className="text-gray-400 dark:text-gray-500">{icon}</span>
      )}
      <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
        {label}
      </span>
    </div>
    <span
      className={cx(
        "text-lg sm:text-xl font-black tabular-nums",
        accent
          ? "text-[#009270] dark:text-[#3ddba4]"
          : "text-gray-900 dark:text-white"
      )}
    >
      {value}
    </span>
  </div>
);

/* ═════════════════════════════════════════════════════════════════════
   BATSMAN ROW
   ═════════════════════════════════════════════════════════════════════ */

const BatsmanRow = ({
  batsman,
  isStriker,
}: {
  batsman: BatsmanInfo;
  isStriker: boolean;
}) => {
  const sr =
    batsman.batBalls > 0
      ? ((batsman.batRuns / batsman.batBalls) * 100).toFixed(1)
      : "0.0";

  return (
    <div
      className={cx(
        "flex items-center justify-between gap-3 px-3 sm:px-4 py-3 rounded-xl transition-colors duration-150",
        isStriker
          ? "bg-[#009270]/[0.05] dark:bg-[#3ddba4]/[0.06] border border-[#009270]/15 dark:border-[#3ddba4]/15"
          : "bg-gray-50/60 dark:bg-white/[0.015] border border-transparent"
      )}
    >
      {/* Left: name */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {isStriker && (
          <span className="h-2 w-2 rounded-full bg-[#009270] dark:bg-[#3ddba4] flex-shrink-0 animate-pulse" />
        )}
        <span
          className={cx(
            "text-[13px] sm:text-sm font-semibold truncate",
            isStriker
              ? "text-[#00734f] dark:text-[#3ddba4]"
              : "text-gray-700 dark:text-gray-300"
          )}
        >
          {batsman.batName}
        </span>
        {isStriker && (
          <span
            className={cx(
              badge,
              "bg-[#009270]/10 text-[#00734f] dark:bg-[#3ddba4]/10 dark:text-[#3ddba4]"
            )}
          >
            ★
          </span>
        )}
      </div>

      {/* Right: stats */}
      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
        <div className="text-right">
          <span
            className={cx(
              "text-xl sm:text-2xl font-black tabular-nums",
              isStriker
                ? "text-[#009270] dark:text-[#3ddba4]"
                : "text-gray-900 dark:text-white"
            )}
          >
            {batsman.batRuns}
          </span>
          <span className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500 ml-0.5">
            ({batsman.batBalls})
          </span>
        </div>
        <div className="text-right hidden xs:block">
          <div className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            SR
          </div>
          <div className="text-xs font-bold text-gray-600 dark:text-gray-300 tabular-nums">
            {sr}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═════════════════════════════════════════════════════════════════════
   BOWLER ROW
   ═════════════════════════════════════════════════════════════════════ */

const BowlerRow = ({ bowler }: { bowler: BowlerInfo }) => {
  const econ =
    bowler.bowlOvs > 0
      ? (bowler.bowlRuns / bowler.bowlOvs).toFixed(2)
      : "0.00";

  return (
    <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-3 rounded-xl bg-gray-50/60 dark:bg-white/[0.015] border border-transparent">
      {/* Left: name */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Icon.Ball className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
        <span className="text-[13px] sm:text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">
          {bowler.bowlName}
        </span>
      </div>

      {/* Right: figures */}
      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
        <div className="text-right">
          <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tabular-nums">
            {bowler.bowlWkts}-{bowler.bowlRuns}
          </span>
          <span className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500 ml-0.5">
            ({fmtOvers(bowler.bowlOvs)})
          </span>
        </div>
        <div className="text-right hidden xs:block">
          <div className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Econ
          </div>
          <div className="text-xs font-bold text-gray-600 dark:text-gray-300 tabular-nums">
            {econ}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═════════════════════════════════════════════════════════════════════
   INNINGS SCORES LIST (previous innings summary)
   ═════════════════════════════════════════════════════════════════════ */

const InningsScoresList = ({
  list,
}: {
  list: NonNullable<
    MiniScore["matchScoreDetails"]
  >["inningsScoreList"];
}) => {
  if (!list?.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {list.map((inn, i) => (
        <div
          key={inn.inningsId ?? i}
          className="rounded-xl border border-black/[0.04] dark:border-white/[0.06] bg-gray-50/60 dark:bg-white/[0.015] px-3 py-2 flex items-center gap-2 min-w-0"
        >
          <span className="text-[11px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 truncate">
            {inn.batTeamSName || inn.batTeamName || `Inn ${(inn.inningsId ?? 0)}`}
          </span>
          <span className="text-sm sm:text-[15px] font-black text-gray-900 dark:text-white tabular-nums">
            {inn.score ?? 0}/{inn.wickets ?? 0}
          </span>
          {inn.overs !== undefined && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              ({fmtOvers(inn.overs)})
            </span>
          )}
          {inn.isDeclared && (
            <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 rounded">
              Dec
            </span>
          )}
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
      const res = await fetch("/api/score/livescore?matchId=160326",
        { cache: "no-store" }
      );
      if (!res.ok)
        throw new Error(
          `API returned ${res.status}: ${res.statusText || "Unknown error"}`
        );
      const json: LiveScoreResponse = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch live score"
      );
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  // Auto-refresh every 10s
  useEffect(() => {
    if (!data) return;
    const state = data.miniscore?.matchScoreDetails?.state;
    if (state === "Complete") return;
    const timer = setInterval(fetchData, 10_000);
    return () => clearInterval(timer);
  }, [data, fetchData]);

  const ms = data?.miniscore;
  const isComplete =
    ms?.matchScoreDetails?.state === "Complete";
  const inningsList =
    ms?.matchScoreDetails?.inningsScoreList;

  return (
    <div className="min-h-screen bg-[#f2f4f3] dark:bg-[#0a0f0d] transition-colors duration-300 font-sans overflow-x-hidden">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }
        @keyframes pulse-ring { 0% { transform:scale(1); opacity:0.6; } 100% { transform:scale(2.2); opacity:0; } }
        .no-scrollbar::-webkit-scrollbar { display:none; }
        .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
      `}</style>

      {/* ── Dark mode toggle ── */}
      <button
        onClick={() => setDarkMode((d) => !d)}
        className="fixed bottom-5 right-5 z-50 h-11 w-11 rounded-full bg-white dark:bg-[#161d1a] shadow-[0_4px_16px_-4px_rgba(0,0,0,0.2)] border border-black/[0.05] dark:border-white/10 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:scale-110 active:scale-95 transition-transform duration-200"
        aria-label="Toggle dark mode"
      >
        {darkMode ? (
          <Icon.Sun className="h-5 w-5" />
        ) : (
          <Icon.Moon className="h-5 w-5" />
        )}
      </button>

      {/* ── Loading ── */}
      {loading && !data && <Skeleton />}

      {/* ── Error ── */}
      {error && !data && <ErrorState msg={error} onRetry={fetchData} />}

      {/* ── Main content ── */}
      {ms && (
        <div className="animate-[fadeUp_0.35s_ease]">
          {/* ═══ TOP BAR ═══ */}
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
            {/* ── Error banner (stale data) ── */}
            {error && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3 text-xs sm:text-[13px] text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <Icon.Alert className="h-4 w-4 shrink-0" />
                <span className="break-words">{error} — Showing cached data.</span>
              </div>
            )}

            {/* ═══ STATUS ═══ */}
            <div className={card}>
              <div className="px-3 sm:px-5 py-4">
                {/* Status */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span
                    className={cx(
                      "inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-bold px-3 py-1 rounded-full",
                      isComplete
                        ? "text-[#00734f] dark:text-[#3ddba4] bg-[#009270]/[0.08] dark:bg-[#3ddba4]/[0.08]"
                        : "text-amber-700 dark:text-amber-400 bg-amber-500/[0.08]"
                    )}
                  >
                    <span
                      className={cx(
                        "h-1.5 w-1.5 rounded-full flex-shrink-0",
                        isComplete
                          ? "bg-[#009270] dark:bg-[#3ddba4]"
                          : "bg-amber-500 animate-pulse"
                      )}
                    />
                    {ms.status || ms.matchScoreDetails?.customStatus || "—"}
                  </span>

                  {ms.event && ms.event !== "None" && (
                    <span
                      className={cx(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                        ms.event.toUpperCase().includes("WICKET")
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : ms.event.toUpperCase().includes("FOUR") ||
                            ms.event.toUpperCase().includes("SIX")
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      )}
                    >
                      {ms.event}
                    </span>
                  )}
                </div>

                {/* Previous innings scores */}
                {inningsList && inningsList.length > 0 && (
                  <div className="mb-4">
                    <InningsScoresList list={inningsList} />
                  </div>
                )}

                {/* Current score banner */}
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
                      <div className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Target
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-[#009270] dark:text-[#3ddba4] tabular-nums">
                        {ms.target}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ═══ RATE STATS ═══ */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatChip
                label="Run Rate"
                value={fmtRate(ms.currentRunRate)}
                accent
                icon={<Icon.Activity className="h-3 w-3" />}
              />
              {ms.requiredRunRate !== undefined && ms.requiredRunRate > 0 && (
                <StatChip
                  label="Req. Rate"
                  value={fmtRate(ms.requiredRunRate)}
                  icon={<Icon.Target className="h-3 w-3" />}
                />
              )}
              <StatChip
                label="Overs"
                value={fmtOvers(ms.overs)}
                icon={<Icon.Ball className="h-3 w-3" />}
              />
              {ms.target !== undefined && ms.target > 0 && (
                <StatChip
                  label="Need"
                  value={(() => {
                    const currentScore =
                      inningsList?.length
                        ? inningsList[inningsList.length - 1]?.score ?? 0
                        : 0;
                    const need = ms.target - currentScore;
                    return need > 0 ? need : 0;
                  })()}
                  accent
                  icon={<Icon.Zap className="h-3 w-3" />}
                />
              )}
              {ms.partnership?.runs !== undefined && (
                <StatChip
                  label="Partnership"
                  value={`${ms.partnership.runs}(${ms.partnership.balls ?? 0})`}
                  icon={<Icon.Link className="h-3 w-3" />}
                />
              )}
            </div>

            {/* ═══ BATSMEN ═══ */}
            <div className={card}>
              <div className={sectionTitle}>
                <AccentBar />
                <span className="text-[#009270] dark:text-[#3ddba4]">
                  <Icon.Bat className="h-4 w-4" />
                </span>
                <span className={titleText}>At the Crease</span>
              </div>
              <div className="p-3 sm:p-4 space-y-2">
                <BatsmanRow
                  batsman={ms.batsmanStriker}
                  isStriker={true}
                />
                <BatsmanRow
                  batsman={ms.batsmanNonStriker}
                  isStriker={false}
                />
              </div>
            </div>

            {/* ═══ BOWLER ═══ */}
            <div className={card}>
              <div className={sectionTitle}>
                <AccentBar />
                <span className="text-[#009270] dark:text-[#3ddba4]">
                  <Icon.Ball className="h-4 w-4" />
                </span>
                <span className={titleText}>Bowling</span>
                {ms.bowlTeam?.teamSName && (
                  <span className="ml-0.5 text-xs text-gray-400 dark:text-gray-500 font-medium normal-case truncate">
                    {ms.bowlTeam.teamSName}
                  </span>
                )}
              </div>
              <div className="p-3 sm:p-4">
                <BowlerRow bowler={ms.bowlerStriker} />
              </div>
            </div>

            {/* ═══ RECENT OVERS ═══ */}
            {ms.recentOvsStats && (
              <div className={card}>
                <div className={sectionTitle}>
                  <AccentBar />
                  <span className="text-[#009270] dark:text-[#3ddba4]">
                    <Icon.Activity className="h-4 w-4" />
                  </span>
                  <span className={titleText}>Recent Overs</span>
                </div>
                <div className="p-3 sm:p-4 overflow-x-auto no-scrollbar">
                  <RecentOvers recentStr={ms.recentOvsStats} />
                </div>
              </div>
            )}

            {/* ═══ LAST WICKET ═══ */}
            {ms.lastWicket && (
              <div className={card}>
                <div className={sectionTitle}>
                  <AccentBar />
                  <span className="text-red-500">
                    <Icon.Fall className="h-4 w-4" />
                  </span>
                  <span
                    className={cx(
                      titleText,
                      "!text-red-600 dark:!text-red-400"
                    )}
                  >
                    Last Wicket
                  </span>
                </div>
                <div className="px-3 sm:px-5 py-3 text-xs sm:text-[13px] text-gray-700 dark:text-gray-300 break-words leading-relaxed">
                  {ms.lastWicket}
                </div>
              </div>
            )}

            {/* ═══ FOOTER ═══ */}
            <div className="bg-white dark:bg-[#111815] rounded-3xl border border-black/[0.04] dark:border-white/[0.06] px-4 sm:px-5 py-4 text-xs sm:text-[11.5px] text-gray-400 dark:text-gray-600 flex flex-wrap items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-4 flex-wrap min-w-0">
                {lastUpdated && (
                  <span>
                    Updated{" "}
                    {lastUpdated.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
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
                <Icon.Refresh className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
