

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useParams, useNavigate } from "react-router-dom";

/* ═══════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════ */

interface Player {
  profileId: string | number;
  name: string;
  role?: string;
  captain?: boolean;
  keeper?: boolean;
  image?: string;
  playingXI?: boolean;
}

interface SquadAPIResponse {
  success: boolean;
  team1Name: string;
  team2Name: string;
  
  team1Flag: string;
  team2Flag: string;

  seriesName?: string;
  venue?: string;
  matchStatus?: string;
  matchDate?: string;
  matchTime?: string;
  matchFormat?: string;
  matchDescription?: string;
  team1: Player[];
  team2: Player[];
}

/* ═══════════════════════════════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════════════════════════════ */

const cx = (...c: (string | false | undefined | null)[]) =>
  c.filter(Boolean).join(" ");

const initials = (name?: string) => {
  const safeName = (name ?? "").trim();

  if (!safeName) {
    return "?";
  }

  const parts = safeName.split(/\s+/);

  return parts.length >= 2
    ? (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
    : safeName.slice(0, 2).toUpperCase();
};

const roleLabel = (r?: string): string => {
  if (!r) return "";
  const l = r.toLowerCase();
  if (l.includes("wk") && l.includes("bat")) return "WK-Batter";
  if (l.includes("keep") && l.includes("bat")) return "WK-Batter";
  if (l.includes("keep")) return "Wicket Keeper";
  if (l.includes("bat") && l.includes("all")) return "Batting All-rounder";
  if (l.includes("bowl") && l.includes("all")) return "Bowling All-rounder";
  if (l.includes("all")) return "All-rounder";
  if (l.includes("fast") || l.includes("pace")) return "Fast Bowler";
  if (l.includes("spin")) return "Spinner";
  if (l.includes("bowl")) return "Bowler";
  if (l.includes("bat")) return "Batter";
  return r;
};

const roleEmoji = (r?: string) => {
  if (!r) return "🏏";
  const l = r.toLowerCase();
  if (l.includes("keep") || l.includes("wk")) return "🧤";
  if (l.includes("spin")) return "🌀";
  if (l.includes("fast") || l.includes("pace") || l.includes("bowl"))
    return "⚾";
  if (l.includes("all")) return "🏏";
  return "🏏";
};

/* ═══════════════════════════════════════════════════════════════════════
   ICONS — inline SVG, zero dependency
   ═══════════════════════════════════════════════════════════════════════ */

const I = {
  Back: ({ className }: { className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  ),
  Share: ({ className }: { className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
    </svg>
  ),
  Shield: ({ className }: { className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  ),
  Pin: ({ className }: { className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  ),
  Calendar: ({ className }: { className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  Users: ({ className }: { className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8" />
    </svg>
  ),
  Bench: ({ className }: { className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="6" width="20" height="4" rx="1" />
      <path d="M4 10v7M20 10v7M8 10v4M16 10v4" />
    </svg>
  ),
  Alert: ({ className }: { className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 9v4M12 17h.01M10.3 3.9 2.6 17a2 2 0 001.7 3h15.4a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0Z" />
    </svg>
  ),
  Refresh: ({ className }: { className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0115.3-6.4L21 8M21 3v5h-5M21 12a9 9 0 01-15.3 6.4L3 16M3 21v-5h5" />
    </svg>
  ),
  Bat: ({ className }: { className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 3.5 20.5 9.5" />
      <path d="M9 9 3 15a2.5 2.5 0 003.5 3.5L12 13" />
      <path d="M12.5 5.5 18.5 11.5 14 16 8 10Z" />
    </svg>
  ),
  Wifi: ({ className }: { className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01" />
    </svg>
  ),
};

/* ═══════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ═══════════════════════════════════════════════════════════════════════ */

const DT = {
  card: "bg-white dark:bg-[#111815] rounded-[20px] shadow-[0_1px_8px_-3px_rgba(15,23,20,0.08)] dark:shadow-[0_1px_16px_-6px_rgba(0,0,0,0.45)] border border-black/[0.04] dark:border-white/[0.06] overflow-hidden w-full",
  sectionBar:
    "flex items-center gap-2.5 px-4 sm:px-5 py-3 bg-gradient-to-r from-[#009270]/[0.06] via-[#009270]/[0.02] to-transparent dark:from-[#12b985]/[0.09] dark:via-[#12b985]/[0.03] dark:to-transparent border-b border-black/[0.04] dark:border-white/[0.05]",
  sectionTitle:
    "text-[11px] sm:text-[11.5px] font-bold text-[#00734f] dark:text-[#3ddba4] uppercase tracking-[0.08em]",
  accent:
    "w-1 h-5 rounded-full bg-gradient-to-b from-[#00b884] to-[#009270] dark:from-[#3ddba4] dark:to-[#12b985] flex-shrink-0",
  badge:
    "inline-flex items-center justify-center rounded-md text-[10px] font-bold leading-none",
};

/* ═══════════════════════════════════════════════════════════════════════
   LAZY IMAGE
   ═══════════════════════════════════════════════════════════════════════ */

const LazyImage: React.FC<{
  src?: string;
  alt: string;
  size: number;
  fallback: string;
  className?: string;
}> = ({ src, alt, size, fallback, className }) => {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const showImg = src && inView && !err;

  return (
    <div
      ref={ref}
      className={cx(
        "relative rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-black/[0.06] dark:border-white/10",
        className
      )}
      style={{ width: size, height: size }}
    >
      {!showImg && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-600 font-bold select-none text-xs">
          {fallback}
        </div>
      )}
      {showImg && (
        <>
          {!loaded && (
            <div className="absolute inset-0 shimmer rounded-full" />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src!}
            alt={alt}
            className={cx(
              "w-full h-full object-cover transition-opacity duration-300",
              loaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setLoaded(true)}
            onError={() => setErr(true)}
            loading="lazy"
          />
        </>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   SKELETON LOADER
   ═══════════════════════════════════════════════════════════════════════ */

const Skel = ({ className }: { className?: string }) => (
  <div className={cx("shimmer rounded-full", className)} />
);

const PlayerSkel = ({ imgSz = 48 }: { imgSz?: number }) => (
  <div className="flex items-center gap-3.5 px-4 py-[14px]">
    <div
      className="rounded-full shimmer flex-shrink-0"
      style={{ width: imgSz, height: imgSz }}
    />
    <div className="flex-1 space-y-2.5">
      <Skel className="h-[14px] w-3/5" />
      <Skel className="h-3 w-2/5" />
    </div>
    <Skel className="h-5 w-9" />
  </div>
);

const FullSkeleton = () => (
  <div className="max-w-lg mx-auto px-3 sm:px-4 pt-3 pb-8 space-y-4">
    {/* Match card */}
    <div className={DT.card}>
      <div className="px-5 py-7 flex flex-col items-center gap-4">
        <div className="flex items-center gap-7">
          <Skel className="!rounded-full h-[52px] w-[52px]" />
          <Skel className="!rounded-full h-9 w-9" />
          <Skel className="!rounded-full h-[52px] w-[52px]" />
        </div>
        <Skel className="h-3 w-52" />
        <Skel className="h-3 w-36" />
        <Skel className="h-3 w-28" />
      </div>
    </div>
    {/* Tabs */}
    <Skel className="h-12 w-full !rounded-xl" />
    {/* Playing XI */}
    <div className={DT.card}>
      <div className="px-4 py-3 flex items-center gap-2.5">
        <Skel className="h-5 w-1 !rounded-full" />
        <Skel className="h-4 w-20" />
      </div>
      <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
        {Array.from({ length: 7 }).map((_, i) => (
          <PlayerSkel key={i} />
        ))}
      </div>
    </div>
    {/* Bench */}
    <div className={DT.card}>
      <div className="px-4 py-3 flex items-center gap-2.5">
        <Skel className="h-5 w-1 !rounded-full" />
        <Skel className="h-4 w-28" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <PlayerSkel key={i} imgSz={40} />
      ))}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════
   ERROR STATE
   ═══════════════════════════════════════════════════════════════════════ */

const ErrorView: React.FC<{ msg: string; onRetry: () => void }> = ({
  msg,
  onRetry,
}) => (
  <div className="max-w-lg mx-auto px-4 py-24 flex flex-col items-center gap-6">
    {/* Illustration */}
    <div className="relative">
      <div className="h-32 w-32 rounded-full bg-red-50 dark:bg-red-900/15 flex items-center justify-center">
        <div className="h-24 w-24 rounded-full bg-red-100/80 dark:bg-red-900/25 flex items-center justify-center">
          <I.Wifi className="h-12 w-12 text-red-300 dark:text-red-700" />
        </div>
      </div>
      <div className="absolute -bottom-1 -right-1 h-10 w-10 rounded-full bg-white dark:bg-[#111815] border-2 border-red-200 dark:border-red-800 flex items-center justify-center shadow-sm">
        <I.Alert className="h-5 w-5 text-red-400" />
      </div>
    </div>

    <div className="text-center space-y-2">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
        Unable to Load Squad
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
        {msg || "Please check your internet connection and try again."}
      </p>
    </div>

    <button
      onClick={onRetry}
      className="inline-flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-[#00b884] to-[#009270] text-white rounded-full text-sm font-bold hover:brightness-105 active:scale-95 transition-all duration-200 shadow-lg shadow-[#009270]/25"
    >
      <I.Refresh className="h-4 w-4" />
      Try Again
    </button>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════════════════════════════════ */

const EmptyView = () => (
  <div className="max-w-lg mx-auto px-4 py-24 flex flex-col items-center gap-5">
    <div className="relative">
      <div className="h-32 w-32 rounded-full bg-gray-100 dark:bg-gray-800/50 flex items-center justify-center">
        <div className="h-24 w-24 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
          <I.Bat className="h-12 w-12 text-gray-300 dark:text-gray-600" />
        </div>
      </div>
      <div className="absolute -bottom-1 -right-1 h-10 w-10 rounded-full bg-white dark:bg-[#111815] border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm">
        <I.Users className="h-5 w-5 text-gray-400 dark:text-gray-500" />
      </div>
    </div>
    <div className="text-center space-y-2">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
        No Squad Available
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
        Squad will appear here once officially announced.
      </p>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════
   STICKY HEADER
   ═══════════════════════════════════════════════════════════════════════ */

const StickyHeader: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <header
      className={cx(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-white/80 dark:bg-[#0a0f0d]/80 backdrop-blur-2xl shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:shadow-[0_1px_0_rgba(255,255,255,0.04)]"
          : "bg-white dark:bg-[#0a0f0d]"
      )}
    >
      <div className="max-w-lg mx-auto flex items-center justify-between px-1 sm:px-2 h-14">
        <button
          onClick={onBack}
          className="h-10 w-10 rounded-xl flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] active:scale-90 transition-all duration-200"
          aria-label="Go back"
        >
          <I.Back className="h-[22px] w-[22px]" />
        </button>

        <h1
          className={cx(
            "text-[15px] font-bold tracking-tight transition-all duration-300",
            scrolled
              ? "text-gray-900 dark:text-white"
              : "text-gray-900 dark:text-white"
          )}
        >
          Squads
        </h1>

        <button
          className="h-10 w-10 rounded-xl flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] active:scale-90 transition-all duration-200"
          aria-label="Share"
        >
          <I.Share className="h-[20px] w-[20px]" />
        </button>
      </div>

      {/* Bottom gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-black/[0.06] dark:via-white/[0.06] to-transparent" />
    </header>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   MATCH INFO CARD
   ═══════════════════════════════════════════════════════════════════════ */

const MatchInfoCard: React.FC<{ d: SquadAPIResponse }> = ({ d }) => (
  <div className={cx(DT.card, "card-enter")}>
    {/* Teams */}
    <div className="px-5 pt-6 pb-5">
      <div className="flex items-center justify-center gap-5 sm:gap-8">
        {/* Team 1 */}
        <div className="flex flex-col items-center gap-2.5 flex-1 min-w-0">
          <LazyImage
            src={d.team1Flag}
            alt={d.team1Name}
            size={56}
            fallback={initials(d.team1Name)}
            className="shadow-md !border-2"
          />
          <span className="text-[13px] sm:text-[14px] font-extrabold text-gray-900 dark:text-white text-center leading-snug">
            {d.team1Name}
          </span>
        </div>

        {/* VS Badge */}
        <div className="flex-shrink-0">
          <span className="h-10 w-10 rounded-full bg-gradient-to-br from-[#00b884] to-[#009270] flex items-center justify-center text-white text-[11px] font-black shadow-lg shadow-[#009270]/30 ring-4 ring-white/80 dark:ring-[#111815]/80">
            VS
          </span>
        </div>

        {/* Team 2 */}
        <div className="flex flex-col items-center gap-2.5 flex-1 min-w-0">
          <LazyImage
            src={d.team2Flag}
            alt={d.team2Name}
            size={56}
            fallback={initials(d.team2Name)}
            className="shadow-md !border-2"
          />
          <span className="text-[13px] sm:text-[14px] font-extrabold text-gray-900 dark:text-white text-center leading-snug">
            {d.team2Name}
          </span>
        </div>
      </div>
    </div>

    {/* Meta Info */}
    <div className="border-t border-black/[0.04] dark:border-white/[0.05] bg-gray-50/50 dark:bg-white/[0.015] px-4 sm:px-5 py-3.5 space-y-2">
      {d.seriesName && (
        <div className="flex items-start gap-2 justify-center">
          <I.Shield className="h-3.5 w-3.5 text-[#009270] dark:text-[#3ddba4] flex-shrink-0 mt-0.5" />
          <span className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 font-semibold text-center leading-snug">
            {d.seriesName}
          </span>
        </div>
      )}

      {d.venue && (
        <div className="flex items-center gap-2 justify-center">
          <I.Pin className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <span className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-500 text-center">
            {d.venue}
          </span>
        </div>
      )}

      {/* Date + Time + Format */}
      <div className="flex items-center justify-center gap-2.5 flex-wrap">
        {(d.matchDate || d.matchTime) && (
          <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500 font-medium">
            <I.Calendar className="h-3 w-3" />
            {d.matchDate}
            {d.matchTime ? ` · ${d.matchTime}` : ""}
          </span>
        )}
        {d.matchFormat && (
          <span className="text-[10px] font-bold text-white bg-gradient-to-r from-[#00b884] to-[#009270] px-2.5 py-[3px] rounded-full shadow-sm shadow-[#009270]/20">
            {d.matchFormat}
          </span>
        )}
      </div>

      {/* Status */}
      {d.matchStatus && (
        <div className="flex justify-center pt-0.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#00734f] dark:text-[#3ddba4] bg-[#009270]/[0.08] dark:bg-[#3ddba4]/[0.08] px-3 py-1.5 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-[#009270] dark:bg-[#3ddba4] animate-pulse" />
            {d.matchStatus}
          </span>
        </div>
      )}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════
   TEAM TABS — segmented control with sliding indicator
   ═══════════════════════════════════════════════════════════════════════ */

const TeamTabs: React.FC<{
  names: [string, string];
  active: 0 | 1;
  onChange: (t: 0 | 1) => void;
}> = ({ names, active, onChange }) => (
  <div className="relative flex p-[5px] bg-gray-200/70 dark:bg-white/[0.06] rounded-2xl overflow-hidden">
    {/* Slider */}
    <div
      className="absolute top-[5px] bottom-[5px] rounded-[13px] bg-gradient-to-r from-[#00b884] to-[#009270] shadow-lg shadow-[#009270]/20 transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] z-0"
      style={{
        width: "calc(50% - 5px)",
        left: active === 0 ? 5 : "calc(50%)",
      }}
    />
    {names.map((n, i) => (
      <button
        key={i}
        onClick={() => onChange(i as 0 | 1)}
        className={cx(
          "relative z-10 flex-1 py-3 text-[12px] sm:text-[13px] font-bold rounded-[13px] transition-colors duration-300 truncate px-3",
          active === i ? "text-white" : "text-gray-600 dark:text-gray-400"
        )}
      >
        {n}
      </button>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════
   PLAYER CARD
   ═══════════════════════════════════════════════════════════════════════ */

const PlayerCard: React.FC<{
  player: Player;
  idx: number;
  compact?: boolean;
}> = ({ player, idx, compact = false }) => {
  const sz = compact ? 40 : 48;
  const label = roleLabel(player.role);
  const emoji = roleEmoji(player.role);
  const isXI = player.playingXI !== false && !compact;

  return (
    <div
      className={cx(
        "flex items-center gap-3 sm:gap-3.5 px-4",
        compact ? "py-[12px]" : "py-[14px]",
        "transition-all duration-250 active:scale-[0.985] cursor-default group",
        "hover:bg-[#009270]/[0.025] dark:hover:bg-[#3ddba4]/[0.035]",
        idx > 0 &&
          "border-t border-gray-100/80 dark:border-white/[0.04]"
      )}
      style={{
        animationDelay: `${idx * 35}ms`,
        animation: "playerSlideIn 0.4s ease both",
      }}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <LazyImage
          src={player.image}
          alt={player.name}
          size={sz}
          fallback={initials(player.name)}
          className="shadow-sm"
        />
        {/* Playing XI green dot */}
        {isXI && (
          <span className="absolute -bottom-[1px] -right-[1px] h-[14px] w-[14px] rounded-full bg-white dark:bg-[#111815] flex items-center justify-center shadow-sm">
            <span className="h-[8px] w-[8px] rounded-full bg-gradient-to-br from-[#00b884] to-[#009270]" />
          </span>
        )}
      </div>

      {/* Name & Role */}
      <div className="flex-1 min-w-0">
        <span
          className={cx(
            "block font-semibold text-gray-900 dark:text-white truncate leading-snug",
            compact ? "text-[13px]" : "text-[14px] sm:text-[15px]"
          )}
        >
          {player.name}
        </span>
        {label && (
          <span className="flex items-center gap-1 mt-[3px]">
            <span className="text-[11px] leading-none">{emoji}</span>
            <span
              className={cx(
                "text-gray-500 dark:text-gray-400 truncate leading-snug",
                compact ? "text-[11px]" : "text-[12px] sm:text-[13px]"
              )}
            >
              {label}
            </span>
          </span>
        )}
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {player.captain && (
          <span
            className={cx(
              DT.badge,
              "h-[22px] px-[7px] bg-[#009270]/[0.1] text-[#00734f] dark:bg-[#3ddba4]/[0.12] dark:text-[#3ddba4] border border-[#009270]/20 dark:border-[#3ddba4]/20"
            )}
          >
            C
          </span>
        )}
        {player.keeper && (
          <span
            className={cx(
              DT.badge,
              "h-[22px] px-[7px] bg-blue-50 text-blue-600 dark:bg-blue-900/25 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40"
            )}
          >
            WK
          </span>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   PLAYER LIST SECTION
   ═══════════════════════════════════════════════════════════════════════ */

const PlayerSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  players: Player[];
  compact?: boolean;
}> = ({ title, icon, players, compact = false }) => {
  if (!players.length) return null;
  return (
    <div className={cx(DT.card, "card-enter")}>
      <div className={DT.sectionBar}>
        <span className={DT.accent} />
        <span className="text-[#009270] dark:text-[#3ddba4]">{icon}</span>
        <span className={DT.sectionTitle}>{title}</span>
        <span className="ml-auto text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/[0.06] h-5 min-w-[22px] flex items-center justify-center rounded-full tabular-nums px-1.5">
          {players.length}
        </span>
      </div>
      <div>
        {players.map((p, i) => (
          <PlayerCard
            key={p.profileId}
            player={p}
            idx={i}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   TEAM SECTION
   ═══════════════════════════════════════════════════════════════════════ */

const TeamBlock: React.FC<{
  players: Player[];
  teamName: string;
  teamFlag: string;
}> = ({ players, teamName, teamFlag }) => {
  const hasXIFlag = players.some((p) => p.playingXI === true);
  const xi = hasXIFlag
    ? players.filter((p) => p.playingXI !== false)
    : players.slice(0, 11);
  const bench = hasXIFlag
    ? players.filter((p) => p.playingXI === false)
    : players.slice(11);

  if (!players.length) return <EmptyView />;

  return (
    <div className="space-y-4">
      {/* Team header */}
      <div className="flex items-center gap-3 px-1 card-enter">
        <LazyImage
          src={teamFlag}
          alt={teamName}
          size={36}
          fallback={initials(teamName)}
          className="shadow-sm"
        />
        <div>
          <div className="text-[15px] font-extrabold text-gray-900 dark:text-white tracking-tight leading-snug">
            {teamName}
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
            {players.length} Players
          </div>
        </div>
      </div>

      {/* Playing XI */}
      {xi.length > 0 && (
        <PlayerSection
          title="Playing XI"
          icon={<I.Users className="h-4 w-4" />}
          players={xi}
        />
      )}

      {/* Bench */}
      {bench.length > 0 && (
        <PlayerSection
          title="Bench Players"
          icon={<I.Bench className="h-4 w-4" />}
          players={bench}
          compact
        />
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════ */

export default function Squad() {
  const params = useParams();
  const navigate = useNavigate();
  const matchId = params?.matchId as string | undefined;

  const [data, setData] = useState<SquadAPIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<0 | 1>(0);

  
 const fetchSquad = useCallback(async () => {
  if (!matchId) {
    setError("No match ID provided.");
    setLoading(false);
    return;
  }

  try {
    setLoading(true);
    setError(null);

    const squadRes = await fetch(
  `/api/score/squad?matchId=${matchId}`,
  {
    cache: "no-store",
  }
);

if (!squadRes.ok) {
  throw new Error("Failed to load squad.");
}

const squad: SquadAPIResponse = await squadRes.json();

if (!squad.success) {
  throw new Error("Squad data unavailable.");
}
setData(squad);
    
  } catch (e) {
    setError(e instanceof Error ? e.message : "Failed to fetch squad.");
  } finally {
    setLoading(false);
  }
}, [matchId]);

  useEffect(() => {
    fetchSquad();
  }, [fetchSquad]);

const handleBack = useCallback(() => {
  if (window.history.length > 1) {
    navigate(-1);
  } else {
    navigate("/", { replace: true });
  }
}, [navigate]);

  const currentPlayers = useMemo(
    () => (tab === 0 ? data?.team1 ?? [] : data?.team2 ?? []),
    [tab, data]
  );
  const currentName = tab === 0 ? data?.team1Name ?? "" : data?.team2Name ?? "";
  const currentFlag = tab === 0 ? data?.team1Flag ?? "" : data?.team2Flag ?? "";

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0a0f0d] transition-colors duration-300 font-sans overflow-x-hidden">
      {/* ── Global Animations ── */}
      <style>{`
        @keyframes playerSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .card-enter {
          animation: cardFadeIn 0.45s ease both;
        }
        @keyframes cardFadeIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .shimmer {
          background: linear-gradient(
            110deg,
            #e8e8e8 8%,
            #f5f5f5 18%,
            #e8e8e8 33%
          );
          background-size: 200% 100%;
          animation: shimmerMove 1.5s linear infinite;
        }
        .dark .shimmer {
          background: linear-gradient(
            110deg,
            #1a2420 8%,
            #222d28 18%,
            #1a2420 33%
          );
          background-size: 200% 100%;
        }
        @keyframes shimmerMove {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Header */}
      <StickyHeader onBack={handleBack} />

      {/* Loading */}
      {loading && !data && <FullSkeleton />}

      {/* Error (no data) */}
      {error && !data && !loading && (
        <ErrorView msg={error} onRetry={fetchSquad} />
      )}

      {/* Content */}
      {data && (
        <main className="max-w-lg mx-auto px-3 sm:px-4 pt-3 pb-12 space-y-4">
          {/* Stale-data warning */}
          {error && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3 text-[12px] text-amber-700 dark:text-amber-400 flex items-center gap-2 card-enter">
              <I.Alert className="h-4 w-4 shrink-0" />
              <span className="break-words flex-1 leading-snug">
                {error} — Showing cached data.
              </span>
            </div>
          )}

          {/* Match Info */}
          <MatchInfoCard d={data} />

          {/* Team Tabs */}
          <TeamTabs
            names={[data.team1Name, data.team2Name]}
            active={tab}
            onChange={setTab}
          />

          {/* Active Team */}
          <TeamBlock
            key={tab}
            players={currentPlayers}
            teamName={currentName}
            teamFlag={currentFlag}
          />

          {/* Bottom safe area for Android gesture nav */}
          <div className="h-8" aria-hidden="true" />
        </main>
      )}
    </div>
  );
}
