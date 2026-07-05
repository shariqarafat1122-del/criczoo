import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  RefreshCw,
  Home,
  Trophy,
  MapPin,
  CalendarDays,
  Clock,
  Zap,
} from "lucide-react";
import CricketSchedule from "./upcoming-series";

/* ─────────────────────────────────────────────
   Interfaces
───────────────────────────────────────────── */
interface TeamScore {
  runs?: number;
  wickets?: number;
  overs?: number;
  balls?: number;
  isDeclared?: boolean;
  isFollowOn?: boolean;
  target?: number;
}

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

/* ─────────────────────────────────────────────
   Helpers
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
    if (d > 0) return `Starts in ${d}d ${h}h`;
    if (h > 0) return `Starts in ${h}h ${m}m`;
    return `Starts in ${m}m`;
  } catch {
    return null;
  }
};

/* ─────────────────────────────────────────────
   State Badge Config
───────────────────────────────────────────── */
interface BadgeCfg {
  bg: string;
  text: string;
  dot?: string;
  label: string;
}

const stateConfig = (state?: string): BadgeCfg => {
  const s = (state || "").toLowerCase();
  if (s.includes("progress") || s === "in progress")
    return {
      bg: "bg-destructive/10",
      text: "text-destructive",
      dot: "bg-destructive",
      label: "LIVE",
    };
  if (s.includes("preview") || s === "preview")
    return {
      bg: "bg-primary/10",
      text: "text-primary",
      label: "Upcoming",
    };
  if (s.includes("complete") || s === "complete")
    return {
      bg: "bg-muted",
      text: "text-muted-foreground",
      label: "Completed",
    };
  if (s.includes("rain"))
    return {
      bg: "bg-accent/15",
      text: "text-accent-foreground",
      label: "Rain",
    };
  if (s.includes("stump"))
    return {
      bg: "bg-secondary",
      text: "text-secondary-foreground",
      label: "Stumps",
    };
  if (s.includes("draw"))
    return {
      bg: "bg-muted",
      text: "text-muted-foreground",
      label: "Draw",
    };
  if (s.includes("cancel") || s.includes("abandon"))
    return {
      bg: "bg-destructive/10",
      text: "text-destructive",
      label: "Cancelled",
    };
  if (s.includes("no result"))
    return {
      bg: "bg-muted",
      text: "text-muted-foreground",
      label: "No Result",
    };
  if (s.includes("toss"))
    return {
      bg: "bg-accent/15",
      text: "text-accent-foreground",
      label: "Toss",
    };
  return {
    bg: "bg-muted",
    text: "text-muted-foreground",
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

/* ─────────────────────────────────────────────
   Format Badge
───────────────────────────────────────────── */
const fmtBadgeCfg = (fmt?: string) => {
  const f = (fmt || "").toUpperCase();
  if (f === "TEST") return "bg-foreground text-background";
  if (f === "ODI") return "bg-primary/10 text-primary";
  if (f.includes("T20") || f === "T20I") return "bg-accent/15 text-accent-foreground";
  return "bg-muted text-muted-foreground";
};

/* ─────────────────────────────────────────────
   Team Logo Component
───────────────────────────────────────────── */
const TeamLogo = React.memo(
  ({ imageId, name }: { imageId?: number; name?: string }) => {
    const [err, setErr] = useState(false);
    const url = imgUrl(imageId);
    const initials = (name || "?")
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 3)
      .toUpperCase();

    if (!url || err) {
      return (
        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-extrabold shadow-premium flex-shrink-0">
          {initials}
        </div>
      );
    }

    return (
      <img
        src={url || "/placeholder.svg"}
        alt={name || ""}
        onError={() => setErr(true)}
        className="w-12 h-12 rounded-full object-contain border border-border bg-card p-0.5 shadow-premium flex-shrink-0"
      />
    );
  }
);
TeamLogo.displayName = "TeamLogo";

/* ─────────────────────────────────────────────
   Score Display Component
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
        <span className="text-xs text-muted-foreground italic">
          Yet to bat
        </span>
      );
    }

    return (
      <div className="flex flex-col gap-0.5">
        {inn1 && (
          <span
            className={`font-bold text-sm ${
              isBatting && !inn2 ? "text-primary" : "text-foreground"
            }`}
          >
            {fmtScore(inn1)}
          </span>
        )}
        {inn2 && (
          <span
            className={`font-bold text-sm ${
              isBatting ? "text-primary" : "text-foreground"
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
const SkeletonCard = () => (
  <div className="bg-card rounded-lg shadow-premium border border-border p-4 animate-pulse">
    <div className="flex items-center justify-between mb-3">
      <div className="h-3 w-32 bg-muted rounded" />
      <div className="h-5 w-12 bg-muted rounded-full" />
    </div>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-muted" />
        <div className="h-4 w-8 bg-muted rounded" />
      </div>
      <div className="h-3 w-6 bg-muted rounded" />
      <div className="flex items-center gap-2">
        <div className="h-4 w-8 bg-muted rounded" />
        <div className="w-10 h-10 rounded-full bg-muted" />
      </div>
    </div>
    <div className="h-3 w-full bg-muted rounded" />
  </div>
);

/* ─────────────────────────────────────────────
   Match Card
───────────────────────────────────────────── */
const MatchCard = React.memo(
  ({
    item,
    onClick,
  }: {
    item: MatchItem;
    onClick: () => void;
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
        className="w-full text-left group bg-card rounded-lg shadow-premium border border-border overflow-hidden hover:shadow-premium-lg hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* Top strip — series + format + state badge */}
        <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-medium text-muted-foreground truncate max-w-[200px]">
              {info?.seriesName || "—"}
            </span>
            {info?.matchDesc && (
              <span className="text-xs text-muted-foreground/50 hidden sm:inline">
                ·
              </span>
            )}
            {info?.matchDesc && (
              <span className="text-xs text-muted-foreground hidden sm:inline truncate max-w-[120px]">
                {info.matchDesc}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {info?.matchFormat && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide ${fmtBadgeCfg(
                  info.matchFormat
                )}`}
              >
                {info.matchFormat.toUpperCase()}
              </span>
            )}
            <span
              className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide ${badge.bg} ${badge.text}`}
            >
              {live && badge.dot && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${badge.dot} animate-live-pulse`}
                />
              )}
              {badge.label}
            </span>
          </div>
        </div>

        {/* Teams + Scores */}
        <div className="px-4 pb-3.5">
          <div className="flex items-center justify-between gap-3">
            {/* Team 1 */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <TeamLogo imageId={team1?.imageId} name={team1?.shortName} />
              <div className="min-w-0">
                <div
                  className={`font-bold text-sm sm:text-base truncate ${
                    isBattingT1 ? "text-primary" : "text-foreground"
                  }`}
                >
                  {team1?.shortName || team1?.name || "—"}
                  {isBattingT1 && (
                    <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-primary align-middle" />
                  )}
                </div>
                <ScoreDisplay
                  teamScore={t1Score}
                  isBatting={isBattingT1}
                />
              </div>
            </div>

            {/* VS */}
            <div className="flex flex-col items-center flex-shrink-0">
              <span className="text-[10px] font-extrabold text-muted-foreground/60 tracking-widest">
                VS
              </span>
            </div>

            {/* Team 2 */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
              <div className="min-w-0 text-right">
                <div
                  className={`font-bold text-sm sm:text-base truncate ${
                    isBattingT2 ? "text-primary" : "text-foreground"
                  }`}
                >
                  {isBattingT2 && (
                    <span className="mr-1.5 inline-block w-1.5 h-1.5 rounded-full bg-primary align-middle" />
                  )}
                  {team2?.shortName || team2?.name || "—"}
                </div>
                <div className="flex justify-end">
                  <ScoreDisplay
                    teamScore={t2Score}
                    isBatting={isBattingT2}
                  />
                </div>
              </div>
              <TeamLogo imageId={team2?.imageId} name={team2?.shortName} />
            </div>
          </div>
        </div>

        {/* Status / Result / Countdown strip */}
        <div
          className={`px-4 py-2.5 border-t border-border ${
            live
              ? "bg-primary/5"
              : complete
              ? "bg-muted/50"
              : preview
              ? "bg-secondary/60"
              : "bg-muted/30"
          }`}
        >
          {info?.status ? (
            <p
              className={`text-xs font-semibold leading-snug line-clamp-2 ${
                live
                  ? "text-primary"
                  : complete
                  ? "text-foreground/80"
                  : "text-muted-foreground"
              }`}
            >
              {info.status}
            </p>
          ) : cd ? (
            <p className="flex items-center gap-1 text-xs font-semibold text-primary">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {cd}
            </p>
          ) : null}

          {/* Venue */}
          {(info?.venueInfo?.name || info?.venueInfo?.city) && (
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1 truncate">
              <MapPin className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
              {[info.venueInfo.name, info.venueInfo.city]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}

          {/* Start date */}
          {preview && startTs && (
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
              <CalendarDays className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
              {tsToDate(startTs)}
            </p>
          )}
        </div>

        {/* Hover accent bottom line */}
        <div className="h-0.5 w-0 group-hover:w-full bg-primary transition-all duration-300" />
      </button>
    );
  }
);
MatchCard.displayName = "MatchCard";

/* ─────────────────────────────────────────────
   Search Bar
───────────────────────────────────────────── */
const SearchBar = React.memo(
  ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div className="relative flex-1 max-w-xs">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
        aria-hidden="true"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search teams, series…"
        className="w-full pl-9 pr-8 py-2 text-sm bg-muted border border-transparent rounded-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-card transition-all"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
);
SearchBar.displayName = "SearchBar";

/* ─────────────────────────────────────────────
   Filter Tab
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
      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-150 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        active
          ? "bg-primary text-primary-foreground shadow-premium"
          : "bg-card text-muted-foreground border border-border hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {label}
      {count > 0 && (
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
            active
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-muted text-muted-foreground"
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
   Bottom Navigation
───────────────────────────────────────────── */
type NavTab = "Home" | "Series";

const BottomNavItem = React.memo(
  ({
    active,
    icon: Icon,
    label,
    onClick,
  }: {
    active: boolean;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors duration-150 focus:outline-none ${
        active
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {active && (
        <span className="absolute top-0 w-8 h-0.5 bg-primary rounded-full" />
      )}
      <Icon
        className={`w-5 h-5 transition-transform ${active ? "scale-110" : ""}`}
      />
      <span
        className={`text-[10px] ${active ? "font-bold" : "font-semibold"}`}
      >
        {label}
      </span>
    </button>
  )
);
BottomNavItem.displayName = "BottomNavItem";

const BottomNav = React.memo(
  ({
    active,
    onChange,
  }: {
    active: NavTab;
    onChange: (t: NavTab) => void;
  }) => (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur border-t border-border shadow-[0_-2px_16px_rgba(16,44,34,0.06)] pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-5xl mx-auto flex items-stretch">
        <BottomNavItem
          active={active === "Home"}
          icon={Home}
          label="Matches"
          onClick={() => onChange("Home")}
        />
        <BottomNavItem
          active={active === "Series"}
          icon={Trophy}
          label="Series"
          onClick={() => onChange("Series")}
        />
      </div>
    </nav>
  )
);
BottomNav.displayName = "BottomNav";

/* ─────────────────────────────────────────────
   Main Home Page
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
  const [activeTab, setActiveTab] = useState<NavTab>("Home");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      if (!res.ok) {
        throw new Error(`API ${res.status}: ${res.statusText}`);
      }
      const json: HomeApiResponse = await res.json();
      setData(json);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load matches"
      );
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

  /* counts per filter */
  const counts = useMemo(() => {
    const c: Record<FilterType, number> = {
      All: allMatches.length,
      Live: 0,
      Upcoming: 0,
      Completed: 0,
    };
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

  /* navigate to scorecard */
  const handleCardClick = useCallback(
    (matchId?: number) => {
      if (!matchId) return;
      navigate(`/live-score/${matchId}`);
    },
    [navigate]
  );

  /* live count for header pulse */
  const liveCount = counts.Live;

  const handleTabChange = useCallback((tab: NavTab) => {
    setActiveTab(tab);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {activeTab === "Series" ? (
        <div className="pb-20">
          <CricketSchedule />
        </div>
      ) : (
        <>
      {/* ─── App Bar ─── */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-premium">
              <Zap className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
            </div>
            <span className="font-extrabold text-foreground text-lg tracking-tight hidden sm:block">
              Cric<span className="text-primary">Zoo</span>
            </span>
          </div>

          {/* Live pulse */}
          {liveCount > 0 && (
            <div className="flex items-center gap-1.5 bg-destructive/10 rounded-full px-2.5 py-1 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-live-pulse" />
              <span className="text-xs font-bold text-destructive">
                {liveCount} Live
              </span>
            </div>
          )}

          {/* Search */}
          <div className="flex-1 min-w-0">
            <SearchBar value={search} onChange={setSearch} />
          </div>

          {/* Last updated */}
          {lastUpdated && (
            <span className="text-[10px] text-muted-foreground flex-shrink-0 hidden md:block">
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
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-muted hover:bg-secondary text-muted-foreground hover:text-primary transition-all disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="max-w-5xl mx-auto px-3 sm:px-4 pb-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
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

      {/* ─── Main ─── */}
      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-5 pb-24">
        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <X className="w-6 h-6 text-destructive" aria-hidden="true" />
            </div>
            <div className="text-center">
              <p className="font-bold text-foreground mb-1">
                Failed to load matches
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {error}
              </p>
              <button
                onClick={() => fetchData(false)}
                className="px-6 py-2.5 bg-primary hover:opacity-90 text-primary-foreground rounded-full text-sm font-bold transition-opacity shadow-premium"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && visible.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
            </div>
            <div className="text-center">
              <p className="font-bold text-foreground mb-1">
                {search
                  ? `No matches found for "${search}"`
                  : filter !== "All"
                  ? `No ${filter.toLowerCase()} matches right now`
                  : "No matches available"}
              </p>
              <p className="text-sm text-muted-foreground">
                {search
                  ? "Try a different search term"
                  : "Check back soon!"}
              </p>
            </div>
            {(search || filter !== "All") && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilter("All");
                }}
                className="px-5 py-2 bg-secondary text-secondary-foreground rounded-full text-sm font-semibold hover:bg-muted transition-colors mt-1"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Cards grid */}
        {!loading && !error && visible.length > 0 && (
          <>
            {/* result count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-muted-foreground">
                {visible.length} match{visible.length !== 1 ? "es" : ""}
                {filter !== "All" ? ` · ${filter}` : ""}
                {search ? ` · "${search}"` : ""}
              </p>
              {refreshing && (
                <span className="text-xs text-primary font-semibold animate-pulse">
                  Refreshing…
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visible.map((match, i) => (
                <MatchCard
                  key={match?.matchInfo?.matchId ?? i}
                  item={match}
                  onClick={() =>
                    handleCardClick(match?.matchInfo?.matchId)
                  }
                />
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        {!loading && (data || error) && (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground pb-4">
            <span>
              {lastUpdated
                ? `Last updated: ${lastUpdated.toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  })}`
                : ""}
            </span>
            {data?.responseLastUpdated && (
              <span>
                API timestamp: {tsToDate(data.responseLastUpdated)}
              </span>
            )}
          </div>
        )}
      </main>
        </>
      )}

      {/* ─── Bottom Navigation ─── */}
      <BottomNav active={activeTab} onChange={handleTabChange} />
    </div>
  );
}
