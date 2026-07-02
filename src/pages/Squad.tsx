

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════ */

interface Player {
  profileId: number | string;
  name: string;
  role?: string;
  captain?: boolean;
  keeper?: boolean;
  image?: string;
  playingXI?: boolean;
}

interface SquadResponse {
  success: boolean;
  team1Name: string;
  team2Name: string;
  team1Flag: string;
  team2Flag: string;
  team1: Player[];
  team2: Player[];
  seriesName?: string;
  venue?: string;
  matchStatus?: string;
  matchDate?: string;
  matchTime?: string;
  matchFormat?: string;
  matchDescription?: string;
}

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════ */

const cx = (...c: (string | false | undefined | null)[]) =>
  c.filter(Boolean).join(" ");

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const getRoleLabel = (role?: string) => {
  if (!role) return "";
  const r = role.toLowerCase();
  if (r.includes("wk") && r.includes("bat")) return "WK-Batter";
  if (r.includes("keeper") && r.includes("bat")) return "WK-Batter";
  if (r.includes("keeper")) return "Wicket Keeper";
  if (r.includes("bat") && r.includes("all")) return "Batting All-rounder";
  if (r.includes("bowl") && r.includes("all")) return "Bowling All-rounder";
  if (r.includes("all")) return "All-rounder";
  if (r.includes("fast") || r.includes("pace")) return "Fast Bowler";
  if (r.includes("spin")) return "Spinner";
  if (r.includes("bowl")) return "Bowler";
  if (r.includes("bat")) return "Batter";
  return role;
};

const getRoleIcon = (role?: string) => {
  if (!role) return "🏏";
  const r = role.toLowerCase();
  if (r.includes("keep") || r.includes("wk")) return "🧤";
  if (r.includes("all")) return "🏏";
  if (r.includes("spin")) return "🌀";
  if (r.includes("fast") || r.includes("pace") || r.includes("bowl")) return "⚾";
  return "🏏";
};

/* ═══════════════════════════════════════════════════════════════════
   ICONS (inline SVG)
   ═══════════════════════════════════════════════════════════════════ */

const Icons = {
  Back: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  ),
  Share: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
    </svg>
  ),
  Users: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
    </svg>
  ),
  Pin: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" /><circle cx="12" cy="10" r="2.4" />
    </svg>
  ),
  Calendar: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  Shield: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  ),
  Alert: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v4M12 17h.01M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  ),
  Refresh: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 15.3-6.4L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.3 6.4L3 16M3 21v-5h5" />
    </svg>
  ),
  Bat: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 3.5 20.5 9.5" /><path d="M9 9 3 15a2.5 2.5 0 0 0 3.5 3.5L12 13" />
      <path d="M12.5 5.5 18.5 11.5 14 16 8 10Z" />
    </svg>
  ),
  Bench: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="4" rx="1" /><path d="M4 10v7M20 10v7M8 10v4M16 10v4" />
    </svg>
  ),
};

/* ═══════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ═══════════════════════════════════════════════════════════════════ */

const T = {
  card: "bg-white dark:bg-[#111815] rounded-2xl sm:rounded-3xl shadow-[0_1px_8px_-3px_rgba(15,23,20,0.08)] dark:shadow-[0_1px_16px_-6px_rgba(0,0,0,0.45)] border border-black/[0.04] dark:border-white/[0.06] overflow-hidden w-full",
  sectionBar: "flex items-center gap-2.5 px-4 sm:px-5 py-3 bg-gradient-to-r from-[#009270]/[0.06] via-[#009270]/[0.02] to-transparent dark:from-[#12b985]/[0.09] dark:via-[#12b985]/[0.03] dark:to-transparent border-b border-black/[0.04] dark:border-white/[0.05]",
  sectionTitle: "text-[11px] sm:text-[11.5px] font-bold text-[#00734f] dark:text-[#3ddba4] uppercase tracking-[0.08em]",
  accentBar: "w-1 h-5 rounded-full bg-gradient-to-b from-[#00b884] to-[#009270] dark:from-[#3ddba4] dark:to-[#12b985] flex-shrink-0",
  badge: "inline-flex items-center justify-center px-2 py-[2px] rounded-md text-[10px] font-bold leading-none",
};

/* ═══════════════════════════════════════════════════════════════════
   LAZY IMAGE with intersection observer
   ═══════════════════════════════════════════════════════════════════ */

const LazyImage: React.FC<{
  src?: string;
  alt: string;
  size: number;
  fallback: string;
  className?: string;
}> = ({ src, alt, size, fallback, className }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const showFallback = !src || error || !inView;

  return (
    <div
      ref={ref}
      className={cx(
        "relative rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-black/[0.06] dark:border-white/10 shadow-sm",
        className
      )}
      style={{ width: size, height: size }}
    >
      {showFallback ? (
        <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600 font-bold text-sm select-none">
          {fallback}
        </div>
      ) : (
        <>
          {!loaded && (
            <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-full" />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className={cx(
              "w-full h-full object-cover transition-opacity duration-300",
              loaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            loading="lazy"
          />
        </>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   SKELETON LOADER
   ═══════════════════════════════════════════════════════════════════ */

const SkeletonPulse = ({ className }: { className?: string }) => (
  <div className={cx("bg-gray-200/80 dark:bg-gray-800 rounded-full animate-pulse", className)} />
);

const PlayerSkeleton = ({ imgSize = 48 }: { imgSize?: number }) => (
  <div className="flex items-center gap-3.5 px-4 py-3.5">
    <div
      className="rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse flex-shrink-0"
      style={{ width: imgSize, height: imgSize }}
    />
    <div className="flex-1 space-y-2">
      <SkeletonPulse className="h-4 w-3/5" />
      <SkeletonPulse className="h-3 w-2/5" />
    </div>
    <SkeletonPulse className="h-5 w-8" />
  </div>
);

const FullSkeleton = () => (
  <div className="max-w-lg mx-auto px-3 sm:px-4 py-4 space-y-4 animate-pulse">
    {/* Match card skeleton */}
    <div className={T.card}>
      <div className="px-5 py-6 flex flex-col items-center gap-3">
        <div className="flex items-center gap-6">
          <SkeletonPulse className="h-12 w-12 !rounded-full" />
          <SkeletonPulse className="h-7 w-7 !rounded-full" />
          <SkeletonPulse className="h-12 w-12 !rounded-full" />
        </div>
        <SkeletonPulse className="h-3 w-48" />
        <SkeletonPulse className="h-3 w-32" />
      </div>
    </div>
    {/* Tab skeleton */}
    <SkeletonPulse className="h-11 w-full !rounded-xl" />
    {/* Players skeleton */}
    <div className={T.card}>
      <div className="px-4 py-3 flex items-center gap-2">
        <SkeletonPulse className="h-5 w-1 !rounded-full" />
        <SkeletonPulse className="h-4 w-24" />
      </div>
      <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
        {[...Array(6)].map((_, i) => (
          <PlayerSkeleton key={i} />
        ))}
      </div>
    </div>
    <div className={T.card}>
      <div className="px-4 py-3 flex items-center gap-2">
        <SkeletonPulse className="h-5 w-1 !rounded-full" />
        <SkeletonPulse className="h-4 w-32" />
      </div>
      {[...Array(3)].map((_, i) => (
        <PlayerSkeleton key={i} imgSize={40} />
      ))}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   ERROR STATE
   ═══════════════════════════════════════════════════════════════════ */

const ErrorStateView: React.FC<{ msg: string; onRetry: () => void }> = ({
  msg,
  onRetry,
}) => (
  <div className="max-w-lg mx-auto px-4 py-20 flex flex-col items-center gap-5">
    {/* Illustration */}
    <div className="relative">
      <div className="h-28 w-28 rounded-full bg-red-50 dark:bg-red-900/15 flex items-center justify-center">
        <div className="h-20 w-20 rounded-full bg-red-100/80 dark:bg-red-900/25 flex items-center justify-center">
          <Icons.Alert className="h-10 w-10 text-red-400 dark:text-red-500" />
        </div>
      </div>
      <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white dark:bg-[#111815] border-2 border-red-200 dark:border-red-800 flex items-center justify-center">
        <Icons.Bat className="h-4 w-4 text-red-400" />
      </div>
    </div>

    <div className="text-center space-y-2">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
        Unable to Load Squad
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
        {msg || "Please check your internet connection and try again."}
      </p>
    </div>

    <button
      onClick={onRetry}
      className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#00b884] to-[#009270] text-white rounded-full text-sm font-bold hover:brightness-105 active:scale-95 transition-all duration-200 shadow-md shadow-[#009270]/25"
    >
      <Icons.Refresh className="h-4 w-4" />
      Retry
    </button>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════════════════════════════ */

const EmptyState = () => (
  <div className="max-w-lg mx-auto px-4 py-20 flex flex-col items-center gap-5">
    <div className="h-28 w-28 rounded-full bg-gray-100 dark:bg-gray-800/50 flex items-center justify-center">
      <div className="h-20 w-20 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
        <Icons.Bat className="h-10 w-10 text-gray-300 dark:text-gray-600" />
      </div>
    </div>
    <div className="text-center space-y-1.5">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
        No Squad Available
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Squad details will appear here once announced.
      </p>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   STICKY HEADER
   ═══════════════════════════════════════════════════════════════════ */

const StickyHeader: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cx(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-white/90 dark:bg-[#0a0f0d]/90 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:shadow-[0_1px_0_rgba(255,255,255,0.04)]"
          : "bg-white dark:bg-[#0a0f0d]"
      )}
    >
      <div className="max-w-lg mx-auto flex items-center justify-between px-2 sm:px-3 h-14">
        <button
          onClick={onBack}
          className="h-10 w-10 rounded-xl flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] active:scale-95 transition-all duration-200"
          aria-label="Go back"
        >
          <Icons.Back className="h-5 w-5" />
        </button>

        <h1 className="text-[15px] font-bold text-gray-900 dark:text-white tracking-tight">
          Squads
        </h1>

        <button
          className="h-10 w-10 rounded-xl flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] active:scale-95 transition-all duration-200"
          aria-label="Share"
        >
          <Icons.Share className="h-5 w-5" />
        </button>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-black/[0.06] dark:via-white/[0.06] to-transparent" />
    </header>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   MATCH INFO CARD
   ═══════════════════════════════════════════════════════════════════ */

const MatchInfoCard: React.FC<{
  data: SquadResponse;
}> = ({ data }) => (
  <div className={T.card}>
    {/* Teams */}
    <div className="px-4 sm:px-5 pt-5 pb-4">
      <div className="flex items-center justify-center gap-4 sm:gap-6">
        {/* Team 1 */}
        <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
          <LazyImage
            src={data.team1Flag}
            alt={data.team1Name}
            size={52}
            fallback={getInitials(data.team1Name)}
            className="!border-2"
          />
          <span className="text-sm sm:text-[15px] font-extrabold text-gray-900 dark:text-white text-center leading-tight">
            {data.team1Name}
          </span>
        </div>

        {/* VS */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <span className="h-9 w-9 rounded-full bg-gradient-to-br from-[#00b884] to-[#009270] flex items-center justify-center text-white text-[11px] font-black shadow-md shadow-[#009270]/25">
            VS
          </span>
        </div>

        {/* Team 2 */}
        <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
          <LazyImage
            src={data.team2Flag}
            alt={data.team2Name}
            size={52}
            fallback={getInitials(data.team2Name)}
            className="!border-2"
          />
          <span className="text-sm sm:text-[15px] font-extrabold text-gray-900 dark:text-white text-center leading-tight">
            {data.team2Name}
          </span>
        </div>
      </div>
    </div>

    {/* Meta info */}
    <div className="border-t border-black/[0.04] dark:border-white/[0.05] bg-gray-50/50 dark:bg-white/[0.015] px-4 sm:px-5 py-3 space-y-1.5">
      {data.seriesName && (
        <div className="flex items-center gap-2 justify-center">
          <Icons.Shield className="h-3 w-3 text-[#009270] dark:text-[#3ddba4] flex-shrink-0" />
          <span className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 font-semibold text-center truncate">
            {data.seriesName}
          </span>
        </div>
      )}
      {data.venue && (
        <div className="flex items-center gap-2 justify-center">
          <Icons.Pin className="h-3 w-3 text-gray-400 flex-shrink-0" />
          <span className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-500 text-center truncate">
            {data.venue}
          </span>
        </div>
      )}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {data.matchDate && (
          <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500">
            <Icons.Calendar className="h-3 w-3" />
            {data.matchDate}
            {data.matchTime ? ` · ${data.matchTime}` : ""}
          </span>
        )}
        {data.matchFormat && (
          <span className="text-[10px] font-bold text-white bg-gradient-to-r from-[#00b884] to-[#009270] px-2 py-0.5 rounded-full">
            {data.matchFormat}
          </span>
        )}
      </div>
      {data.matchStatus && (
        <div className="flex justify-center pt-0.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#00734f] dark:text-[#3ddba4] bg-[#009270]/[0.08] dark:bg-[#3ddba4]/[0.08] px-2.5 py-1 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-[#009270] dark:bg-[#3ddba4]" />
            {data.matchStatus}
          </span>
        </div>
      )}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   TEAM TABS (Segmented Control)
   ═══════════════════════════════════════════════════════════════════ */

const TeamTabs: React.FC<{
  team1Name: string;
  team2Name: string;
  active: 0 | 1;
  onChange: (tab: 0 | 1) => void;
}> = ({ team1Name, team2Name, active, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="relative flex p-1 bg-gray-200/70 dark:bg-white/[0.06] rounded-xl overflow-hidden"
    >
      {/* Animated slider */}
      <div
        className="absolute top-1 bottom-1 rounded-[10px] bg-gradient-to-r from-[#00b884] to-[#009270] shadow-md shadow-[#009270]/20 transition-all duration-350 ease-[cubic-bezier(0.4,0,0.2,1)] z-0"
        style={{
          width: "calc(50% - 4px)",
          left: active === 0 ? 4 : "calc(50% + 0px)",
        }}
      />
      {[team1Name, team2Name].map((name, i) => (
        <button
          key={i}
          onClick={() => onChange(i as 0 | 1)}
          className={cx(
            "relative z-10 flex-1 py-2.5 text-[12px] sm:text-[13px] font-bold rounded-[10px] transition-colors duration-300 truncate px-2",
            active === i
              ? "text-white"
              : "text-gray-600 dark:text-gray-400"
          )}
        >
          {name}
        </button>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   PLAYER CARD
   ═══════════════════════════════════════════════════════════════════ */

const PlayerCard: React.FC<{
  player: Player;
  index: number;
  compact?: boolean;
}> = ({ player, index, compact = false }) => {
  const imgSize = compact ? 40 : 48;
  const roleLabel = getRoleLabel(player.role);
  const roleIcon = getRoleIcon(player.role);

  return (
    <div
      className={cx(
        "flex items-center gap-3 sm:gap-3.5 px-4 py-3 transition-all duration-250 hover:bg-[#009270]/[0.03] dark:hover:bg-[#3ddba4]/[0.04] active:scale-[0.995] cursor-default group",
        index > 0 && "border-t border-gray-50 dark:border-white/[0.04]"
      )}
      style={{
        animationDelay: `${index * 40}ms`,
        animation: "fadeSlideUp 0.4s ease both",
      }}
    >
      {/* Image */}
      <div className="relative flex-shrink-0">
        <LazyImage
          src={player.image}
          alt={player.name}
          size={imgSize}
          fallback={getInitials(player.name)}
        />
        {/* Playing XI dot */}
        {player.playingXI !== false && !compact && (
          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-white dark:bg-[#111815] flex items-center justify-center shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#009270] dark:bg-[#3ddba4]" />
          </span>
        )}
      </div>

      {/* Name & Role */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={cx(
              "font-semibold text-gray-900 dark:text-white truncate",
              compact ? "text-[13px]" : "text-[14px] sm:text-[15px]"
            )}
          >
            {player.name}
          </span>
        </div>
        {roleLabel && (
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[11px] leading-none">{roleIcon}</span>
            <span
              className={cx(
                "text-gray-500 dark:text-gray-400 truncate",
                compact ? "text-[11px]" : "text-[12px] sm:text-[13px]"
              )}
            >
              {roleLabel}
            </span>
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {player.captain && (
          <span
            className={cx(
              T.badge,
              "bg-[#009270]/10 text-[#00734f] dark:bg-[#3ddba4]/15 dark:text-[#3ddba4] border border-[#009270]/20 dark:border-[#3ddba4]/20"
            )}
          >
            C
          </span>
        )}
        {player.keeper && (
          <span
            className={cx(
              T.badge,
              "bg-blue-50 text-blue-600 dark:bg-blue-900/25 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40"
            )}
          >
            WK
          </span>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   PLAYER LIST SECTION
   ═══════════════════════════════════════════════════════════════════ */

const PlayerSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  players: Player[];
  compact?: boolean;
  count?: number;
}> = ({ title, icon, players, compact = false, count }) => {
  if (!players.length) return null;

  return (
    <div className={T.card}>
      <div className={T.sectionBar}>
        <span className={T.accentBar} />
        <span className="text-[#009270] dark:text-[#3ddba4]">{icon}</span>
        <span className={T.sectionTitle}>{title}</span>
        {count !== undefined && (
          <span className="ml-auto text-[10px] font-bold text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-full tabular-nums">
            {count}
          </span>
        )}
      </div>
      <div>
        {players.map((player, i) => (
          <PlayerCard
            key={player.profileId}
            player={player}
            index={i}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   TEAM SECTION (Playing XI + Bench)
   ═══════════════════════════════════════════════════════════════════ */

const TeamSection: React.FC<{
  players: Player[];
  teamName: string;
  teamFlag: string;
}> = ({ players, teamName, teamFlag }) => {
  // Separate playing XI and bench
  const playingXI = players.filter((p) => p.playingXI !== false);
  const bench = players.filter((p) => p.playingXI === false);

  // If no playingXI flag exists, treat first 11 as XI and rest as bench
  const hasPlayingXIFlag = players.some((p) => p.playingXI === true);
  const finalXI = hasPlayingXIFlag
    ? playingXI
    : players.slice(0, 11);
  const finalBench = hasPlayingXIFlag
    ? bench
    : players.slice(11);

  if (!players.length) return <EmptyState />;

  return (
    <div className="space-y-4 animate-[fadeSlideUp_0.35s_ease]">
      {/* Team header */}
      <div className="flex items-center gap-3 px-1">
        <LazyImage
          src={teamFlag}
          alt={teamName}
          size={32}
          fallback={getInitials(teamName)}
        />
        <div>
          <div className="text-[15px] font-extrabold text-gray-900 dark:text-white tracking-tight">
            {teamName}
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400">
            {players.length} Players
          </div>
        </div>
      </div>

      {/* Playing XI */}
      <PlayerSection
        title="Playing XI"
        icon={<Icons.Users className="h-4 w-4" />}
        players={finalXI}
        count={finalXI.length}
      />

      {/* Bench */}
      {finalBench.length > 0 && (
        <PlayerSection
          title="Bench Players"
          icon={<Icons.Bench className="h-4 w-4" />}
          players={finalBench}
          compact
          count={finalBench.length}
        />
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════ */

export default function SquadPage() {
  const params = useParams();
  const navigate = useNavigate();
  const matchId = params?.matchId as string | undefined;

  const [data, setData] = useState<SquadResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<0 | 1>(0);

  const fetchData = useCallback(async () => {
    if (!matchId) {
      setError("No match ID provided");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/score/squad?matchId=${matchId}`, {
        cache: "no-store",
      });
      if (!res.ok)
        throw new Error(`API returned ${res.status}: ${res.statusText || "Unknown error"}`);
      const json: SquadResponse = await res.json();
      if (!json.success) throw new Error("Failed to load squad data");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch squad");
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

   const handleBack = useCallback(() => {
     if (window.history.length > 1) {
     navigate(-1);
 } else {
    navigate("/", { replace: true });
  }
}, [navigate]);

  const handleTabChange = useCallback((tab: 0 | 1) => {
    setActiveTab(tab);
  }, []);

  const currentPlayers =
    activeTab === 0 ? data?.team1 ?? [] : data?.team2 ?? [];
  const currentTeamName =
    activeTab === 0 ? data?.team1Name ?? "" : data?.team2Name ?? "";
  const currentTeamFlag =
    activeTab === 0 ? data?.team1Flag ?? "" : data?.team2Flag ?? "";

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0a0f0d] transition-colors duration-300 font-sans overflow-x-hidden">
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Header */}
      <StickyHeader onBack={handleBack} />

      {/* Loading */}
      {loading && !data && <FullSkeleton />}

      {/* Error */}
      {error && !data && !loading && (
        <ErrorStateView msg={error} onRetry={fetchData} />
      )}

      {/* Content */}
      {data && (
        <main className="max-w-lg mx-auto px-3 sm:px-4 py-4 pb-10 space-y-4">
          {/* Stale data warning */}
          {error && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <Icons.Alert className="h-4 w-4 shrink-0" />
              <span className="break-words flex-1">{error} — Showing cached data.</span>
            </div>
          )}

          {/* Match Info */}
          <MatchInfoCard data={data} />

          {/* Team Tabs */}
          <TeamTabs
            team1Name={data.team1Name}
            team2Name={data.team2Name}
            active={activeTab}
            onChange={handleTabChange}
          />

          {/* Team Section */}
          <TeamSection
            key={activeTab}
            players={currentPlayers}
            teamName={currentTeamName}
            teamFlag={currentTeamFlag}
          />

          {/* Bottom safe area */}
          <div className="h-6" />
        </main>
      )}
    </div>
  );
}
