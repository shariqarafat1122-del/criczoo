import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LiveMatch from "./LiveMatch";
import Squad from "./Squad";

/* ═══════════════════════════════════════════════════════════════════
   TYPES — mirrors the Cricbuzz scorecard API response
   ═══════════════════════════════════════════════════════════════════ */

interface TeamInfo {
  id?: number;
  name?: string;
  shortName?: string;
  imageId?: number;
}

interface VenueInfo {
  id?: number;
  name?: string;
  city?: string;
  country?: string;
  timezone?: string;
}

interface TossResults {
  tossWinnerId?: number;
  tossWinnerName?: string;
  decision?: string;
}

interface ResultInfo {
  resultType?: number;
  winningTeam?: string;
  winningTeamId?: string;
  winByRuns?: boolean;
  winByInnings?: boolean;
  winningMargin?: number;
}

interface PlayerOfMatch {
  id?: number;
  name?: string;
  fullName?: string;
  teamName?: string;
  teamId?: number;
}

interface MatchHeader {
  matchId?: number;
  matchDescription?: string;
  matchFormat?: string;
  matchType?: string;
  complete?: boolean;
  domestic?: boolean;
  matchStartTimestamp?: number;
  matchCompleteTimestamp?: number;
  dayNight?: boolean;
  year?: number;
  state?: string;
  status?: string;
  tossResults?: TossResults;
  result?: ResultInfo;
  revisedTarget?: { runs?: number; overs?: number };
  playersOfTheMatch?: PlayerOfMatch[];
  playersOfTheSeries?: PlayerOfMatch[];
  matchTeamInfo?: Array<{
    teamId?: number;
    teamShortName?: string;
    battingTeamFlag?: boolean;
  }>;
  seriesName?: string;
  series?: { id?: number; name?: string; type?: string };
  team1?: TeamInfo;
  team2?: TeamInfo;
  venue?: VenueInfo;
  matchNumber?: number | string;
  season?: string;
  umpire1?: string;
  umpire2?: string;
  umpire3?: string;
  referee?: string;
}

interface BatsmanData {
  batId?: number;
  batName?: string;
  batShortName?: string;
  isCaptain?: boolean;
  isKeeper?: boolean;
  runs?: number;
  balls?: number;
  dots?: number;
  fours?: number;
  sixes?: number;
  strikeRate?: number;
  outDesc?: string;
  bowlerId?: number;
  fielderId1?: number;
  fielderId2?: number;
  fielderName1?: string;
  fielderName2?: string;
  bowlerName?: string;
  ones?: number;
  twos?: number;
  threes?: number;
}

interface ExtrasData {
  byes?: number;
  legByes?: number;
  noBalls?: number;
  wides?: number;
  penalty?: number;
  totalExtras?: number;
}

interface ScoreDetails {
  runs?: number;
  wickets?: number;
  overs?: number;
  ballNbr?: number;
  isDeclared?: boolean;
  isFollowOn?: boolean;
  runRate?: number;
}

interface WicketData {
  wktNbr?: number;
  wktRuns?: number;
  wktOver?: number;
  batId?: number;
  batName?: string;
  teamId?: number;
}

interface BowlerData {
  bowlId?: number;
  bowlName?: string;
  bowlShortName?: string;
  isCaptain?: boolean;
  isKeeper?: boolean;
  overs?: number;
  maidens?: number;
  runs?: number;
  wickets?: number;
  economy?: number;
  no_balls?: number;
  wides?: number;
  dots?: number;
  balls?: number;
  runsPerBall?: number;
}

interface PartnershipData {
  bat1Id?: number;
  bat1Name?: string;
  bat1Runs?: number;
  bat1Balls?: number;
  bat2Id?: number;
  bat2Name?: string;
  bat2Runs?: number;
  bat2Balls?: number;
  totalRuns?: number;
  totalBalls?: number;
}

interface TeamBatDetails {
  batTeamId?: number;
  batTeamName?: string;
  batTeamShortName?: string;
  batsmenData?: Record<string, BatsmanData>;
}

interface TeamBowlDetails {
  bowlTeamId?: number;
  bowlTeamName?: string;
  bowlTeamShortName?: string;
  bowlersData?: Record<string, BowlerData>;
}

interface PowerPlayData {
  ppType?: string;
  ppOversFrom?: number;
  ppOversTo?: number;
  runsScored?: number;
}

interface InningsData {
  inningsId?: number;
  batTeamDetails?: TeamBatDetails;
  bowlTeamDetails?: TeamBowlDetails;
  scoreDetails?: ScoreDetails;
  extrasData?: ExtrasData;
  wicketsData?: Record<string, WicketData>;
  partnershipsData?: Record<string, PartnershipData>;
  powerPlayData?: Record<string, PowerPlayData>;
  didNotBatData?: Record<string, { batId?: number; batName?: string }>;
}

interface ScorecardResponse {
  matchHeader?: MatchHeader;
  scoreCard?: InningsData[];
  playingxi?: Array<{
    teamId?: number;
    player?: Array<{
      id?: number;
      name?: string;
      fullName?: string;
      isCaptain?: boolean;
      isKeeper?: boolean;
      isOverseas?: boolean;
    }>;
  }>;
  bench?: Array<{
    teamId?: number;
    player?: Array<{ id?: number; name?: string; fullName?: string }>;
  }>;
  matchNotes?: string[];
  status?: string;
  isMatchComplete?: boolean;
}

/* ═══════════════════════════════════════════════════════════════════
   GLOBAL STYLES — injected once via <style>
   ═══════════════════════════════════════════════════════════════════ */

const CUSTOM_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');

*, *::before, *::after { font-family: 'Inter', system-ui, -apple-system, sans-serif; }

@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes liveDot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.4; transform: scale(0.7); }
}
@keyframes spinSmooth {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes gradientShift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes slideIn {
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
}

.shimmer-skeleton {
  background: linear-gradient(90deg, rgba(148,163,184,0.04) 25%, rgba(148,163,184,0.10) 50%, rgba(148,163,184,0.04) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
  border-radius: 8px;
}

.section-enter { animation: fadeInUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
.slide-in      { animation: slideIn 0.3s ease-out both; }
.live-dot      { animation: liveDot 1.4s ease-in-out infinite; }
.spin-smooth   { animation: spinSmooth 1s linear infinite; }
.score-mono    { font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace; }

.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

.glass {
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
}
.glass-header {
  background: rgba(6, 9, 24, 0.82);
  backdrop-filter: blur(24px) saturate(1.6);
  -webkit-backdrop-filter: blur(24px) saturate(1.6);
}
.glass-subtle {
  background: rgba(15, 23, 42, 0.3);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.gradient-mesh {
  background:
    radial-gradient(ellipse 80% 60% at 15% 50%, rgba(16,185,129,0.07) 0%, transparent 60%),
    radial-gradient(ellipse 60% 50% at 85% 20%, rgba(59,130,246,0.06) 0%, transparent 55%),
    radial-gradient(ellipse 70% 60% at 50% 90%, rgba(168,85,247,0.05) 0%, transparent 55%),
    radial-gradient(ellipse 50% 40% at 70% 60%, rgba(251,191,36,0.03) 0%, transparent 50%);
}

.header-stripe {
  background: linear-gradient(90deg, #059669, #10b981, #34d399, #6ee7b7, #34d399, #10b981, #059669);
  background-size: 200% 100%;
  animation: gradientShift 4s ease-in-out infinite;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
`;

/* ═══════════════════════════════════════════════════════════════════
   UTILITY HELPERS
   ═══════════════════════════════════════════════════════════════════ */

const fmt = (v: number | string | undefined, fallback = "—") =>
  v !== undefined && v !== null && v !== "" ? String(v) : fallback;

const fmtOvers = (v?: number) => (v !== undefined ? v.toFixed(1) : "—");

const fmtRate = (v?: number) => (v !== undefined ? v.toFixed(2) : "—");

const imgUrl = (imageId?: number) =>
  imageId ? `https://static.cricbuzz.com/a/img/v1/i1/c${imageId}/i.jpg` : null;

const tsToDate = (ts?: number) => {
  if (!ts) return null;
  try {
    return new Date(ts).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return null;
  }
};

const cx = (...classes: (string | false | undefined | null)[]) =>
  classes.filter(Boolean).join(" ");

/* ═══════════════════════════════════════════════════════════════════
   DESIGN TOKENS — dark glass aesthetic
   ═══════════════════════════════════════════════════════════════════ */

const card =
  "glass rounded-2xl border border-white/[0.06] overflow-hidden mb-5 transition-all duration-300 hover:border-white/[0.1] w-full";

const sectionTitle =
  "flex items-center gap-2.5 px-3 sm:px-5 py-3 bg-gradient-to-r from-emerald-500/[0.08] via-emerald-500/[0.03] to-transparent border-b border-white/[0.05]";

const titleText =
  "text-[11px] sm:text-[11.5px] font-bold text-emerald-400 uppercase tracking-[0.08em]";

const th =
  "px-2 sm:px-3.5 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap";

const td =
  "px-2 sm:px-3.5 py-2.5 text-xs sm:text-[13px] text-slate-300 whitespace-nowrap";

const trEven = "bg-transparent";
const trOdd = "bg-white/[0.015]";
const trHover =
  "hover:bg-emerald-500/[0.04] transition-colors duration-150";

const badge =
  "inline-flex items-center px-1.5 py-[1px] rounded-md text-[10px] font-bold leading-none";

const pill =
  "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold";

/* ═══════════════════════════════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════════════════════════════ */

const Icon = {
  Bat: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 3.5 20.5 9.5" /><path d="M9 9 3 15a2.5 2.5 0 0 0 3.5 3.5L12 13" />
      <path d="M12.5 5.5 18.5 11.5 14 16 8 10Z" />
    </svg>
  ),
  Ball: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3c2 3 2 15 0 18M4 8c3-1 13-1 16 0M4 16c3 1 13 1 16 0" />
    </svg>
  ),
  Trophy: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4" />
    </svg>
  ),
  Fall: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v14M12 16l-4-4M12 16l4-4M5 21h14" />
    </svg>
  ),
  Link: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 17H7a5 5 0 0 1 0-10h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8" />
    </svg>
  ),
  Bolt: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  ),
  Info: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v5h1" />
    </svg>
  ),
  Pin: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" /><circle cx="12" cy="10" r="2.4" />
    </svg>
  ),
  Coin: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M9.5 9.2c0-1 1-1.7 2.5-1.7s2.5.8 2.5 1.7c0 2.3-5 1.7-5 4 0 1 1 1.8 2.5 1.8s2.5-.8 2.5-1.8M12 6v1.3M12 16.7V18" />
    </svg>
  ),
  Medal: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="15" r="5" /><path d="m9 11-3-7h3l2 4.5M15 11l3-7h-3l-2 4.5" /><path d="M12 13v4" />
    </svg>
  ),
  Refresh: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 15.3-6.4L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.3 6.4L3 16M3 21v-5h5" />
    </svg>
  ),
  Users: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
    </svg>
  ),
  Notes: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6l5 5v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v6h6M9 12h6M9 16h6" />
    </svg>
  ),
  Alert: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v4M12 17h.01M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  ),
  Back: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  ),
  Chevron: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
};

/* ═══════════════════════════════════════════════════════════════════
   PRIMITIVE COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

const AccentBar = () => (
  <span className="w-1 h-5 rounded-full flex-shrink-0"
    style={{ background: "linear-gradient(to bottom, #34d399, #059669)" }}
  />
);

const Section = ({
  icon,
  title,
  subtitle,
  children,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  delay?: number;
}) => (
  <div className={cx(card, "section-enter")} style={{ animationDelay: `${delay}ms` }}>
    <div className={sectionTitle}>
      <AccentBar />
      <span className="text-emerald-400">{icon}</span>
      <span className={titleText}>{title}</span>
      {subtitle && (
        <span className="ml-0.5 text-xs text-slate-500 font-medium normal-case truncate">
          {subtitle}
        </span>
      )}
    </div>
    {children}
  </div>
);

const InfoTable = ({
  rows,
}: {
  rows: Array<{ label: string; value?: string | number | null }>;
}) => {
  const filtered = rows.filter((r) => r.value !== undefined && r.value !== null && r.value !== "");
  if (!filtered.length) return null;
  return (
    <div className="w-full">
      <table className="w-full table-fixed">
        <tbody>
          {filtered.map((r, i) => (
            <tr
              key={r.label + i}
              className={cx(
                i % 2 === 0 ? trEven : trOdd,
                trHover,
                "border-b border-white/[0.03] last:border-0"
              )}
            >
              <td className="px-3 sm:px-5 py-3 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider w-28 sm:w-36 align-top whitespace-nowrap">
                {r.label}
              </td>
              <td className="px-3 sm:px-5 py-3 text-xs sm:text-[13.5px] text-slate-200 font-semibold break-words">
                {r.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Skeleton = () => (
  <div className="max-w-4xl mx-auto px-3 py-6 space-y-5">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="glass rounded-2xl border border-white/[0.04] p-6 w-full">
        <div className="h-4 shimmer-skeleton w-1/3 mb-4" />
        <div className="space-y-2.5">
          {[...Array(3)].map((_, j) => (
            <div key={j} className="h-3 shimmer-skeleton" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

const ErrorState = ({ msg, onRetry }: { msg: string; onRetry?: () => void }) => (
  <div className="max-w-4xl mx-auto px-3 py-16 flex flex-col items-center gap-5">
    <div
      className="h-16 w-16 rounded-2xl flex items-center justify-center"
      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}
    >
      <Icon.Alert className="h-8 w-8 text-red-400" />
    </div>
    <div className="text-center max-w-sm">
      <p className="font-bold text-slate-200 mb-1.5">Something went wrong</p>
      <p className="text-sm text-slate-500 mb-5 leading-relaxed">{msg}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(135deg, #059669, #10b981)",
            boxShadow: "0 4px 16px -4px rgba(16,185,129,0.4)",
          }}
        >
          Try Again
        </button>
      )}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   MATCH HEADER
   ═══════════════════════════════════════════════════════════════════ */

const MatchHeaderCard = ({ mh, status, onBack }: { mh: MatchHeader; status?: string; onBack?: () => void }) => {
  const logo1 = imgUrl(mh.team1?.imageId);
  const logo2 = imgUrl(mh.team2?.imageId);

  const tossText = mh.tossResults?.tossWinnerName
    ? `${mh.tossResults.tossWinnerName} won the toss, elected to ${mh.tossResults.decision}`
    : null;

  const resultText =
    mh.result?.winningTeam && mh.result.winningMargin !== undefined
      ? `${mh.result.winningTeam} won by ${mh.result.winningMargin} ${
          mh.result.winByRuns
            ? "runs"
            : mh.result.winByInnings
            ? "innings & " + mh.result.winningMargin + " runs"
            : "wickets"
        }`
      : mh.status || status || null;

  const isLive = !mh.complete && (mh.state?.toLowerCase().includes("progress") || mh.state?.toLowerCase().includes("rain") || mh.state?.toLowerCase().includes("stump"));

  return (
    <div className="sticky top-0 z-50 glass-header border-b border-white/[0.04] w-full">
      {/* Animated accent stripe */}
      <div className="header-stripe h-[2px]" />

      {/* Series bar */}
      <div className="px-3 sm:px-5 py-2 flex items-center justify-between gap-2 border-b border-white/[0.04]">
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/20 transition-all flex-shrink-0"
            >
              <Icon.Back className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-slate-400 text-[11px] font-semibold tracking-wide truncate">
            {mh.seriesName || mh.series?.name || "Cricket Scorecard"}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isLive && (
            <span className="flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" />
              LIVE
            </span>
          )}
          {mh.matchFormat && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/[0.06] text-slate-300 tracking-wider border border-white/[0.08]">
              {mh.matchFormat}
            </span>
          )}
        </div>
      </div>

      {/* Teams */}
      <div className="px-3 sm:px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          {/* Team 1 */}
          <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
            {logo1 ? (
              <img
                src={logo1}
                alt={mh.team1?.shortName || ""}
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain rounded-xl border border-white/[0.08] bg-slate-800/50 p-1"
                onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
              />
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center text-emerald-400 text-sm font-black">
                {(mh.team1?.shortName || "?").slice(0, 3)}
              </div>
            )}
            <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight text-center">
              {mh.team1?.shortName || mh.team1?.name || "—"}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 text-center truncate w-full hidden sm:block">
              {mh.team1?.name}
            </span>
          </div>

          {/* VS */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <span
              className="text-[11px] font-black px-3.5 py-1.5 rounded-full text-white"
              style={{
                background: "linear-gradient(135deg, #059669, #10b981)",
                boxShadow: "0 4px 16px -4px rgba(16,185,129,0.35)",
              }}
            >
              VS
            </span>
            {(mh.matchDescription || mh.matchNumber) && (
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium text-center whitespace-nowrap">
                {mh.matchDescription}
              </span>
            )}
          </div>

          {/* Team 2 */}
          <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
            {logo2 ? (
              <img
                src={logo2}
                alt={mh.team2?.shortName || ""}
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain rounded-xl border border-white/[0.08] bg-slate-800/50 p-1"
                onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
              />
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center text-emerald-400 text-sm font-black">
                {(mh.team2?.shortName || "?").slice(0, 3)}
              </div>
            )}
            <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight text-center">
              {mh.team2?.shortName || mh.team2?.name || "—"}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 text-center truncate w-full hidden sm:block">
              {mh.team2?.name}
            </span>
          </div>
        </div>

        {/* Result / Status */}
        {resultText && (
          <div className="mt-4 text-center">
            <span
              className={cx(
                "inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-bold px-4 py-1.5 rounded-full",
                mh.complete
                  ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/15"
                  : "text-amber-400 bg-amber-500/10 border border-amber-500/15"
              )}
            >
              <span
                className={cx(
                  "h-1.5 w-1.5 rounded-full flex-shrink-0",
                  mh.complete ? "bg-emerald-400" : "bg-amber-400 live-dot"
                )}
              />
              {resultText}
            </span>
          </div>
        )}
      </div>

      {/* Meta bar */}
      <div className="border-t border-white/[0.04] px-3 sm:px-5 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] sm:text-[11px] text-slate-500 bg-white/[0.01]">
        {mh.venue?.name && (
          <span className="inline-flex items-center gap-1">
            <Icon.Pin className="h-3 w-3 text-slate-600 flex-shrink-0" />
            <span className="truncate">{mh.venue.name}{mh.venue.city ? `, ${mh.venue.city}` : ""}</span>
          </span>
        )}
        {tossText && (
          <span className="inline-flex items-center gap-1">
            <Icon.Coin className="h-3 w-3 text-slate-600 flex-shrink-0" />
            <span className="truncate">{tossText}</span>
          </span>
        )}
        {mh.playersOfTheMatch?.[0]?.fullName && (
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
            <Icon.Medal className="h-3 w-3 flex-shrink-0" />
            {mh.playersOfTheMatch[0].fullName}
          </span>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   MATCH INFORMATION
   ═══════════════════════════════════════════════════════════════════ */

const MatchInformation = ({ mh }: { mh: MatchHeader }) => {
  const rows: Array<{ label: string; value?: string | number | null }> = [
    { label: "Series", value: mh.seriesName || mh.series?.name },
    { label: "Match", value: mh.matchDescription },
    { label: "Format", value: mh.matchFormat || mh.matchType },
    { label: "Season", value: mh.season },
    { label: "Venue", value: mh.venue?.name },
    { label: "City", value: mh.venue?.city },
    { label: "Country", value: mh.venue?.country },
    { label: "Day / Night", value: mh.dayNight ? "Yes" : undefined },
    { label: "Start Date", value: tsToDate(mh.matchStartTimestamp) ?? undefined },
    { label: "End Date", value: tsToDate(mh.matchCompleteTimestamp) ?? undefined },
    { label: "Umpire 1", value: mh.umpire1 },
    { label: "Umpire 2", value: mh.umpire2 },
    { label: "Third Umpire", value: mh.umpire3 },
    { label: "Referee", value: mh.referee },
    {
      label: "Toss",
      value: mh.tossResults?.tossWinnerName
        ? `${mh.tossResults.tossWinnerName} won — ${mh.tossResults.decision}`
        : undefined,
    },
    { label: "Winner", value: mh.result?.winningTeam },
    {
      label: "Margin",
      value:
        mh.result?.winningMargin !== undefined
          ? `${mh.result.winningMargin} ${mh.result.winByRuns ? "runs" : "wickets"}`
          : undefined,
    },
    ...(mh.playersOfTheMatch?.map((p, i) => ({
      label: i === 0 ? "Player of Match" : `Player of Match ${i + 1}`,
      value: p.fullName || p.name,
    })) ?? []),
  ];

  return (
    <Section icon={<Icon.Info className="h-4 w-4" />} title="Match Information" delay={100}>
      <InfoTable rows={rows} />
    </Section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   BATTING TABLE
   ═══════════════════════════════════════════════════════════════════ */

const BattingTable = ({ innings }: { innings: InningsData }) => {
  const batsmen = Object.values(innings.batTeamDetails?.batsmenData ?? {});
  if (!batsmen.length) return null;

  return (
    <div>
      <div className={sectionTitle}>
        <AccentBar />
        <span className="text-emerald-400"><Icon.Bat className="h-4 w-4" /></span>
        <span className={titleText}>Batting</span>
        <span className="ml-0.5 text-xs text-slate-500 font-medium normal-case truncate">
          {innings.batTeamDetails?.batTeamName}
        </span>
      </div>

      {/* Desktop table (sm+) */}
      <div className="hidden sm:block w-full">
        <table className="w-full table-fixed">
          <thead className="bg-white/[0.02]">
            <tr>
              <th className={cx(th, "text-left w-[45%]")}>Batter</th>
              <th className={cx(th, "text-right w-[11%]")}>R</th>
              <th className={cx(th, "text-right w-[11%]")}>B</th>
              <th className={cx(th, "text-right w-[11%]")}>4s</th>
              <th className={cx(th, "text-right w-[11%]")}>6s</th>
              <th className={cx(th, "text-right w-[11%]")}>SR</th>
            </tr>
          </thead>
          <tbody>
            {batsmen.map((b, i) => {
              const notOut =
                !b.outDesc ||
                b.outDesc.toLowerCase() === "not out" ||
                b.outDesc.toLowerCase() === "batting";
              const dnb = b.balls === undefined && b.runs === undefined;
              return (
                <tr key={b.batId ?? i} className={cx(i % 2 === 0 ? trEven : trOdd, trHover)}>
                  <td className={cx(td, "!whitespace-normal")}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={cx(
                          "font-semibold",
                          notOut ? "text-emerald-400" : "text-slate-200"
                        )}
                      >
                        {b.batName || "—"}
                        {notOut && !dnb && <span className="text-emerald-400 ml-0.5">*</span>}
                      </span>
                      {b.isCaptain && (
                        <span className={cx(badge, "bg-amber-500/10 text-amber-400 border border-amber-500/15")}>C</span>
                      )}
                      {b.isKeeper && (
                        <span className={cx(badge, "bg-sky-500/10 text-sky-400 border border-sky-500/15")}>WK</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 leading-snug mt-0.5 break-words">
                      {b.outDesc || (dnb ? "Did Not Bat" : "not out")}
                    </div>
                  </td>
                  <td className={cx(td, "text-right font-extrabold text-[14.5px] score-mono",
                    notOut && !dnb ? "text-emerald-400"
                    : (b.runs ?? 0) === 0 ? "text-slate-600"
                    : "text-white"
                  )}>
                    {dnb ? "—" : fmt(b.runs)}
                  </td>
                  <td className={cx(td, "text-right score-mono")}>{dnb ? "—" : fmt(b.balls)}</td>
                  <td className={cx(td, "text-right score-mono")}>{dnb ? "—" : fmt(b.fours)}</td>
                  <td className={cx(td, "text-right score-mono")}>{dnb ? "—" : fmt(b.sixes)}</td>
                  <td className={cx(td, "text-right score-mono")}>{dnb ? "—" : fmtRate(b.strikeRate)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout (< sm) */}
      <div className="sm:hidden divide-y divide-white/[0.03]">
        {batsmen.map((b, i) => {
          const notOut =
            !b.outDesc ||
            b.outDesc.toLowerCase() === "not out" ||
            b.outDesc.toLowerCase() === "batting";
          const dnb = b.balls === undefined && b.runs === undefined;
          return (
            <div key={b.batId ?? i} className={cx("px-3 py-3", i % 2 === 0 ? trEven : trOdd)}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                  <span className={cx("text-[13px] font-semibold", notOut ? "text-emerald-400" : "text-slate-200")}>
                    {b.batName || "—"}
                    {notOut && !dnb && <span className="ml-0.5">*</span>}
                  </span>
                  {b.isCaptain && <span className={cx(badge, "bg-amber-500/10 text-amber-400 border border-amber-500/15")}>C</span>}
                  {b.isKeeper && <span className={cx(badge, "bg-sky-500/10 text-sky-400 border border-sky-500/15")}>WK</span>}
                </div>
                <span className={cx(
                  "text-lg font-black score-mono flex-shrink-0",
                  notOut && !dnb ? "text-emerald-400" : (b.runs ?? 0) === 0 ? "text-slate-600" : "text-white"
                )}>
                  {dnb ? "—" : fmt(b.runs)}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 leading-snug mt-1 break-words">
                {b.outDesc || (dnb ? "Did Not Bat" : "not out")}
              </div>
              {!dnb && (
                <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                  <span><span className="font-semibold text-slate-300 score-mono">{fmt(b.balls)}</span>b</span>
                  <span><span className="font-semibold text-slate-300 score-mono">{fmt(b.fours)}</span> 4s</span>
                  <span><span className="font-semibold text-slate-300 score-mono">{fmt(b.sixes)}</span> 6s</span>
                  <span>SR <span className="font-semibold text-slate-300 score-mono">{fmtRate(b.strikeRate)}</span></span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   EXTRAS
   ═══════════════════════════════════════════════════════════════════ */

const Extras = ({ extras }: { extras: ExtrasData }) => {
  const items = [
    { label: "B", full: "Byes", value: extras.byes },
    { label: "LB", full: "Leg Byes", value: extras.legByes },
    { label: "NB", full: "No Balls", value: extras.noBalls },
    { label: "WD", full: "Wides", value: extras.wides },
    { label: "P", full: "Penalty", value: extras.penalty },
  ].filter((x) => x.value !== undefined);

  return (
    <div className="px-3 sm:px-5 py-3 bg-white/[0.02] border-t border-white/[0.04]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Extras</span>
        <span className="font-extrabold text-white score-mono">{fmt(extras.totalExtras)}</span>
        <span className="text-slate-700">·</span>
        {items.map((it) => (
          <span key={it.label} className="text-xs text-slate-500">
            <span className="font-semibold text-slate-400">{it.full}</span> {it.value}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   SCORE TOTAL BANNER
   ═══════════════════════════════════════════════════════════════════ */

const ScoreTotal = ({ score }: { score: ScoreDetails }) => (
  <div className="px-3 sm:px-5 py-3.5 border-t border-white/[0.04] flex flex-wrap items-center gap-x-3 gap-y-1 bg-emerald-500/[0.04]">
    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Total</span>
    <span className="font-black text-white text-xl score-mono">
      {fmt(score.runs)}/{fmt(score.wickets)}
    </span>
    {score.isDeclared && (
      <span className={cx(pill, "bg-violet-500/10 text-violet-400 border border-violet-500/15")}>Dec</span>
    )}
    {score.isFollowOn && (
      <span className={cx(pill, "bg-amber-500/10 text-amber-400 border border-amber-500/15")}>F/O</span>
    )}
    <span className="text-xs sm:text-[13px] text-slate-400 score-mono">({fmtOvers(score.overs)} Ov)</span>
    {score.runRate !== undefined && (
      <span className="text-xs sm:text-[13px] text-slate-500">
        RR <span className="font-bold text-slate-300 score-mono">{fmtRate(score.runRate)}</span>
      </span>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   DID NOT BAT
   ═══════════════════════════════════════════════════════════════════ */

const DidNotBat = ({ dnb }: { dnb: Record<string, { batId?: number; batName?: string }> }) => {
  const players = Object.values(dnb);
  if (!players.length) return null;
  return (
    <div className="px-3 sm:px-5 py-2.5 border-t border-white/[0.04] bg-white/[0.01]">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-2">
        Did Not Bat
      </span>
      <span className="text-xs sm:text-[12.5px] text-slate-400 break-words">
        {players.map((p) => p.batName).filter(Boolean).join(", ")}
      </span>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   BOWLING TABLE
   ═══════════════════════════════════════════════════════════════════ */

const BowlingTable = ({ innings }: { innings: InningsData }) => {
  const bowlers = Object.values(innings.bowlTeamDetails?.bowlersData ?? {});
  if (!bowlers.length) return null;

  const maxWkts = Math.max(...bowlers.map((b) => b.wickets ?? 0));
  const minEco = Math.min(...bowlers.filter((b) => (b.overs ?? 0) > 0).map((b) => b.economy ?? Infinity));

  return (
    <div className="border-t border-white/[0.04]">
      <div className={sectionTitle}>
        <AccentBar />
        <span className="text-emerald-400"><Icon.Ball className="h-4 w-4" /></span>
        <span className={titleText}>Bowling</span>
        <span className="ml-0.5 text-xs text-slate-500 font-medium normal-case truncate">
          {innings.bowlTeamDetails?.bowlTeamName}
        </span>
      </div>

      {/* Desktop table (sm+) */}
      <div className="hidden sm:block w-full">
        <table className="w-full table-fixed">
          <thead className="bg-white/[0.02]">
            <tr>
              <th className={cx(th, "text-left w-[30%]")}>Bowler</th>
              <th className={cx(th, "text-right w-[10%]")}>O</th>
              <th className={cx(th, "text-right w-[10%]")}>M</th>
              <th className={cx(th, "text-right w-[10%]")}>R</th>
              <th className={cx(th, "text-right w-[10%]")}>W</th>
              <th className={cx(th, "text-right w-[10%]")}>Econ</th>
              <th className={cx(th, "text-right w-[10%]")}>NB</th>
              <th className={cx(th, "text-right w-[10%]")}>WD</th>
            </tr>
          </thead>
          <tbody>
            {bowlers.map((b, i) => {
              const isBestEco = b.economy !== undefined && b.economy === minEco && minEco < Infinity;
              const isTopWkt = (b.wickets ?? 0) === maxWkts && maxWkts > 0;
              return (
                <tr key={b.bowlId ?? i} className={cx(i % 2 === 0 ? trEven : trOdd, trHover)}>
                  <td className={cx(td, "font-semibold !whitespace-normal")}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-slate-200">{b.bowlName || "—"}</span>
                      {b.isCaptain && (
                        <span className={cx(badge, "bg-amber-500/10 text-amber-400 border border-amber-500/15")}>C</span>
                      )}
                      {isTopWkt && (
                        <span className={cx(badge, "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15")}>Best</span>
                      )}
                    </div>
                  </td>
                  <td className={cx(td, "text-right score-mono")}>{fmtOvers(b.overs)}</td>
                  <td className={cx(td, "text-right score-mono")}>{fmt(b.maidens)}</td>
                  <td className={cx(td, "text-right score-mono")}>{fmt(b.runs)}</td>
                  <td className={cx(td, "text-right font-extrabold score-mono",
                    isTopWkt ? "text-emerald-400" : "text-white"
                  )}>
                    {fmt(b.wickets)}
                  </td>
                  <td className={cx(td, "text-right font-bold score-mono",
                    isBestEco ? "text-emerald-400" : "text-slate-300"
                  )}>
                    {fmtRate(b.economy)}
                  </td>
                  <td className={cx(td, "text-right score-mono")}>{fmt(b.no_balls, "0")}</td>
                  <td className={cx(td, "text-right score-mono")}>{fmt(b.wides, "0")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout (< sm) */}
      <div className="sm:hidden divide-y divide-white/[0.03]">
        {bowlers.map((b, i) => {
          const isBestEco = b.economy !== undefined && b.economy === minEco && minEco < Infinity;
          const isTopWkt = (b.wickets ?? 0) === maxWkts && maxWkts > 0;
          return (
            <div key={b.bowlId ?? i} className={cx("px-3 py-3", i % 2 === 0 ? trEven : trOdd)}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                  <span className="text-[13px] font-semibold text-slate-200">{b.bowlName || "—"}</span>
                  {b.isCaptain && <span className={cx(badge, "bg-amber-500/10 text-amber-400 border border-amber-500/15")}>C</span>}
                  {isTopWkt && <span className={cx(badge, "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15")}>Best</span>}
                </div>
                <div className="flex items-baseline gap-1 flex-shrink-0">
                  <span className={cx("text-lg font-black score-mono", isTopWkt ? "text-emerald-400" : "text-white")}>
                    {fmt(b.wickets)}
                  </span>
                  <span className="text-slate-600 text-xs">/</span>
                  <span className="text-sm font-bold text-slate-300 score-mono">{fmt(b.runs)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                <span><span className="font-semibold text-slate-300 score-mono">{fmtOvers(b.overs)}</span> ov</span>
                <span><span className="font-semibold text-slate-300 score-mono">{fmt(b.maidens)}</span> md</span>
                <span>Econ <span className={cx("font-semibold score-mono", isBestEco ? "text-emerald-400" : "text-slate-300")}>{fmtRate(b.economy)}</span></span>
                {(b.no_balls ?? 0) > 0 && <span className="text-amber-500/80">{b.no_balls}nb</span>}
                {(b.wides ?? 0) > 0 && <span className="text-amber-500/80">{b.wides}wd</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   FALL OF WICKETS
   ═══════════════════════════════════════════════════════════════════ */

const FallOfWickets = ({ wickets }: { wickets: Record<string, WicketData> }) => {
  const list = Object.values(wickets).sort((a, b) => (a.wktNbr ?? 0) - (b.wktNbr ?? 0));
  if (!list.length) return null;

  return (
    <div className="border-t border-white/[0.04]">
      <div className={sectionTitle}>
        <AccentBar />
        <span className="text-emerald-400"><Icon.Fall className="h-4 w-4" /></span>
        <span className={titleText}>Fall of Wickets</span>
      </div>
      <div className="px-3 sm:px-5 py-4">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
          {list.map((w, i) => (
            <div
              key={i}
              className="relative flex flex-col items-center rounded-xl glass-subtle border border-white/[0.06] px-2 py-2.5 hover:-translate-y-0.5 hover:border-emerald-500/20 transition-all duration-200"
            >
              <span className="text-[9px] font-bold text-slate-500 tracking-wider">
                WKT {w.wktNbr}
              </span>
              <span className="text-sm sm:text-[15px] font-black text-white mt-0.5 score-mono">
                {fmt(w.wktRuns)}
              </span>
              {w.wktOver !== undefined && (
                <span className="text-[10px] text-slate-500 score-mono">({fmtOvers(w.wktOver)})</span>
              )}
              {w.batName && (
                <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-400 mt-1 break-words text-center leading-tight">
                  {w.batName}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   PARTNERSHIPS
   ═══════════════════════════════════════════════════════════════════ */

const Partnerships = ({ data }: { data: Record<string, PartnershipData> }) => {
  const list = Object.values(data);
  if (!list.length) return null;
  const maxRuns = Math.max(...list.map((p) => p.totalRuns ?? 0), 1);

  return (
    <div className="border-t border-white/[0.04]">
      <div className={sectionTitle}>
        <AccentBar />
        <span className="text-emerald-400"><Icon.Link className="h-4 w-4" /></span>
        <span className={titleText}>Partnerships</span>
      </div>
      <div className="px-3 sm:px-5 py-4 space-y-2.5">
        {list.map((p, i) => {
          const pct = ((p.totalRuns ?? 0) / maxRuns) * 100;
          return (
            <div
              key={i}
              className="rounded-xl border border-white/[0.05] p-3 hover:bg-white/[0.02] hover:border-white/[0.08] transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-2 gap-2">
                <div className="text-xs sm:text-[12.5px] text-slate-300 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                    <span className="font-semibold text-slate-200">{p.bat1Name || "—"}</span>
                    <span className="text-slate-500 text-[10px] sm:text-[11px] score-mono">
                      {fmt(p.bat1Runs)}({fmt(p.bat1Balls)}b)
                    </span>
                    <span className="text-slate-600">&amp;</span>
                    <span className="font-semibold text-slate-200">{p.bat2Name || "—"}</span>
                    <span className="text-slate-500 text-[10px] sm:text-[11px] score-mono">
                      {fmt(p.bat2Runs)}({fmt(p.bat2Balls)}b)
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-black text-white score-mono">{fmt(p.totalRuns)}</span>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 ml-1 score-mono">({fmt(p.totalBalls)}b)</span>
                </div>
              </div>
              <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${pct}%`,
                    background: "linear-gradient(90deg, #059669, #34d399)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   POWERPLAY
   ═══════════════════════════════════════════════════════════════════ */

const Powerplay = ({ data }: { data: Record<string, PowerPlayData> }) => {
  const list = Object.values(data);
  if (!list.length) return null;

  return (
    <div className="border-t border-white/[0.04]">
      <div className={sectionTitle}>
        <AccentBar />
        <span className="text-emerald-400"><Icon.Bolt className="h-4 w-4" /></span>
        <span className={titleText}>Powerplay</span>
      </div>
      <div className="px-3 sm:px-5 py-4 flex flex-wrap gap-3">
        {list.map((pp, i) => (
          <div
            key={i}
            className="rounded-xl bg-emerald-500/[0.05] border border-emerald-500/10 px-4 py-3 flex-1 min-w-[110px]"
          >
            <div className="text-[10px] font-bold text-emerald-400 mb-1 uppercase tracking-wide">
              {pp.ppType || `PP ${i + 1}`}
            </div>
            {pp.ppOversFrom !== undefined && pp.ppOversTo !== undefined && (
              <div className="text-[11px] text-slate-500 score-mono">
                Overs {pp.ppOversFrom}–{pp.ppOversTo}
              </div>
            )}
            <div className="text-2xl font-black text-white mt-0.5 score-mono">
              {fmt(pp.runsScored)}
            </div>
            <div className="text-[10.5px] text-slate-500">runs scored</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   INNINGS CARD — combines all innings sections
   ═══════════════════════════════════════════════════════════════════ */

const InningsCard = ({ innings, index }: { innings: InningsData; index: number }) => {
  const [expanded, setExpanded] = useState(true);

  const teamName = innings.batTeamDetails?.batTeamName || `Innings ${(innings.inningsId ?? index) + 1}`;
  const score = innings.scoreDetails;
  const scoreStr = score
    ? `${fmt(score.runs)}/${fmt(score.wickets)} (${fmtOvers(score.overs)} Ov)`
    : "";

  return (
    <div className={cx(card, "section-enter")} style={{ animationDelay: `${index * 120}ms` }}>
      {/* Innings header — clickable to collapse */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 px-3 sm:px-5 py-3.5 bg-emerald-500/[0.06] border-b border-white/[0.04] hover:bg-emerald-500/[0.08] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <AccentBar />
          <div className="text-left">
            <div className="text-sm font-bold text-white">{teamName}</div>
            {scoreStr && (
              <div className="text-xs text-emerald-400 font-bold score-mono mt-0.5">
                {scoreStr}
                {score?.isDeclared && " (Dec)"}
                {score?.isFollowOn && " (F/O)"}
              </div>
            )}
          </div>
        </div>
        <Icon.Chevron
          className={cx(
            "w-4 h-4 text-slate-500 transition-transform duration-200",
            expanded ? "rotate-180" : ""
          )}
        />
      </button>

      {expanded && (
        <div>
          <BattingTable innings={innings} />

          {innings.extrasData && <Extras extras={innings.extrasData} />}

          {score && <ScoreTotal score={score} />}

          {innings.didNotBatData && Object.keys(innings.didNotBatData).length > 0 && (
            <DidNotBat dnb={innings.didNotBatData} />
          )}

          <BowlingTable innings={innings} />

          {innings.wicketsData && Object.keys(innings.wicketsData).length > 0 && (
            <FallOfWickets wickets={innings.wicketsData} />
          )}

          {innings.partnershipsData && Object.keys(innings.partnershipsData).length > 0 && (
            <Partnerships data={innings.partnershipsData} />
          )}

          {innings.powerPlayData && Object.keys(innings.powerPlayData).length > 0 && (
            <Powerplay data={innings.powerPlayData} />
          )}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   PLAYING XI
   ═══════════════════════════════════════════════════════════════════ */

const PlayingXI = ({
  playingxi,
  mh,
}: {
  playingxi: ScorecardResponse["playingxi"];
  mh: MatchHeader;
}) => {
  if (!playingxi?.length) return null;

  const teamName = (teamId?: number) => {
    if (teamId === mh.team1?.id) return mh.team1?.shortName || mh.team1?.name;
    if (teamId === mh.team2?.id) return mh.team2?.shortName || mh.team2?.name;
    return `Team`;
  };

  return (
    <Section icon={<Icon.Users className="h-4 w-4" />} title="Playing XI" delay={200}>
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.04]">
        {playingxi.map((team, ti) => (
          <div key={ti} className="px-3 sm:px-5 py-4">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
              {teamName(team.teamId)}
            </h4>
            <div className="space-y-1.5">
              {team.player?.map((p, pi) => (
                <div key={p.id ?? pi} className="flex items-center gap-2 text-xs sm:text-[13px]">
                  <span className="w-5 h-5 rounded-md bg-white/[0.04] flex items-center justify-center text-[10px] text-slate-500 font-bold score-mono flex-shrink-0">
                    {pi + 1}
                  </span>
                  <span className="text-slate-200 font-medium">{p.name || p.fullName}</span>
                  {p.isCaptain && (
                    <span className={cx(badge, "bg-amber-500/10 text-amber-400 border border-amber-500/15")}>C</span>
                  )}
                  {p.isKeeper && (
                    <span className={cx(badge, "bg-sky-500/10 text-sky-400 border border-sky-500/15")}>WK</span>
                  )}
                  {p.isOverseas && (
                    <span className={cx(badge, "bg-violet-500/10 text-violet-400 border border-violet-500/15")}>OS</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   MATCH NOTES
   ═══════════════════════════════════════════════════════════════════ */

const MatchNotes = ({ notes }: { notes: string[] }) => {
  if (!notes?.length) return null;
  return (
    <Section icon={<Icon.Notes className="h-4 w-4" />} title="Match Notes" delay={300}>
      <div className="px-3 sm:px-5 py-4 space-y-2">
        {notes.map((n, i) => (
          <p key={i} className="text-xs sm:text-[13px] text-slate-400 leading-relaxed">
            {n}
          </p>
        ))}
      </div>
    </Section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   PAGE TABS
   ═══════════════════════════════════════════════════════════════════ */

type PageTab = "scorecard" | "live" | "squad";

const PageTabs = ({ active, onChange }: { active: PageTab; onChange: (t: PageTab) => void }) => {
  const tabs: { key: PageTab; label: string; icon: React.ReactNode }[] = [
    { key: "scorecard", label: "Scorecard", icon: <Icon.Bat className="w-3.5 h-3.5" /> },
    { key: "live", label: "Live", icon: <Icon.Bolt className="w-3.5 h-3.5" /> },
    { key: "squad", label: "Squad", icon: <Icon.Users className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-3 sm:px-0">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cx(
            "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 flex-shrink-0",
            active === t.key
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shadow-[0_0_12px_-3px_rgba(52,211,153,0.2)]"
              : "bg-white/[0.02] text-slate-500 border border-white/[0.05] hover:text-slate-300 hover:border-white/[0.1] hover:bg-white/[0.04]"
          )}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   INNINGS TABS
   ═══════════════════════════════════════════════════════════════════ */

const InningsTabs = ({
  innings,
  activeIdx,
  onChange,
}: {
  innings: InningsData[];
  activeIdx: number;
  onChange: (i: number) => void;
}) => {
  if (innings.length <= 1) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide mb-4 px-3 sm:px-0">
      <button
        onClick={() => onChange(-1)}
        className={cx(
          "px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition-all duration-200 flex-shrink-0",
          activeIdx === -1
            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
            : "bg-white/[0.02] text-slate-500 border border-white/[0.05] hover:text-slate-300 hover:border-white/[0.1]"
        )}
      >
        All
      </button>
      {innings.map((inn, i) => {
        const label = inn.batTeamDetails?.batTeamShortName || `Inn ${i + 1}`;
        const score = inn.scoreDetails;
        const scoreStr = score ? `${fmt(score.runs)}/${fmt(score.wickets)}` : "";
        return (
          <button
            key={i}
            onClick={() => onChange(i)}
            className={cx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition-all duration-200 flex-shrink-0",
              activeIdx === i
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                : "bg-white/[0.02] text-slate-500 border border-white/[0.05] hover:text-slate-300 hover:border-white/[0.1]"
            )}
          >
            {label}
            {scoreStr && <span className="score-mono text-[10px] opacity-70">{scoreStr}</span>}
          </button>
        );
      })}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN: SCORECARD PAGE
   ═══════════════════════════════════════════════════════════════════ */

export default function ScorecardPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<ScorecardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pageTab, setPageTab] = useState<PageTab>("scorecard");
  const [activeInnings, setActiveInnings] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const styleRef = useRef(false);

  /* Inject custom CSS once */
  useEffect(() => {
    if (styleRef.current) return;
    styleRef.current = true;
    const tag = document.createElement("style");
    tag.textContent = CUSTOM_CSS;
    document.head.appendChild(tag);
    document.documentElement.classList.add("dark");
    return () => {
      document.head.removeChild(tag);
    };
  }, []);

  /* Fetch scorecard */
  const fetchData = useCallback(
    async (silent = false) => {
      if (!matchId) return;
      if (!silent) {
        setLoading(true);
        setError(null);
      } else {
        setRefreshing(true);
      }
      try {
        const res = await fetch(`/api/score/scorecard/${matchId}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
        const json: ScorecardResponse = await res.json();
        setData(json);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load scorecard");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [matchId]
  );

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  /* Auto-refresh every 30s */
  useEffect(() => {
    timerRef.current = setInterval(() => fetchData(true), 30_000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchData]);

  const mh = data?.matchHeader;
  const innings = useMemo(() => data?.scoreCard || [], [data]);
  const visibleInnings = useMemo(
    () => (activeInnings === -1 ? innings : innings.filter((_, i) => i === activeInnings)),
    [innings, activeInnings]
  );

  return (
    <div className="min-h-screen bg-[#060918] gradient-mesh text-slate-200">
      {/* Match Header */}
      {mh && (
        <MatchHeaderCard
          mh={mh}
          status={data?.status}
          onBack={() => navigate("/")}
        />
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-5">
        {/* Page tabs + Refresh */}
        {!loading && !error && mh && (
          <div className="flex items-center justify-between gap-3 mb-5">
            <PageTabs active={pageTab} onChange={setPageTab} />
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl
                         bg-white/[0.03] border border-white/[0.06] text-slate-400
                         hover:text-emerald-400 hover:border-emerald-500/20 hover:bg-emerald-500/[0.06]
                         transition-all duration-200 disabled:opacity-40"
              aria-label="Refresh"
            >
              <Icon.Refresh className={cx("w-4 h-4", refreshing && "spin-smooth")} />
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && <Skeleton />}

        {/* Error */}
        {!loading && error && <ErrorState msg={error} onRetry={() => fetchData(false)} />}

        {/* Scorecard Tab */}
        {!loading && !error && pageTab === "scorecard" && (
          <>
            {/* Innings filter tabs */}
            <InningsTabs
              innings={innings}
              activeIdx={activeInnings}
              onChange={setActiveInnings}
            />

            {/* Innings cards */}
            {visibleInnings.map((inn, i) => (
              <InningsCard
                key={inn.inningsId ?? i}
                innings={inn}
                index={i}
              />
            ))}

            {/* Match Information */}
            {mh && <MatchInformation mh={mh} />}

            {/* Playing XI */}
            {data?.playingxi && <PlayingXI playingxi={data.playingxi} mh={mh!} />}

            {/* Match Notes */}
            {data?.matchNotes && <MatchNotes notes={data.matchNotes} />}
          </>
        )}

        {/* Live Tab */}
        {!loading && !error && pageTab === "live" && matchId && (
          <LiveMatch />
        )}

        {/* Squad Tab */}
        {!loading && !error && pageTab === "squad" && matchId && (
          <Squad />
        )}

        {/* Refreshing indicator */}
        {refreshing && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass border border-emerald-500/20 shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" />
              <span className="text-[11px] text-emerald-400 font-semibold">Refreshing</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
