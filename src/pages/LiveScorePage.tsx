import React, { useEffect, useState, useCallback, useMemo } from "react";

/* ═════════════════════════════════════════════════════════════════════
   TYPES — mirrors the Cricbuzz scorecard API response
   ═════════════════════════════════════════════════════════════════════ */

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

/* ═════════════════════════════════════════════════════════════════════
   UTILITY HELPERS
   ═════════════════════════════════════════════════════════════════════ */

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

/* ═════════════════════════════════════════════════════════════════════
   DESIGN TOKENS — premium Cricbuzz-inspired system
   ═════════════════════════════════════════════════════════════════════ */

const card =
  "bg-white dark:bg-[#111815] rounded-3xl shadow-[0_2px_10px_-4px_rgba(15,23,20,0.08)] dark:shadow-[0_2px_20px_-8px_rgba(0,0,0,0.5)] border border-black/[0.04] dark:border-white/[0.06] overflow-hidden mb-5 transition-shadow duration-300 hover:shadow-[0_8px_24px_-8px_rgba(15,23,20,0.12)] dark:hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.6)]";

const sectionTitle =
  "flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-[#009270]/[0.06] via-[#009270]/[0.02] to-transparent dark:from-[#12b985]/[0.09] dark:via-[#12b985]/[0.03] dark:to-transparent border-b border-black/[0.04] dark:border-white/[0.05]";

const titleText =
  "text-[11.5px] font-bold text-[#00734f] dark:text-[#3ddba4] uppercase tracking-[0.08em]";

const th =
  "px-3.5 py-2.5 text-[10.5px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap";

const td =
  "px-3.5 py-3 text-[13px] text-gray-700 dark:text-gray-300 whitespace-nowrap";

const trEven = "bg-white dark:bg-[#111815]";
const trOdd = "bg-gray-50/70 dark:bg-white/[0.02]";
const trHover =
  "hover:bg-[#009270]/[0.045] dark:hover:bg-[#12b985]/[0.06] transition-colors duration-150";

const badge =
  "inline-flex items-center px-1.5 py-[1px] rounded-md text-[10px] font-bold leading-none";

const pill =
  "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold";

/* ═════════════════════════════════════════════════════════════════════
   ICONS — inline SVG, no external icon library
   ═════════════════════════════════════════════════════════════════════ */

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
  Chevron: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
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
};

/* ═════════════════════════════════════════════════════════════════════
   PRIMITIVE COMPONENTS
   ═════════════════════════════════════════════════════════════════════ */

const AccentBar = () => (
  <span className="w-1 h-5 rounded-full bg-gradient-to-b from-[#00b884] to-[#009270] dark:from-[#3ddba4] dark:to-[#12b985] flex-shrink-0" />
);

const InfoRow = ({ label, value }: { label: string; value?: string | number | null }) => {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex items-start gap-3 px-5 py-3 border-b border-gray-50 dark:border-white/[0.04] last:border-0">
      <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-32 sm:w-36 flex-shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-[13.5px] text-gray-800 dark:text-gray-200 font-semibold flex-1">{value}</span>
    </div>
  );
};

const Section = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <div className={card}>
    <div className={sectionTitle}>
      <AccentBar />
      <span className="text-[#009270] dark:text-[#3ddba4]">{icon}</span>
      <span className={titleText}>{title}</span>
    </div>
    {children}
  </div>
);

/* Real <table> layout for label/value info blocks (Match Information, Match Summary) */
const InfoTable = ({
  rows,
}: {
  rows: Array<{ label: string; value?: string | number | null }>;
}) => {
  const filtered = rows.filter((r) => r.value !== undefined && r.value !== null && r.value !== "");
  if (!filtered.length) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <tbody>
          {filtered.map((r, i) => (
            <tr
              key={r.label + i}
              className={cx(
                i % 2 === 0 ? trEven : trOdd,
                trHover,
                "border-b border-gray-50 dark:border-white/[0.04] last:border-0"
              )}
            >
              <td className="px-5 py-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-32 sm:w-40 align-top whitespace-nowrap">
                {r.label}
              </td>
              <td className="px-5 py-3 text-[13.5px] text-gray-800 dark:text-gray-200 font-semibold">
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
  <div className="max-w-4xl mx-auto px-3 py-6 space-y-5 animate-pulse">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="bg-white dark:bg-[#111815] rounded-3xl shadow-sm border border-black/[0.04] dark:border-white/[0.06] p-6">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full w-1/3 mb-4" />
        <div className="space-y-2.5">
          {[...Array(3)].map((_, j) => (
            <div key={j} className="h-3 bg-gray-100 dark:bg-gray-800/60 rounded-full" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

const ErrorState = ({ msg }: { msg: string }) => (
  <div className="max-w-4xl mx-auto px-3 py-16 flex flex-col items-center gap-4">
    <div className="h-14 w-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
      <Icon.Alert className="h-7 w-7" />
    </div>
    <p className="text-gray-600 dark:text-gray-400 text-center text-sm max-w-sm">{msg}</p>
  </div>
);

/* ═════════════════════════════════════════════════════════════════════
   MATCH HEADER — sticky, premium gradient banner
   ═════════════════════════════════════════════════════════════════════ */

const MatchHeader = ({ mh, status }: { mh: MatchHeader; status?: string }) => {
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

  return (
    <div className="sticky top-0 z-50 bg-white/85 dark:bg-[#0a0f0d]/85 backdrop-blur-xl border-b border-black/[0.05] dark:border-white/[0.06] shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      {/* Top strip: series + format */}
      <div className="bg-gradient-to-r from-[#00734f] via-[#009270] to-[#00a67d] px-4 py-1.5 flex items-center justify-between">
        <span className="text-white/95 text-[11px] font-semibold tracking-wide truncate">
          {mh.seriesName || mh.series?.name || "Cricket Scorecard"}
        </span>
        {mh.matchFormat && (
          <span className="text-white text-[10.5px] font-bold bg-white/15 px-2.5 py-0.5 rounded-full tracking-wide">
            {mh.matchFormat}
          </span>
        )}
      </div>

      {/* Teams row */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          {/* Team 1 */}
          <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
            {logo1 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo1}
                alt={mh.team1?.shortName || ""}
                className="w-12 h-12 object-contain rounded-full border border-black/[0.05] dark:border-white/10 bg-white dark:bg-gray-900 p-0.5 shadow-sm"
                onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
              />
            )}
            <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {mh.team1?.shortName || mh.team1?.name || "—"}
            </span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 text-center truncate w-full hidden sm:block">
              {mh.team1?.name}
            </span>
          </div>

          {/* Center divider */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="bg-gradient-to-br from-[#00b884] to-[#009270] text-white text-[11px] font-black px-3 py-1 rounded-full shadow-sm shadow-[#009270]/30">
              VS
            </span>
            {(mh.matchDescription || mh.matchNumber) && (
              <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium text-center whitespace-nowrap">
                {mh.matchDescription}
              </span>
            )}
          </div>

          {/* Team 2 */}
          <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
            {logo2 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo2}
                alt={mh.team2?.shortName || ""}
                className="w-12 h-12 object-contain rounded-full border border-black/[0.05] dark:border-white/10 bg-white dark:bg-gray-900 p-0.5 shadow-sm"
                onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
              />
            )}
            <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {mh.team2?.shortName || mh.team2?.name || "—"}
            </span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 text-center truncate w-full hidden sm:block">
              {mh.team2?.name}
            </span>
          </div>
        </div>

        {/* Status / Result */}
        {resultText && (
          <div className="mt-3 text-center">
            <span
              className={cx(
                "inline-flex items-center gap-1.5 text-[13px] font-bold px-3 py-1 rounded-full",
                mh.complete
                  ? "text-[#00734f] dark:text-[#3ddba4] bg-[#009270]/[0.08] dark:bg-[#3ddba4]/[0.08]"
                  : "text-amber-700 dark:text-amber-400 bg-amber-500/[0.08]"
              )}
            >
              <span
                className={cx(
                  "h-1.5 w-1.5 rounded-full",
                  mh.complete ? "bg-[#009270] dark:bg-[#3ddba4]" : "bg-amber-500 animate-pulse"
                )}
              />
              {resultText}
            </span>
          </div>
        )}
      </div>

      {/* Meta strip */}
      <div className="border-t border-black/[0.04] dark:border-white/[0.05] px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-gray-500 dark:text-gray-400 bg-gray-50/60 dark:bg-white/[0.02]">
        {mh.venue?.name && (
          <span className="inline-flex items-center gap-1">
            <Icon.Pin className="h-3 w-3 text-gray-400" />
            {mh.venue.name}
            {mh.venue.city ? `, ${mh.venue.city}` : ""}
          </span>
        )}
        {tossText && (
          <span className="inline-flex items-center gap-1">
            <Icon.Coin className="h-3 w-3 text-gray-400" />
            {tossText}
          </span>
        )}
        {mh.playersOfTheMatch?.[0]?.fullName && (
          <span className="inline-flex items-center gap-1 font-semibold text-[#00734f] dark:text-[#3ddba4]">
            <Icon.Medal className="h-3 w-3" />
            {mh.playersOfTheMatch[0].fullName}
          </span>
        )}
      </div>
    </div>
  );
};

/* ═════════════════════════════════════════════════════════════════════
   MATCH INFORMATION
   ═════════════════════════════════════════════════════════════════════ */

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
    { label: "Match Referee", value: mh.referee },
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
    <Section icon={<Icon.Info className="h-4 w-4" />} title="Match Information">
      <InfoTable rows={rows} />
    </Section>
  );
};

/* ═════════════════════════════════════════════════════════════════════
   BATTING TABLE
   ═════════════════════════════════════════════════════════════════════ */

const BattingTable = ({ innings }: { innings: InningsData }) => {
  const batsmen = Object.values(innings.batTeamDetails?.batsmenData ?? {});
  if (!batsmen.length) return null;

  return (
    <div>
      <div className={sectionTitle}>
        <AccentBar />
        <span className="text-[#009270] dark:text-[#3ddba4]"><Icon.Bat className="h-4 w-4" /></span>
        <span className={titleText}>Batting</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-gray-50/80 dark:bg-white/[0.02]">
            <tr>
              <th className={cx(th, "text-left w-44")}>Batter</th>
              <th className={cx(th, "text-left")}>Dismissal</th>
              <th className={cx(th, "text-right")}>R</th>
              <th className={cx(th, "text-right")}>B</th>
              <th className={cx(th, "text-right")}>4s</th>
              <th className={cx(th, "text-right")}>6s</th>
              <th className={cx(th, "text-right")}>SR</th>
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
                  <td className={cx(td, "font-semibold")}>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={
                          notOut
                            ? "text-[#00734f] dark:text-[#3ddba4]"
                            : "text-gray-800 dark:text-gray-200"
                        }
                      >
                        {b.batName || "—"}
                        {notOut && !dnb && <span className="text-[#00734f] dark:text-[#3ddba4] ml-0.5">*</span>}
                      </span>
                      {b.isCaptain && (
                        <span className={cx(badge, "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400")}>
                          C
                        </span>
                      )}
                      {b.isKeeper && (
                        <span className={cx(badge, "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400")}>
                          WK
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={cx(td, "text-gray-500 dark:text-gray-400 max-w-xs text-[11.5px] leading-tight normal-case")}>
                    {b.outDesc || (dnb ? "Did Not Bat" : "not out")}
                  </td>
                  <td
                    className={cx(
                      td,
                      "text-right font-extrabold text-[14.5px] tabular-nums",
                      notOut && !dnb
                        ? "text-[#00734f] dark:text-[#3ddba4]"
                        : (b.runs ?? 0) === 0
                        ? "text-gray-400 dark:text-gray-600"
                        : "text-gray-900 dark:text-white"
                    )}
                  >
                    {dnb ? "—" : fmt(b.runs)}
                  </td>
                  <td className={cx(td, "text-right tabular-nums")}>{dnb ? "—" : fmt(b.balls)}</td>
                  <td className={cx(td, "text-right tabular-nums")}>{dnb ? "—" : fmt(b.fours)}</td>
                  <td className={cx(td, "text-right tabular-nums")}>{dnb ? "—" : fmt(b.sixes)}</td>
                  <td className={cx(td, "text-right tabular-nums")}>{dnb ? "—" : fmtRate(b.strikeRate)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ═════════════════════════════════════════════════════════════════════
   EXTRAS
   ═════════════════════════════════════════════════════════════════════ */

const Extras = ({ extras }: { extras: ExtrasData }) => {
  const items = [
    { label: "B", full: "Byes", value: extras.byes },
    { label: "LB", full: "Leg Byes", value: extras.legByes },
    { label: "NB", full: "No Balls", value: extras.noBalls },
    { label: "WD", full: "Wides", value: extras.wides },
    { label: "P", full: "Penalty", value: extras.penalty },
  ].filter((x) => x.value !== undefined);

  return (
    <div className="px-5 py-3 bg-gray-50/60 dark:bg-white/[0.015] border-t border-black/[0.04] dark:border-white/[0.05]">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="text-[10.5px] font-bold text-[#00734f] dark:text-[#3ddba4] uppercase tracking-wider">
          Extras
        </span>
        <span className="font-extrabold text-gray-900 dark:text-white tabular-nums">
          {fmt(extras.totalExtras)}
        </span>
        <span className="text-gray-300 dark:text-gray-700">·</span>
        {items.map((it) => (
          <span key={it.label} className="text-[11.5px] text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-gray-600 dark:text-gray-300">{it.full}</span> {it.value}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ═════════════════════════════════════════════════════════════════════
   SCORE TOTAL BANNER
   ═════════════════════════════════════════════════════════════════════ */

const ScoreTotal = ({ score }: { score: ScoreDetails }) => (
  <div className="px-5 py-3.5 border-t border-black/[0.04] dark:border-white/[0.05] flex flex-wrap items-center gap-x-4 gap-y-1 bg-gradient-to-r from-[#009270]/[0.05] to-transparent dark:from-[#3ddba4]/[0.05]">
    <span className="text-[10.5px] font-bold text-[#00734f] dark:text-[#3ddba4] uppercase tracking-wider">Total</span>
    <span className="font-black text-gray-900 dark:text-white text-xl tabular-nums">
      {fmt(score.runs)}/{fmt(score.wickets)}
    </span>
    {score.isDeclared && (
      <span className={cx(pill, "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300")}>Dec</span>
    )}
    {score.isFollowOn && (
      <span className={cx(pill, "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300")}>F/O</span>
    )}
    <span className="text-[13px] text-gray-600 dark:text-gray-400">({fmtOvers(score.overs)} Ov)</span>
    {score.runRate !== undefined && (
      <span className="text-[13px] text-gray-500 dark:text-gray-400">
        RR <span className="font-bold text-gray-700 dark:text-gray-200">{fmtRate(score.runRate)}</span>
      </span>
    )}
  </div>
);

/* ═════════════════════════════════════════════════════════════════════
   DID NOT BAT
   ═════════════════════════════════════════════════════════════════════ */

const DidNotBat = ({ dnb }: { dnb: Record<string, { batId?: number; batName?: string }> }) => {
  const players = Object.values(dnb);
  if (!players.length) return null;
  return (
    <div className="px-5 py-2.5 border-t border-black/[0.04] dark:border-white/[0.05] bg-gray-50/40 dark:bg-white/[0.01]">
      <span className="text-[10.5px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mr-2">
        Did Not Bat
      </span>
      <span className="text-[12.5px] text-gray-600 dark:text-gray-300">
        {players.map((p) => p.batName).filter(Boolean).join(", ")}
      </span>
    </div>
  );
};

/* ═════════════════════════════════════════════════════════════════════
   FALL OF WICKETS — timeline
   ═════════════════════════════════════════════════════════════════════ */

const FallOfWickets = ({ wickets }: { wickets: Record<string, WicketData> }) => {
  const list = Object.values(wickets).sort((a, b) => (a.wktNbr ?? 0) - (b.wktNbr ?? 0));
  if (!list.length) return null;

  return (
    <div className="border-t border-black/[0.04] dark:border-white/[0.05]">
      <div className={sectionTitle}>
        <AccentBar />
        <span className="text-[#009270] dark:text-[#3ddba4]"><Icon.Fall className="h-4 w-4" /></span>
        <span className={titleText}>Fall of Wickets</span>
      </div>
      <div className="px-5 py-4 overflow-x-auto">
        <div className="flex gap-3 min-w-max relative">
          {list.map((w, i) => (
            <div key={i} className="relative flex flex-col items-center min-w-[92px]">
              {i !== list.length - 1 && (
                <span className="absolute top-4 left-1/2 w-full h-[2px] bg-gray-200 dark:bg-white/10 z-0" />
              )}
              <div className="relative z-10 flex flex-col items-center rounded-xl bg-white dark:bg-[#171f1b] border border-black/[0.05] dark:border-white/10 shadow-sm px-3 py-2.5 hover:shadow-md hover:-translate-y-0.5 hover:border-[#009270]/30 dark:hover:border-[#3ddba4]/30 transition-all duration-200">
                <span className="text-[9.5px] font-bold text-gray-400 dark:text-gray-500 tracking-wide">
                  WKT {w.wktNbr}
                </span>
                <span className="text-[15px] font-black text-gray-900 dark:text-white mt-0.5 tabular-nums">
                  {fmt(w.wktRuns)}
                </span>
                {w.wktOver !== undefined && (
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">({fmtOvers(w.wktOver)} ov)</span>
                )}
                {w.batName && (
                  <span className="text-[11px] font-semibold text-[#00734f] dark:text-[#3ddba4] mt-1 truncate max-w-[78px]">
                    {w.batName}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ═════════════════════════════════════════════════════════════════════
   PARTNERSHIPS
   ═════════════════════════════════════════════════════════════════════ */

const Partnerships = ({ data }: { data: Record<string, PartnershipData> }) => {
  const list = Object.values(data);
  if (!list.length) return null;
  const maxRuns = Math.max(...list.map((p) => p.totalRuns ?? 0), 1);

  return (
    <div className="border-t border-black/[0.04] dark:border-white/[0.05]">
      <div className={sectionTitle}>
        <AccentBar />
        <span className="text-[#009270] dark:text-[#3ddba4]"><Icon.Link className="h-4 w-4" /></span>
        <span className={titleText}>Partnerships</span>
      </div>
      <div className="px-5 py-4 space-y-2.5">
        {list.map((p, i) => {
          const pct = ((p.totalRuns ?? 0) / maxRuns) * 100;
          return (
            <div
              key={i}
              className="rounded-xl border border-black/[0.04] dark:border-white/[0.06] p-3 hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors duration-150"
            >
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <div className="text-[12.5px] text-gray-700 dark:text-gray-300 flex items-center gap-1.5 flex-wrap min-w-0">
                  <span className="font-semibold truncate">{p.bat1Name || "—"}</span>
                  <span className="text-gray-400 text-[11px] shrink-0">
                    {fmt(p.bat1Runs)}({fmt(p.bat1Balls)}b)
                  </span>
                  <span className="text-gray-300 dark:text-gray-600 shrink-0">&amp;</span>
                  <span className="font-semibold truncate">{p.bat2Name || "—"}</span>
                  <span className="text-gray-400 text-[11px] shrink-0">
                    {fmt(p.bat2Runs)}({fmt(p.bat2Balls)}b)
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-black text-gray-900 dark:text-white tabular-nums">{fmt(p.totalRuns)}</span>
                  <span className="text-[11px] text-gray-400 ml-1">({fmt(p.totalBalls)}b)</span>
                </div>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#00b884] to-[#009270] dark:from-[#3ddba4] dark:to-[#12b985] transition-all duration-700 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ═════════════════════════════════════════════════════════════════════
   POWERPLAY
   ═════════════════════════════════════════════════════════════════════ */

const Powerplay = ({ data }: { data: Record<string, PowerPlayData> }) => {
  const list = Object.values(data);
  if (!list.length) return null;

  return (
    <div className="border-t border-black/[0.04] dark:border-white/[0.05]">
      <div className={sectionTitle}>
        <AccentBar />
        <span className="text-[#009270] dark:text-[#3ddba4]"><Icon.Bolt className="h-4 w-4" /></span>
        <span className={titleText}>Powerplay</span>
      </div>
      <div className="px-5 py-4 flex flex-wrap gap-3">
        {list.map((pp, i) => (
          <div
            key={i}
            className="rounded-xl bg-gradient-to-br from-[#009270]/[0.07] to-[#009270]/[0.02] dark:from-[#3ddba4]/[0.08] dark:to-[#3ddba4]/[0.02] border border-[#009270]/15 dark:border-[#3ddba4]/15 px-4 py-3 min-w-[120px]"
          >
            <div className="text-[10.5px] font-bold text-[#00734f] dark:text-[#3ddba4] mb-1 uppercase tracking-wide">
              {pp.ppType || `PP ${i + 1}`}
            </div>
            {pp.ppOversFrom !== undefined && pp.ppOversTo !== undefined && (
              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                Overs {pp.ppOversFrom}–{pp.ppOversTo}
              </div>
            )}
            <div className="text-2xl font-black text-gray-900 dark:text-white mt-0.5 tabular-nums">
              {fmt(pp.runsScored)}
            </div>
            <div className="text-[10.5px] text-gray-400">runs scored</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═════════════════════════════════════════════════════════════════════
   BOWLING TABLE
   ═════════════════════════════════════════════════════════════════════ */

const BowlingTable = ({ innings }: { innings: InningsData }) => {
  const bowlers = Object.values(innings.bowlTeamDetails?.bowlersData ?? {});
  if (!bowlers.length) return null;

  const maxWkts = Math.max(...bowlers.map((b) => b.wickets ?? 0));
  const minEco = Math.min(...bowlers.filter((b) => (b.overs ?? 0) > 0).map((b) => b.economy ?? Infinity));

  return (
    <div className="border-t border-black/[0.04] dark:border-white/[0.05]">
      <div className={sectionTitle}>
        <AccentBar />
        <span className="text-[#009270] dark:text-[#3ddba4]"><Icon.Ball className="h-4 w-4" /></span>
        <span className={titleText}>Bowling</span>
        <span className="ml-0.5 text-[11px] text-gray-400 dark:text-gray-500 font-medium normal-case">
          {innings.bowlTeamDetails?.bowlTeamName}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-50/80 dark:bg-white/[0.02]">
            <tr>
              <th className={cx(th, "text-left w-40")}>Bowler</th>
              <th className={cx(th, "text-right")}>O</th>
              <th className={cx(th, "text-right")}>M</th>
              <th className={cx(th, "text-right")}>R</th>
              <th className={cx(th, "text-right")}>W</th>
              <th className={cx(th, "text-right")}>Econ</th>
              <th className={cx(th, "text-right")}>NB</th>
              <th className={cx(th, "text-right")}>WD</th>
            </tr>
          </thead>
          <tbody>
            {bowlers.map((b, i) => {
              const isBestEco = b.economy !== undefined && b.economy === minEco && minEco < Infinity;
              const isTopWkt = (b.wickets ?? 0) === maxWkts && maxWkts > 0;

              return (
                <tr key={b.bowlId ?? i} className={cx(i % 2 === 0 ? trEven : trOdd, trHover)}>
                  <td className={cx(td, "font-semibold")}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-800 dark:text-gray-200">{b.bowlName || "—"}</span>
                      {b.isCaptain && (
                        <span className={cx(badge, "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400")}>
                          C
                        </span>
                      )}
                      {isTopWkt && (
                        <span className={cx(badge, "bg-[#009270]/10 text-[#00734f] dark:bg-[#3ddba4]/10 dark:text-[#3ddba4]")}>
                          Best
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={cx(td, "text-right tabular-nums")}>{fmtOvers(b.overs)}</td>
                  <td className={cx(td, "text-right tabular-nums")}>{fmt(b.maidens)}</td>
                  <td className={cx(td, "text-right tabular-nums")}>{fmt(b.runs)}</td>
                  <td
                    className={cx(
                      td,
                      "text-right font-extrabold tabular-nums",
                      isTopWkt ? "text-[#00734f] dark:text-[#3ddba4]" : "text-gray-900 dark:text-white"
                    )}
                  >
                    {fmt(b.wickets)}
                  </td>
                  <td
                    className={cx(
                      td,
                      "text-right font-bold tabular-nums",
                      isBestEco ? "text-[#00734f] dark:text-[#3ddba4]" : "text-gray-600 dark:text-gray-300"
                    )}
                  >
                    {fmtRate(b.economy)}
                  </td>
                  <td className={cx(td, "text-right tabular-nums")}>{fmt(b.no_balls, "0")}</td>
                  <td className={cx(td, "text-right tabular-nums")}>{fmt(b.wides, "0")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ═════════════════════════════════════════════════════════════════════
   INNINGS CARD — full detail body for one innings (no outer collapse;
   the tab bar above controls which innings is visible)
   ═════════════════════════════════════════════════════════════════════ */

const InningsCard: React.FC<{ innings: InningsData }> = ({ innings }) => {
  const score = innings.scoreDetails;
  const batTeam = innings.batTeamDetails;

  return (
    <div className={cx(card, "animate-[fadeUp_0.35s_ease]")}>
      {/* Score summary header */}
      <div className="px-5 py-4 bg-gradient-to-r from-[#009270]/[0.06] via-[#009270]/[0.02] to-transparent dark:from-[#3ddba4]/[0.08] dark:via-[#3ddba4]/[0.02] dark:to-transparent border-b border-black/[0.04] dark:border-white/[0.05]">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-1 h-11 rounded-full bg-gradient-to-b from-[#00b884] to-[#009270] dark:from-[#3ddba4] dark:to-[#12b985] flex-shrink-0" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-gray-900 dark:text-white text-lg sm:text-xl tracking-tight">
                  {batTeam?.batTeamName || "—"}
                </span>
                {score?.isDeclared && (
                  <span className={cx(pill, "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300")}>
                    Declared
                  </span>
                )}
                {score?.isFollowOn && (
                  <span className={cx(pill, "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300")}>
                    Follow-on
                  </span>
                )}
              </div>
            </div>
          </div>
          {score && (
            <div className="text-right">
              <div className="flex items-baseline gap-1.5 justify-end">
                <span className="text-3xl font-black text-[#009270] dark:text-[#3ddba4] tabular-nums">
                  {fmt(score.runs)}/{fmt(score.wickets)}
                </span>
                {score.overs !== undefined && (
                  <span className="text-sm font-semibold text-gray-400 dark:text-gray-500">
                    ({fmtOvers(score.overs)} ov)
                  </span>
                )}
              </div>
              {score.runRate !== undefined && (
                <div className="text-[11.5px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Run Rate <span className="font-bold text-gray-700 dark:text-gray-200">{fmtRate(score.runRate)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <BattingTable innings={innings} />
      {innings.extrasData && <Extras extras={innings.extrasData} />}
      {innings.scoreDetails && <ScoreTotal score={innings.scoreDetails} />}
      {innings.didNotBatData && Object.keys(innings.didNotBatData).length > 0 && (
        <DidNotBat dnb={innings.didNotBatData} />
      )}
      {innings.wicketsData && Object.keys(innings.wicketsData).length > 0 && (
        <FallOfWickets wickets={innings.wicketsData} />
      )}
      {innings.partnershipsData && Object.keys(innings.partnershipsData).length > 0 && (
        <Partnerships data={innings.partnershipsData} />
      )}
      {innings.powerPlayData && Object.keys(innings.powerPlayData).length > 0 && (
        <Powerplay data={innings.powerPlayData} />
      )}
      <BowlingTable innings={innings} />
    </div>
  );
};

/* ═════════════════════════════════════════════════════════════════════
   INNINGS TABS — "1st Innings · TeamName" / "2nd Innings · TeamName"
   ═════════════════════════════════════════════════════════════════════ */

const ORDINALS = ["1st", "2nd", "3rd", "4th"];

const InningsTabs: React.FC<{
  innings: InningsData[];
  active: number;
  onChange: (i: number) => void;
}> = ({ innings, active, onChange }) => {
  if (innings.length <= 1) return null;

  return (
    <div className="mb-5 -mt-1">
      <div className="flex gap-2 p-1.5 bg-gray-200/60 dark:bg-white/[0.04] rounded-2xl overflow-x-auto no-scrollbar">
        {innings.map((inn, i) => {
          const teamName = inn.batTeamDetails?.batTeamShortName || inn.batTeamDetails?.batTeamName || `Team ${i + 1}`;
          const score = inn.scoreDetails;
          const isActive = active === i;
          return (
            <button
              key={inn.inningsId ?? i}
              onClick={() => onChange(i)}
              className={cx(
                "flex-1 min-w-[150px] relative flex flex-col items-center justify-center gap-0.5 rounded-xl px-4 py-2.5 transition-all duration-250",
                isActive
                  ? "bg-white dark:bg-[#111815] shadow-[0_2px_10px_-2px_rgba(0,0,0,0.12)] dark:shadow-[0_2px_14px_-2px_rgba(0,0,0,0.5)]"
                  : "hover:bg-white/50 dark:hover:bg-white/[0.03]"
              )}
            >
              <span
                className={cx(
                  "text-[10px] font-bold uppercase tracking-wider",
                  isActive ? "text-[#00734f] dark:text-[#3ddba4]" : "text-gray-400 dark:text-gray-500"
                )}
              >
                {ORDINALS[i] ?? `${i + 1}th`} Innings
              </span>
              <span
                className={cx(
                  "text-sm font-extrabold tracking-tight",
                  isActive ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"
                )}
              >
                {teamName}
                {score && (
                  <span className="font-semibold ml-1.5 tabular-nums text-[13px] opacity-80">
                    {fmt(score.runs)}/{fmt(score.wickets)}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ═════════════════════════════════════════════════════════════════════
   MATCH SUMMARY
   ═════════════════════════════════════════════════════════════════════ */

const MatchSummary = ({ mh, status }: { mh: MatchHeader; status?: string }) => {
  const rows: Array<{ label: string; value?: string | number | null }> = [
    { label: "Status", value: mh.state },
    { label: "Result", value: status || mh.status },
    { label: "Winner", value: mh.result?.winningTeam },
    {
      label: "Margin",
      value:
        mh.result?.winningMargin !== undefined
          ? `${mh.result.winningMargin} ${mh.result.winByRuns ? "runs" : "wickets"}`
          : undefined,
    },
    { label: "Target", value: mh.revisedTarget?.runs },
  ];

  const hasAny = rows.some((r) => r.value !== undefined && r.value !== null && r.value !== "");
  if (!hasAny) return null;

  return (
    <Section icon={<Icon.Trophy className="h-4 w-4" />} title="Match Summary">
      <InfoTable rows={rows} />
    </Section>
  );
};

/* ═════════════════════════════════════════════════════════════════════
   PLAYING XI
   ═════════════════════════════════════════════════════════════════════ */

const PlayingXI = ({ data, mh }: { data: ScorecardResponse["playingxi"]; mh: MatchHeader }) => {
  if (!data?.length) return null;

  return (
    <Section icon={<Icon.Users className="h-4 w-4" />} title="Playing XI">
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-50 dark:divide-white/[0.05]">
        {data.map((team, ti) => {
          const teamName =
            team.teamId === mh.team1?.id
              ? mh.team1?.name
              : team.teamId === mh.team2?.id
              ? mh.team2?.name
              : `Team ${ti + 1}`;
          return (
            <div key={ti} className="p-5">
              <div className="text-[11px] font-bold text-[#00734f] dark:text-[#3ddba4] uppercase tracking-wider mb-3">
                {teamName}
              </div>
              <ol className="space-y-2">
                {team.player?.map((p, pi) => (
                  <li key={p.id ?? pi} className="flex items-center gap-2.5 text-[13.5px]">
                    <span className="text-[10.5px] text-gray-400 dark:text-gray-600 w-5 text-right flex-shrink-0 font-semibold">
                      {pi + 1}
                    </span>
                    <span className="text-gray-800 dark:text-gray-200 font-medium">{p.fullName || p.name}</span>
                    {p.isCaptain && (
                      <span className={cx(badge, "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400")}>
                        C
                      </span>
                    )}
                    {p.isKeeper && (
                      <span className={cx(badge, "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400")}>
                        WK
                      </span>
                    )}
                    {p.isOverseas && (
                      <span className={cx(badge, "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400")}>
                        OS
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>
    </Section>
  );
};

/* ═════════════════════════════════════════════════════════════════════
   BENCH
   ═════════════════════════════════════════════════════════════════════ */

const Bench = ({ data, mh }: { data: ScorecardResponse["bench"]; mh: MatchHeader }) => {
  if (!data?.length) return null;
  const hasPlayers = data.some((t) => (t.player?.length ?? 0) > 0);
  if (!hasPlayers) return null;

  return (
    <Section icon={<Icon.Users className="h-4 w-4" />} title="Bench / Substitutes">
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-50 dark:divide-white/[0.05]">
        {data.map((team, ti) => {
          if (!team.player?.length) return null;
          const teamName =
            team.teamId === mh.team1?.id
              ? mh.team1?.name
              : team.teamId === mh.team2?.id
              ? mh.team2?.name
              : `Team ${ti + 1}`;
          return (
            <div key={ti} className="p-5">
              <div className="text-[11px] font-bold text-[#00734f] dark:text-[#3ddba4] uppercase tracking-wider mb-3">
                {teamName}
              </div>
              <ul className="space-y-2">
                {team.player.map((p, pi) => (
                  <li key={p.id ?? pi} className="text-[13.5px] text-gray-700 dark:text-gray-300">
                    {p.fullName || p.name}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Section>
  );
};

/* ═════════════════════════════════════════════════════════════════════
   MATCH NOTES
   ═════════════════════════════════════════════════════════════════════ */

const MatchNotes = ({ notes }: { notes?: string[] }) => {
  if (!notes?.length) return null;
  return (
    <Section icon={<Icon.Notes className="h-4 w-4" />} title="Match Notes">
      <ul className="divide-y divide-gray-50 dark:divide-white/[0.05]">
        {notes.map((note, i) => (
          <li key={i} className="px-5 py-3 text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed">
            {note}
          </li>
        ))}
      </ul>
    </Section>
  );
};

/* ═════════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═════════════════════════════════════════════════════════════════════ */

/* ═════════════════════════════════════════════════════════════════════
   PAGE TABS — "Scorecard" vs "Info" (keeps Match Summary & Match
   Information out of the scorecard view, in their own tab)
   ═════════════════════════════════════════════════════════════════════ */

type PageTab = "scorecard" | "info";

const PageTabs: React.FC<{ active: PageTab; onChange: (t: PageTab) => void }> = ({ active, onChange }) => {
  const tabs: { id: PageTab; label: string; icon: React.ReactNode }[] = [
    { id: "scorecard", label: "Scorecard", icon: <Icon.Bat className="h-3.5 w-3.5" /> },
    { id: "info", label: "Info", icon: <Icon.Info className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="sticky top-[126px] sm:top-[130px] z-40 -mx-3 sm:mx-0 px-3 sm:px-0 mb-5 pt-1">
      <div className="flex gap-1.5 p-1.5 bg-white/85 dark:bg-[#111815]/85 backdrop-blur-xl rounded-2xl border border-black/[0.05] dark:border-white/[0.06] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.08)]">
        {tabs.map((t) => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={cx(
                "flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-all duration-250",
                isActive
                  ? "bg-gradient-to-r from-[#00b884] to-[#009270] text-white shadow-sm shadow-[#009270]/30"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.04]"
              )}
            >
              {t.icon}
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

 export default function LiveScorePage() {
  const [data, setData] = useState<ScorecardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [activeInnings, setActiveInnings] = useState(0);
  const [pageTab, setPageTab] = useState<PageTab>("scorecard");

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/score/scorecard?matchId=150756", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`API returned ${res.status}: ${res.statusText || "Unknown error"}`);
      }
      const json: ScorecardResponse = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch scorecard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  /* auto-refresh every 30s while match is live */
  useEffect(() => {
    if (!data) return;
    if (data.isMatchComplete) return;
    const timer = setInterval(fetchData, 30_000);
    return () => clearInterval(timer);
  }, [data, fetchData]);

  /* default the active tab to the most recent innings (live matches jump to latest) */
  useEffect(() => {
    if (data?.scoreCard?.length) {
      setActiveInnings(data.scoreCard.length - 1);
    }
  }, [data?.scoreCard?.length]);

  const mh = data?.matchHeader;
  const innings = data?.scoreCard ?? [];
  const visibleInnings = useMemo(() => innings[activeInnings], [innings, activeInnings]);

  return (
    <div className="min-h-screen bg-[#f2f4f3] dark:bg-[#0a0f0d] transition-colors duration-300 font-sans">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }
        .no-scrollbar::-webkit-scrollbar { display:none; }
        .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
      `}</style>

      {/* Dark mode toggle (floating) */}
      <button
        onClick={() => setDarkMode((d) => !d)}
        className="fixed bottom-5 right-5 z-50 h-11 w-11 rounded-full bg-white dark:bg-[#161d1a] shadow-[0_4px_16px_-4px_rgba(0,0,0,0.2)] border border-black/[0.05] dark:border-white/10 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:scale-110 active:scale-95 transition-transform duration-200"
        aria-label="Toggle dark mode"
      >
        {darkMode ? <Icon.Sun className="h-5 w-5" /> : <Icon.Moon className="h-5 w-5" />}
      </button>

      {loading && !data && <Skeleton />}

      {error && !data && (
        <div className="max-w-4xl mx-auto px-3 py-4">
          <ErrorState msg={error} />
          <div className="text-center mt-4">
            <button
              onClick={fetchData}
              className="px-5 py-2 bg-gradient-to-r from-[#00b884] to-[#009270] text-white rounded-full text-sm font-bold hover:brightness-105 active:scale-95 transition-all duration-200 shadow-sm shadow-[#009270]/30"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {mh && (
        <>
          <MatchHeader mh={mh} status={data?.status} />

          <main className="max-w-4xl mx-auto px-3 sm:px-4 py-5">
            {error && (
              <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3 text-[13px] text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <Icon.Alert className="h-4 w-4 shrink-0" />
                {error} — Showing cached data.
              </div>
            )}

            <PageTabs active={pageTab} onChange={setPageTab} />

            {pageTab === "info" && (
              <>
                <MatchSummary mh={mh} status={data?.status} />
                <MatchInformation mh={mh} />
                {data?.playingxi && <PlayingXI data={data.playingxi} mh={mh} />}
                {data?.bench && <Bench data={data.bench} mh={mh} />}
                {data?.matchNotes && <MatchNotes notes={data.matchNotes} />}
              </>
            )}

            {pageTab === "scorecard" && (
              <>
                {/* Innings tab bar: "1st Innings · TeamName" / "2nd Innings · TeamName" */}
                <InningsTabs innings={innings} active={activeInnings} onChange={setActiveInnings} />

                {/* Only the selected innings renders below the tabs */}
                {visibleInnings && (
                  <InningsCard key={visibleInnings.inningsId ?? activeInnings} innings={visibleInnings} />
                )}
              </>
            )}

            {/* Footer */}
            <div className="bg-white dark:bg-[#111815] rounded-3xl border border-black/[0.04] dark:border-white/[0.06] px-5 py-4 text-[11.5px] text-gray-400 dark:text-gray-600 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4 flex-wrap">
                {lastUpdated && (
                  <span>
                    Last updated{" "}
                    {lastUpdated.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                )}
                {!data?.isMatchComplete && (
                  <span className="inline-flex items-center gap-1.5 text-[#009270] dark:text-[#3ddba4] font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#009270] dark:bg-[#3ddba4] animate-pulse" />
                    Live — refreshing every 30s
                  </span>
                )}
              </div>
              <button
                onClick={fetchData}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#00b884] to-[#009270] text-white rounded-full font-bold hover:brightness-105 active:scale-95 transition-all duration-200"
              >
                <Icon.Refresh className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>
          </main>
        </>
      )}
    </div>
  );
 }
