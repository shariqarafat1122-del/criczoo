import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";

/* ─────────────────────────────────────────────
   Interfaces  (unchanged)
───────────────────────────────────────────── */
interface InningsScore {
  inningsId?: number;
  r?: number;
  w?: number;
  o?: number;
  balls?: number;
  isDeclared?: boolean;
  isFollowOn?: boolean;
  target?: number;
}

interface TeamMatchScore {
  inngs1?: InningsScore;
  inngs2?: InningsScore;
}

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
  displayName?: string;
}

interface MatchInfo {
  matchId?: number;
  seriesId?: number;
  seriesName?: string;
  matchDesc?: string;
  matchFormat?: string;
  startDate?: number | string;
  endDate?: number | string;
  state?: string;
  status?: string;
  team1?: TeamInfo;
  team2?: TeamInfo;
  venueInfo?: VenueInfo;
  currBatTeamId?: number;
  seriesStartDt?: number;
  seriesEndDt?: number;
  isTimeAnnounced?: boolean;
  playingxi?: boolean;
}

interface MatchScore {
  team1Score?: TeamMatchScore;
  team2Score?: TeamMatchScore;
}

interface MatchItem {
  matchInfo?: MatchInfo;
  matchScore?: MatchScore;
}

interface MatchWrapper {
  match?: MatchItem;
  adDetail?: unknown;
}

interface HomeApiResponse {
  matches?: MatchWrapper[];
  responseLastUpdated?: number;
}

/* ═══════════════════════════════════════════════
   Global Styles — injected once via <style>
═══════════════════════════════════════════════ */
const CUSTOM_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');

/* ── base ── */
*, *::before, *::after { font-family: 'Inter', system-ui, -apple-system, sans-serif; }

/* ── keyframes ── */
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0)    scale(1); }
}
@keyframes borderGlow {
  0%, 100% { border-color: rgba(52,211,153,0.12); box-shadow: 0 0 0 0 rgba(52,211,153,0); }
  50%      { border-color: rgba(52,211,153,0.35); box-shadow: 0 0 24px -4px rgba(52,211,153,0.12); }
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

/* ── utility classes ── */
.shimmer-skeleton {
  background: linear-gradient(
    90deg,
    rgba(148,163,184,0.04) 25%,
    rgba(148,163,184,0.10) 50%,
    rgba(148,163,184,0.04) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
  border-radius: 8px;
}

.card-enter   { animation: fadeInUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
.live-border  { animation: borderGlow 2.5s ease-in-out infinite; }
.live-dot     { animation: liveDot 1.4s ease-in-out infinite; }
.spin-smooth  { animation: spinSmooth 1s linear infinite; }

.score-mono   { font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace; }

.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

/* glass surfaces */
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

/* gradient mesh background */
.gradient-mesh {
  background:
    radial-gradient(ellipse 80% 60% at 15% 50%, rgba(16,185,129,0.07) 0%, transparent 60%),
    radial-gradient(ellipse 60% 50% at 85% 20%, rgba(59,130,246,0.06) 0%, transparent 55%),
    radial-gradient(ellipse 70% 60% at 50% 90%, rgba(168,85,247,0.05) 0%, transparent 55%),
    radial-gradient(ellipse 50% 40% at 70% 60%, rgba(251,191,36,0.03) 0%, transparent 50%);
}

/* animated accent stripe */
.header-stripe {
  background: linear-gradient(90deg, #059669, #10b981, #34d399, #6ee7b7, #34d399, #10b981, #059669);
  background-size: 200% 100%;
  animation: gradientShift 4s ease-in-out infinite;
}

/* card hover glow */
.card-glow:hover {
  box-shadow:
    0 8px 32px -8px rgba(0,0,0,0.5),
    0 0 0 1px rgba(52,211,153,0.12),
    inset 0 1px 0 rgba(255,255,255,0.03);
}

/* line-clamp polyfill */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
`;

/* ─────────────────────────────────────────────
   Helpers  (unchanged logic)
───────────────────────────────────────────── */
const imgUrl = (imageId?: number): string | null =>
  imageId
    ? `https://static.cricbuzz.com/a/img/v1/i1/c${imageId}/i.jpg`
    : null;

const fmtScore = (inn?: InningsScore): string => {
  if (!inn || inn.r === undefined) return "";
  let s = `${inn.r}`;
  if (inn.w !== undefined && inn.w < 10) s += `/${inn.w}`;
  if (inn.o !== undefined) s += ` (${inn.o})`;
  if (inn.isDeclared) s += " d";
  if (inn.isFollowOn) s += " f/o";
  return s;
};

const tsToDate = (ts?: number | string): string | null => {
  if (!ts) return null;
  try {
    const ms = typeof ts === "string" ? parseInt(ts, 10) : ts;
    return new Date(ms).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return null;
  }
};

const countdown = (ts?: number | string): string | null => {
  if (!ts) return null;
  try {
    const ms = typeof ts === "string" ? parseInt(ts, 10) : ts;
    const diff = ms - Date.now();
    if (diff <= 0) return "Starting soon";
    const d = Math.floor(diff / 86_400_000);
    const h = Math.floor((diff % 86_400_000) / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  } catch {
    return null;
  }
};

/* ─────────────────────────────────────────────
   State / Format Helpers
───────────────────────────────────────────── */
interface BadgeCfg {
  bg: string;
  text: string;
  dot?: string;
  label: string;
  glow?: string;
}

const stateConfig = (state?: string): BadgeCfg => {
  const s = (state || "").toLowerCase();
  if (s.includes("progress") || s === "in progress")
    return {
      bg: "bg-emerald-500/10 border border-emerald-500/20",
      text: "text-emerald-400",
      dot: "bg-emerald-400",
      label: "LIVE",
      glow: "shadow-[0_0_8px_rgba(52,211,153,0.3)]",
    };
  if (s.includes("preview") || s === "preview")
    return {
      bg: "bg-sky-500/10 border border-sky-500/15",
      text: "text-sky-400",
      label: "UPCOMING",
    };
  if (s.includes("complete") || s === "complete")
    return {
      bg: "bg-slate-500/10 border border-slate-500/15",
      text: "text-slate-400",
      label: "RESULT",
    };
  if (s.includes("rain"))
    return {
      bg: "bg-amber-500/10 border border-amber-500/15",
      text: "text-amber-400",
      dot: "bg-amber-400",
      label: "RAIN",
    };
  if (s.includes("stump"))
    return {
      bg: "bg-violet-500/10 border border-violet-500/15",
      text: "text-violet-400",
      label: "STUMPS",
    };
  if (s.includes("draw"))
    return {
      bg: "bg-indigo-500/10 border border-indigo-500/15",
      text: "text-indigo-400",
      label: "DRAW",
    };
  if (s.includes("cancel") || s.includes("abandon"))
    return {
      bg: "bg-rose-500/10 border border-rose-500/15",
      text: "text-rose-400",
      label: "CANCELLED",
    };
  if (s.includes("no result"))
    return {
      bg: "bg-slate-500/10 border border-slate-500/15",
      text: "text-slate-500",
      label: "NO RESULT",
    };
  if (s.includes("toss"))
    return {
      bg: "bg-cyan-500/10 border border-cyan-500/15",
      text: "text-cyan-400",
      dot: "bg-cyan-400",
      label: "TOSS",
    };
  return {
    bg: "bg-slate-500/10 border border-slate-500/15",
    text: "text-slate-500",
    label: state || "—",
  };
};

const isLive = (state?: string): boolean => {
  const s = (state || "").toLowerCase();
  return (
    s.includes("progress") ||
    s === "in progress" ||
    s.includes("rain") ||
    s.includes("stump") ||
    s.includes("toss") ||
    s.includes("lunch") ||
    s.includes("tea") ||
    s.includes("drinks")
  );
};

const isPreview = (state?: string): boolean =>
  (state || "").toLowerCase().includes("preview");

const isComplete = (state?: string): boolean =>
  (state || "").toLowerCase().includes("complete");

const formatBadgeColor = (fmt?: string): string => {
  const f = (fmt || "").toUpperCase();
  if (f === "TEST")
    return "bg-rose-500/10 text-rose-400 border-rose-500/20";
  if (f === "ODI")
    return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  if (f.includes("T20") || f === "T20I")
    return "bg-violet-500/10 text-violet-400 border-violet-500/20";
  return "bg-slate-500/10 text-slate-400 border-slate-500/15";
};

/* ─────────────────────────────────────────────
   Team Logo
───────────────────────────────────────────── */
const TeamLogo = React.memo(
  ({ imageId, name, size = "md" }: { imageId?: number; name?: string; size?: "sm" | "md" }) => {
    const [err, setErr] = useState(false);
    const url = imgUrl(imageId);
    const initials = (name || "?")
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 3)
      .toUpperCase();

    const dim = size === "sm" ? "w-9 h-9" : "w-11 h-11";
    const textSz = size === "sm" ? "text-[10px]" : "text-xs";

    if (!url || err) {
      return (
        <div
          className={`${dim} rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 
                      border border-emerald-500/10 flex items-center justify-center 
                      text-emerald-400 ${textSz} font-extrabold flex-shrink-0`}
        >
          {initials}
        </div>
      );
    }

    return (
      <img
        src={url}
        alt={name || ""}
        onError={() => setErr(true)}
        className={`${dim} rounded-xl object-contain border border-white/5 
                    bg-slate-800/50 p-0.5 flex-shrink-0`}
      />
    );
  }
);
TeamLogo.displayName = "TeamLogo";

/* ─────────────────────────────────────────────
   Score Display
───────────────────────────────────────────── */
const ScoreDisplay = React.memo(
  ({
    teamScore,
    isBatting,
  }: {
    teamScore?: TeamMatchScore;
    isBatting?: boolean;
  }) => {
    const inn1 = teamScore?.inngs1;
    const inn2 = teamScore?.inngs2;

    if (!inn1 && !inn2) {
      return (
        <span className="text-[11px] text-slate-600 italic tracking-wide">
          Yet to bat
        </span>
      );
    }

    return (
      <div className="flex flex-col gap-0.5">
        {inn1 && (
          <span
            className={`score-mono font-bold text-sm tracking-tight ${
              isBatting && !inn2
                ? "text-emerald-400"
                : "text-slate-200"
            }`}
          >
            {fmtScore(inn1)}
          </span>
        )}
        {inn2 && (
          <span
            className={`score-mono font-bold text-sm tracking-tight ${
              isBatting
                ? "text-emerald-400"
                : "text-slate-200"
            }`}
          >
            {fmtScore(inn2)}
          </span>
        )}
      </div>
    );
  }
);
ScoreDisplay.displayName = "ScoreDisplay";

/* ─────────────────────────────────────────────
   Skeleton Card
───────────────────────────────────────────── */
const SkeletonCard = ({ delay = 0 }: { delay?: number }) => (
  <div
    className="rounded-2xl border border-white/[0.04] overflow-hidden"
    style={{
      background: "rgba(15,23,42,0.4)",
      animationDelay: `${delay}ms`,
    }}
  >
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="h-3 w-36 shimmer-skeleton" />
        <div className="h-5 w-14 shimmer-skeleton rounded-full" />
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 shimmer-skeleton rounded-xl" />
          <div className="space-y-2">
            <div className="h-4 w-10 shimmer-skeleton" />
            <div className="h-3 w-16 shimmer-skeleton" />
          </div>
        </div>
        <div className="h-4 w-6 shimmer-skeleton rounded-md" />
        <div className="flex items-center gap-3">
          <div className="space-y-2 flex flex-col items-end">
            <div className="h-4 w-10 shimmer-skeleton" />
            <div className="h-3 w-16 shimmer-skeleton" />
          </div>
          <div className="w-11 h-11 shimmer-skeleton rounded-xl" />
        </div>
      </div>
    </div>
    <div className="px-4 py-3 border-t border-white/[0.03]">
      <div className="h-3 w-full shimmer-skeleton" />
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Match Card
───────────────────────────────────────────── */
const MatchCard = React.memo(
  ({
    item,
    onClick,
    index,
  }: {
    item: MatchItem;
    onClick: () => void;
    index: number;
  }) => {
    const info = item.matchInfo;
    const score = item.matchScore;

    const state = info?.state;
    const badge = stateConfig(state);
    const live = isLive(state);
    const preview = isPreview(state);
    const complete = isComplete(state);

    const team1 = info?.team1;
    const team2 = info?.team2;
    const t1Score = score?.team1Score;
    const t2Score = score?.team2Score;
    const isBattingT1 = info?.currBatTeamId === team1?.id;
    const isBattingT2 = info?.currBatTeamId === team2?.id;

    const startTs = info?.startDate;
    const cd = preview ? countdown(startTs) : null;

    return (
      <button
        onClick={onClick}
        className={`card-enter card-glow w-full text-left group rounded-2xl 
                    border overflow-hidden transition-all duration-300 ease-out
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50
                    hover:-translate-y-1 cursor-pointer
                    ${
                      live
                        ? "glass live-border border-emerald-500/15"
                        : "glass border-white/[0.06] hover:border-white/[0.12]"
                    }`}
        style={{ animationDelay: `${index * 60}ms` }}
      >
        {/* ── Top: Series + Format + State ── */}
        <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] text-slate-500 truncate max-w-[200px] tracking-wide">
              {info?.seriesName || "—"}
            </span>
            {info?.matchDesc && (
              <>
                <span className="text-[11px] text-slate-700 hidden sm:inline">·</span>
                <span className="text-[11px] text-slate-600 hidden sm:inline truncate max-w-[120px]">
                  {info.matchDesc}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {info?.matchFormat && (
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-md border tracking-widest
                            ${formatBadgeColor(info.matchFormat)}`}
              >
                {info.matchFormat.toUpperCase()}
              </span>
            )}
            <span
              className={`flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-1 rounded-full 
                          tracking-widest uppercase ${badge.bg} ${badge.text} ${badge.glow || ""}`}
            >
              {live && badge.dot && (
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot} live-dot`} />
              )}
              {badge.label}
            </span>
          </div>
        </div>

        {/* ── Teams + Scores ── */}
        <div className="px-4 pb-3.5">
          <div className="flex items-center justify-between gap-3">
            {/* Team 1 */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <TeamLogo imageId={team1?.imageId} name={team1?.shortName} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-bold text-sm truncate ${
                      isBattingT1 ? "text-emerald-400" : "text-slate-200"
                    }`}
                  >
                    {team1?.shortName || team1?.name || "—"}
                  </span>
                  {isBattingT1 && live && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot flex-shrink-0" />
                  )}
                </div>
                <ScoreDisplay teamScore={t1Score} isBatting={isBattingT1} />
              </div>
            </div>

            {/* VS divider */}
            <div className="flex flex-col items-center flex-shrink-0 px-1">
              <div className="w-px h-4 bg-gradient-to-b from-transparent via-slate-700 to-transparent" />
              <span className="text-[9px] font-black text-slate-600 tracking-widest my-1">VS</span>
              <div className="w-px h-4 bg-gradient-to-b from-transparent via-slate-700 to-transparent" />
            </div>

            {/* Team 2 */}
            <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
              <div className="min-w-0 text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  {isBattingT2 && live && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot flex-shrink-0" />
                  )}
                  <span
                    className={`font-bold text-sm truncate ${
                      isBattingT2 ? "text-emerald-400" : "text-slate-200"
                    }`}
                  >
                    {team2?.shortName || team2?.name || "—"}
                  </span>
                </div>
                <div className="flex justify-end">
                  <ScoreDisplay teamScore={t2Score} isBatting={isBattingT2} />
                </div>
              </div>
              <TeamLogo imageId={team2?.imageId} name={team2?.shortName} />
            </div>
          </div>
        </div>

        {/* ── Status / Result / Countdown ── */}
        <div
          className={`px-4 py-2.5 border-t transition-colors
            ${
              live
                ? "border-emerald-500/10 bg-emerald-500/[0.04]"
                : complete
                ? "border-white/[0.03] bg-white/[0.01]"
                : preview
                ? "border-sky-500/10 bg-sky-500/[0.03]"
                : "border-white/[0.03] bg-white/[0.01]"
            }`}
        >
          {info?.status ? (
            <p
              className={`text-xs font-medium leading-relaxed line-clamp-2 ${
                live
                  ? "text-emerald-400/90"
                  : complete
                  ? "text-slate-400"
                  : "text-slate-400"
              }`}
            >
              {info.status}
            </p>
          ) : cd ? (
            <p className="text-xs font-semibold text-sky-400/90 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-sky-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Starts in {cd}
            </p>
          ) : null}

          {/* Venue */}
          {(info?.venueInfo?.name || info?.venueInfo?.city) && (
            <p className="text-[10px] text-slate-600 mt-1 truncate flex items-center gap-1">
              <svg className="w-3 h-3 text-slate-700 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {[info.venueInfo.name, info.venueInfo.city].filter(Boolean).join(", ")}
            </p>
          )}

          {/* Start date */}
          {preview && startTs && (
            <p className="text-[10px] text-slate-600 mt-0.5 flex items-center gap-1">
              <svg className="w-3 h-3 text-slate-700 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {tsToDate(startTs)}
            </p>
          )}
        </div>

        {/* ── Hover accent bottom line ── */}
        <div
          className="h-[2px] w-0 group-hover:w-full transition-all duration-500 ease-out"
          style={{
            background: live
              ? "linear-gradient(90deg, #059669, #34d399, #6ee7b7)"
              : "linear-gradient(90deg, rgba(52,211,153,0.3), rgba(52,211,153,0.6), rgba(52,211,153,0.3))",
          }}
        />
      </button>
    );
  }
);
MatchCard.displayName = "MatchCard";

/* ─────────────────────────────────────────────
   Search Bar
───────────────────────────────────────────── */
const SearchBar = React.memo(
  ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="relative flex-1 max-w-sm">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search teams, series, venues…"
        className="w-full pl-9 pr-9 py-2 text-sm rounded-xl text-slate-200 
                   placeholder-slate-600 border border-white/[0.06]
                   bg-white/[0.03] backdrop-blur-sm
                   focus:outline-none focus:ring-1 focus:ring-emerald-500/40 
                   focus:border-emerald-500/30 focus:bg-white/[0.05]
                   transition-all duration-200"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md
                     bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center
                     text-slate-400 hover:text-slate-200 transition-colors text-xs"
        >
          ✕
        </button>
      )}
    </div>
  )
);
SearchBar.displayName = "SearchBar";

/* ─────────────────────────────────────────────
   Filter Tabs
───────────────────────────────────────────── */
type FilterType = "All" | "Live" | "Upcoming" | "Completed";
const FILTERS: FilterType[] = ["All", "Live", "Upcoming", "Completed"];

const FilterTab = React.memo(
  ({
    active,
    label,
    count,
    onClick,
  }: {
    active: boolean;
    label: FilterType;
    count: number;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold 
                  tracking-wide transition-all duration-200 ease-out
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50
                  ${
                    active
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shadow-[0_0_12px_-3px_rgba(52,211,153,0.2)]"
                      : "bg-white/[0.02] text-slate-500 border border-white/[0.05] hover:text-slate-300 hover:border-white/[0.1] hover:bg-white/[0.04]"
                  }`}
    >
      {label === "Live" && (
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            active ? "bg-emerald-400 live-dot" : "bg-slate-600"
          }`}
        />
      )}
      {label}
      {count > 0 && (
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
            active
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-white/[0.04] text-slate-600"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  )
);
FilterTab.displayName = "FilterTab";

/* ─────────────────────────────────────────────
   Main: Home Page
───────────────────────────────────────────── */
export default function HomePage() {
  const navigate = useNavigate();
  const [data, setData] = useState<HomeApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("All");
  const [refreshing, setRefreshing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const styleRef = useRef(false);

  /* inject custom CSS once */
  useEffect(() => {
    if (styleRef.current) return;
    styleRef.current = true;
    const tag = document.createElement("style");
    tag.textContent = CUSTOM_CSS;
    document.head.appendChild(tag);
    // Always dark
    document.documentElement.classList.add("dark");
    return () => {
      document.head.removeChild(tag);
    };
  }, []);

  /* fetch */
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    } else {
      setRefreshing(true);
    }
    try {
      const res = await fetch("/api/score/home", { cache: "no-store" });
      if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
      const json: HomeApiResponse = await res.json();
      setData(json);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load matches");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  /* auto-refresh every 30s */
  useEffect(() => {
    timerRef.current = setInterval(() => fetchData(true), 30_000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchData]);

  /* all matches */
  const allMatches: MatchItem[] = useMemo(
    () =>
      (data?.matches || [])
        .map((w) => w?.match)
        .filter((m): m is MatchItem => !!m && !!m.matchInfo),
    [data]
  );

  /* counts */
  const counts = useMemo(() => {
    const c: Record<FilterType, number> = { All: allMatches.length, Live: 0, Upcoming: 0, Completed: 0 };
    allMatches.forEach((m) => {
      const s = m.matchInfo?.state || "";
      if (isLive(s)) c.Live++;
      else if (isPreview(s)) c.Upcoming++;
      else if (isComplete(s)) c.Completed++;
    });
    return c;
  }, [allMatches]);

  /* filtered + searched */
  const visible = useMemo(() => {
    let arr = allMatches;
    if (filter !== "All") {
      arr = arr.filter((m) => {
        const s = m.matchInfo?.state || "";
        if (filter === "Live") return isLive(s);
        if (filter === "Upcoming") return isPreview(s);
        if (filter === "Completed") return isComplete(s);
        return true;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(
        (m) =>
          m.matchInfo?.team1?.name?.toLowerCase().includes(q) ||
          m.matchInfo?.team1?.shortName?.toLowerCase().includes(q) ||
          m.matchInfo?.team2?.name?.toLowerCase().includes(q) ||
          m.matchInfo?.team2?.shortName?.toLowerCase().includes(q) ||
          m.matchInfo?.seriesName?.toLowerCase().includes(q) ||
          m.matchInfo?.matchDesc?.toLowerCase().includes(q) ||
          m.matchInfo?.venueInfo?.city?.toLowerCase().includes(q)
      );
    }
    return arr;
  }, [allMatches, filter, search]);

  const handleCardClick = useCallback(
    (matchId?: number) => {
      if (!matchId) return;
      navigate(`/live-score/${matchId}`);
    },
    [navigate]
  );

  const liveCount = counts.Live;

  return (
    <div className="min-h-screen bg-[#060918] gradient-mesh text-slate-200 transition-colors duration-300">
      {/* ═══ Header ═══ */}
      <header className="sticky top-0 z-50 glass-header border-b border-white/[0.04]">
        {/* Animated accent stripe */}
        <div className="header-stripe h-[2px]" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {/* Brand */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-lg"
              style={{
                background: "linear-gradient(135deg, #059669, #10b981)",
                boxShadow: "0 4px 16px -4px rgba(16,185,129,0.4)",
              }}
            >
              🏏
            </div>
            <div className="hidden sm:block">
              <span className="font-black text-white text-lg tracking-tight">
                Cricket
              </span>
              <span
                className="font-black text-lg tracking-tight"
                style={{
                  background: "linear-gradient(135deg, #34d399, #6ee7b7)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Live
              </span>
            </div>
          </div>

          {/* Live counter pill */}
          {liveCount > 0 && (
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 flex-shrink-0"
              style={{
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(52,211,153,0.15)",
                boxShadow: "0 0 16px -4px rgba(52,211,153,0.15)",
              }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 live-dot" />
              <span className="text-xs font-bold text-emerald-400 tracking-wide">
                {liveCount} LIVE
              </span>
            </div>
          )}

          {/* Search */}
          <div className="flex-1 min-w-0">
            <SearchBar value={search} onChange={setSearch} />
          </div>

          {/* Last updated */}
          {lastUpdated && (
            <span className="text-[10px] text-slate-600 flex-shrink-0 hidden lg:block font-mono tracking-tight">
              {lastUpdated.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          )}

          {/* Refresh */}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl
                       bg-white/[0.03] border border-white/[0.06] text-slate-400
                       hover:text-emerald-400 hover:border-emerald-500/20 hover:bg-emerald-500/[0.06]
                       transition-all duration-200 disabled:opacity-40"
            aria-label="Refresh"
          >
            <svg
              className={`w-4 h-4 ${refreshing ? "spin-smooth" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {/* Filter tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {FILTERS.map((f) => (
            <FilterTab
              key={f}
              label={f}
              active={filter === f}
              count={counts[f]}
              onClick={() => setFilter(f)}
            />
          ))}
        </div>
      </header>

      {/* ═══ Main ═══ */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => (
              <SkeletonCard key={i} delay={i * 80} />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}
            >
              ⚠️
            </div>
            <div className="text-center max-w-sm">
              <p className="font-bold text-slate-200 mb-1.5">Failed to load matches</p>
              <p className="text-sm text-slate-500 mb-5 leading-relaxed">{error}</p>
              <button
                onClick={() => fetchData(false)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white
                           transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #059669, #10b981)",
                  boxShadow: "0 4px 16px -4px rgba(16,185,129,0.4)",
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && visible.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: "rgba(148,163,184,0.06)", border: "1px solid rgba(148,163,184,0.08)" }}
            >
              🏏
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-300 mb-1">
                {search
                  ? `No matches for "${search}"`
                  : filter !== "All"
                  ? `No ${filter.toLowerCase()} matches`
                  : "No matches available"}
              </p>
              <p className="text-sm text-slate-600">
                {search ? "Try a different search term" : "Check back soon!"}
              </p>
            </div>
            {(search || filter !== "All") && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilter("All");
                }}
                className="px-5 py-2 bg-white/[0.04] border border-white/[0.06] text-slate-400
                           rounded-xl text-sm font-medium hover:bg-white/[0.06] hover:text-slate-300
                           transition-all mt-1"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Card grid */}
        {!loading && !error && visible.length > 0 && (
          <>
            {/* Result count bar */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] text-slate-600 tracking-wide">
                <span className="text-slate-500 font-semibold">{visible.length}</span>
                {" "}match{visible.length !== 1 ? "es" : ""}
                {filter !== "All" && (
                  <span className="text-slate-700"> · {filter}</span>
                )}
                {search && (
                  <span className="text-slate-700"> · "{search}"</span>
                )}
              </p>
              {refreshing && (
                <span className="text-[11px] text-emerald-500/70 font-semibold flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 live-dot" />
                  Refreshing
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visible.map((match, i) => (
                <MatchCard
                  key={match?.matchInfo?.matchId ?? i}
                  item={match}
                  index={i}
                  onClick={() => handleCardClick(match?.matchInfo?.matchId)}
                />
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        {!loading && (data || error) && (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 pb-6 border-t border-white/[0.03] pt-4">
            <span className="text-[10px] text-slate-700 font-mono">
              {lastUpdated
                ? `Updated ${lastUpdated.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`
                : ""}
            </span>
            {data?.responseLastUpdated && (
              <span className="text-[10px] text-slate-700 font-mono">
                API: {tsToDate(data.responseLastUpdated)}
              </span>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
