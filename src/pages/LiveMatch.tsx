import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useParams } from "react-router-dom";

/* ═════════════════════════════════════════════════════════════════════
   TYPES
   ═════════════════════════════════════════════════════════════════════ */

interface BatsmanInfo {
  batName?: string;
  batRuns?: number;
  batBalls?: number;
}

interface BowlerInfo {
  bowlName?: string;
  bowlWkts?: number;
  bowlRuns?: number;
  bowlOvs?: number;
}

interface MiniScore {
  status?: string;
  overs?: number;
  currentRunRate?: number;
  target?: number;
  event?: string;

  // IMPORTANT: These are optional. Never assume available.
  batsmanStriker?: BatsmanInfo | null;
  batsmanNonStriker?: BatsmanInfo | null;
  bowlerStriker?: BowlerInfo | null;

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
    startTime?: number | string;
    startTimestamp?: number | string;
    matchStartTimestamp?: number | string;
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
  matchHeader?: any;
  matchInfo?: any;
  [key: string]: any;
}

interface TeamMeta {
  name: string;
  shortName: string;
  country?: string;
  imageUrl?: string;
  imageId?: number;
  flagUrl?: string;
}

interface VenueMeta {
  ground?: string;
  city?: string;
  country?: string;
  timezone?: string;
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

const firstDefined = (...values: any[]) =>
  values.find(
    (v) =>
      v !== undefined &&
      v !== null &&
      !(typeof v === "string" && v.trim() === "")
  );

const normalizeTimestamp = (value: any): number | undefined => {
  const raw = firstDefined(value);
  if (raw === undefined) return undefined;

  const n =
    typeof raw === "string"
      ? Number(raw.replace(/[^\d]/g, ""))
      : Number(raw);

  if (!Number.isFinite(n) || n <= 0) return undefined;

  // 10 digit timestamps are seconds, 13 digit are milliseconds.
  return n < 10_000_000_000 ? n * 1000 : n;
};

const isPreviewState = (state?: string) => {
  const s = String(state || "").toLowerCase();
  return (
    s === "preview" ||
    s.includes("preview") ||
    s.includes("upcoming") ||
    s.includes("pre-match") ||
    s.includes("prematch")
  );
};

const isCompleteState = (state?: string) =>
  String(state || "").toLowerCase().includes("complete");

const hasBatsmanData = (b?: BatsmanInfo | null) =>
  Boolean(b?.batName && b.batName.trim());

const hasBowlerData = (b?: BowlerInfo | null) =>
  Boolean(b?.bowlName && b.bowlName.trim());

const getMatchState = (data?: LiveScoreResponse | null, ms?: MiniScore) =>
  firstDefined(
    ms?.matchScoreDetails?.state,
    data?.matchHeader?.state,
    data?.matchInfo?.state,
    data?.state
  );

const getMatchFormat = (data?: LiveScoreResponse | null, ms?: MiniScore) =>
  firstDefined(
    ms?.matchScoreDetails?.matchFormat,
    data?.matchHeader?.matchFormat,
    data?.matchInfo?.matchFormat,
    data?.matchFormat
  );

const formatGmtStart = (ts?: number) => {
  if (!ts) return "Schedule TBA";

  const d = new Date(ts);

  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  });

  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });

  return `${date}, ${time} GMT`;
};

const formatDateOnly = (ts?: number) => {
  if (!ts) return "TBA";
  return new Date(ts).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const formatVenueLocal = (ts?: number, timezone?: string) => {
  if (!ts) return "TBA";

  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone || "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).format(new Date(ts));
  } catch {
    return formatGmtStart(ts);
  }
};

const formatUserLocal = (ts?: number) => {
  if (!ts) return "TBA";

  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getAvatarUrl = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "Team"
  )}&background=009270&color=ffffff&bold=true`;

const inferCountry = (name?: string) => {
  const n = String(name || "").toLowerCase();

  if (n.includes("india")) return "India";
  if (n.includes("england")) return "England";
  if (n.includes("sri lanka")) return "Sri Lanka";
  if (n.includes("australia")) return "Australia";
  if (n.includes("pakistan")) return "Pakistan";
  if (n.includes("south africa")) return "South Africa";
  if (n.includes("new zealand")) return "New Zealand";
  if (n.includes("bangladesh")) return "Bangladesh";
  if (n.includes("afghanistan")) return "Afghanistan";
  if (n.includes("west indies")) return "West Indies";
  if (n.includes("usa") || n.includes("united states")) return "United States";
  if (n.includes("ireland")) return "Ireland";
  if (n.includes("zimbabwe")) return "Zimbabwe";
  if (n.includes("nepal")) return "Nepal";
  if (n.includes("netherlands")) return "Netherlands";
  if (n.includes("scotland")) return "Scotland";
  if (n.includes("uae")) return "UAE";

  return undefined;
};

const countryToFlag = (country?: string) => {
  const c = String(country || "").toLowerCase();

  if (c.includes("india")) return "🇮🇳";
  if (c.includes("england")) return "🏴";
  if (c.includes("sri lanka")) return "🇱🇰";
  if (c.includes("australia")) return "🇦🇺";
  if (c.includes("pakistan")) return "🇵🇰";
  if (c.includes("south africa")) return "🇿🇦";
  if (c.includes("new zealand")) return "🇳🇿";
  if (c.includes("bangladesh")) return "🇧🇩";
  if (c.includes("afghanistan")) return "🇦🇫";
  if (c.includes("west indies")) return "🌴";
  if (c.includes("united states") || c.includes("usa")) return "🇺🇸";
  if (c.includes("ireland")) return "🇮🇪";
  if (c.includes("zimbabwe")) return "🇿🇼";
  if (c.includes("nepal")) return "🇳🇵";
  if (c.includes("netherlands")) return "🇳🇱";
  if (c.includes("scotland")) return "🏴󠁧󠁢󠁳󠁣󠁴󠁿";
  if (c.includes("uae")) return "🇦🇪";

  return "🏳️";
};

const normalizeTeam = (
  team: any,
  fallback?: { teamName?: string; teamSName?: string },
  label = "Team"
): TeamMeta => {
  const name = firstDefined(
    team?.teamName,
    team?.name,
    team?.fullName,
    fallback?.teamName,
    label
  );

  const shortName = firstDefined(
    team?.teamSName,
    team?.shortName,
    team?.sName,
    fallback?.teamSName,
    name
  );

  const country = firstDefined(
    team?.country,
    team?.countryName,
    inferCountry(name)
  );

  return {
    name,
    shortName,
    country,
    imageUrl: firstDefined(
      team?.imageUrl,
      team?.teamImageUrl,
      team?.logo,
      team?.logoUrl
    ),
    imageId: firstDefined(team?.imageId, team?.teamImageId),
    flagUrl: firstDefined(team?.flagUrl, team?.countryFlag),
  };
};

const getPreMatchMeta = (data?: LiveScoreResponse | null, ms?: MiniScore) => {
  const root: any = data || {};
  const header = root.matchHeader || root.matchInfo || {};
  const details = ms?.matchScoreDetails || {};

  const startMs = normalizeTimestamp(
    firstDefined(
      header?.startTime,
      header?.startTimestamp,
      header?.matchStartTimestamp,
      root?.startTime,
      root?.startTimestamp,
      root?.matchStartTimestamp,
      details?.startTime,
      details?.startTimestamp,
      details?.matchStartTimestamp
    )
  );

  const venueRaw =
    header?.venueInfo ||
    header?.venue ||
    root?.venueInfo ||
    root?.venue ||
    {};

  const team1Raw =
    header?.team1 ||
    root?.team1 ||
    root?.matchInfo?.team1 ||
    root?.matchHeader?.team1;

  const team2Raw =
    header?.team2 ||
    root?.team2 ||
    root?.matchInfo?.team2 ||
    root?.matchHeader?.team2;

  const venue: VenueMeta = {
    ground: firstDefined(
      venueRaw?.ground,
      venueRaw?.name,
      venueRaw?.venue,
      venueRaw?.groundName
    ),
    city: firstDefined(venueRaw?.city, venueRaw?.location),
    country: firstDefined(venueRaw?.country),
    timezone: firstDefined(venueRaw?.timezone, venueRaw?.timeZone),
  };

  return {
    seriesName: firstDefined(
      header?.seriesName,
      header?.seriesDesc,
      root?.seriesName,
      root?.matchInfo?.seriesName,
      "Series TBA"
    ),
    matchDesc: firstDefined(
      header?.matchDescription,
      header?.matchDesc,
      root?.matchDesc,
      root?.matchInfo?.matchDesc,
      "Match details TBA"
    ),
    format: firstDefined(getMatchFormat(data, ms), "TBA"),
    startMs,
    venue,
    team1: normalizeTeam(team1Raw, undefined, "Team 1"),
    team2: normalizeTeam(team2Raw, undefined, "Team 2"),
  };
};

/* ═════════════════════════════════════════════════════════════════════
   COUNTDOWN
   ═════════════════════════════════════════════════════════════════════ */

const getRemainingSeconds = (targetMs?: number) => {
  if (!targetMs) return undefined;
  return Math.max(0, Math.floor((targetMs - Date.now()) / 1000));
};

const splitTime = (totalSeconds: number) => {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
};

const pad2 = (n: number) => String(n).padStart(2, "0");

const getCountdownUnits = (totalSeconds: number) => {
  const t = splitTime(totalSeconds);

  if (t.days > 0) {
    return [
      { label: "Days", value: pad2(t.days) },
      { label: "Hours", value: pad2(t.hours) },
      { label: "Minutes", value: pad2(t.minutes) },
      { label: "Seconds", value: pad2(t.seconds) },
    ];
  }

  if (t.hours > 0) {
    return [
      { label: "Hours", value: pad2(t.hours) },
      { label: "Minutes", value: pad2(t.minutes) },
      { label: "Seconds", value: pad2(t.seconds) },
    ];
  }

  if (t.minutes > 0) {
    return [
      { label: "Minutes", value: pad2(t.minutes) },
      { label: "Seconds", value: pad2(t.seconds) },
    ];
  }

  return [{ label: "Seconds", value: pad2(t.seconds) }];
};

const getShortCountdown = (totalSeconds?: number) => {
  if (totalSeconds === undefined) return "TBA";

  const t = splitTime(totalSeconds);

  if (t.days > 0) return `${t.days}d ${t.hours}h`;
  if (t.hours > 0) return `${pad2(t.hours)}h ${pad2(t.minutes)}m`;
  if (t.minutes > 0) return `${t.minutes}m ${t.seconds}s`;
  return `${t.seconds}s`;
};

const useCountdown = (targetMs?: number, onZero?: () => void) => {
  const [secondsLeft, setSecondsLeft] = useState<number | undefined>(() =>
    getRemainingSeconds(targetMs)
  );

  const zeroTriggeredRef = useRef(false);
  const onZeroRef = useRef(onZero);

  useEffect(() => {
    onZeroRef.current = onZero;
  }, [onZero]);

  useEffect(() => {
    zeroTriggeredRef.current = false;
    setSecondsLeft(getRemainingSeconds(targetMs));

    if (!targetMs) return;

    const timer = window.setInterval(() => {
      const next = getRemainingSeconds(targetMs);
      setSecondsLeft(next);

      if (next !== undefined && next <= 0) {
        window.clearInterval(timer);

        if (!zeroTriggeredRef.current) {
          zeroTriggeredRef.current = true;
          onZeroRef.current?.();
        }
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [targetMs]);

  return secondsLeft;
};

/* ═════════════════════════════════════════════════════════════════════
   ICONS
   ═════════════════════════════════════════════════════════════════════ */

const Icon = {
  Bat: (p: { className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={p.className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 3.5 20.5 9.5" />
      <path d="M9 9 3 15a2.5 2.5 0 0 0 3.5 3.5L12 13" />
      <path d="M12.5 5.5 18.5 11.5 14 16 8 10Z" />
    </svg>
  ),
  Ball: (p: { className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={p.className}
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3c2 3 2 15 0 18M4 8c3-1 13-1 16 0M4 16c3 1 13 1 16 0" />
    </svg>
  ),
  Target: (p: { className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={p.className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  ),
  Zap: (p: { className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={p.className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  ),
  Link: (p: { className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={p.className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 17H7a5 5 0 0 1 0-10h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8" />
    </svg>
  ),
  Activity: (p: { className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={p.className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  Refresh: (p: { className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={p.className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 15.3-6.4L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.3 6.4L3 16M3 21v-5h5" />
    </svg>
  ),
  Sun: (p: { className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={p.className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  Moon: (p: { className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={p.className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  ),
  Alert: (p: { className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={p.className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 9v4M12 17h.01M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  ),
  Fall: (p: { className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={p.className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v14M12 16l-4-4M12 16l4-4M5 21h14" />
    </svg>
  ),
};

/* ═════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ═════════════════════════════════════════════════════════════════════ */

const card =
  "bg-white dark:bg-[#111815] rounded-3xl shadow-[0_2px_10px_-4px_rgba(15,23,20,0.08)] dark:shadow-[0_2px_20px_-8px_rgba(0,0,0,0.5)] border border-black/[0.04] dark:border-white/[0.06] overflow-hidden transition-shadow duration-300 hover:shadow-[0_8px_24px_-8px_rgba(15,23,20,0.12)] dark:hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.6)] w-full";

const glassCard =
  "rounded-3xl bg-white/80 dark:bg-[#101815]/75 backdrop-blur-xl border border-white/70 dark:border-white/[0.07] shadow-[0_16px_44px_-28px_rgba(0,0,0,0.45)] overflow-hidden";

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
   SKELETON / ERROR
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
          <div
            key={j}
            className="h-4 bg-gray-100 dark:bg-gray-800/60 rounded-full"
          />
        ))}
      </div>
    </div>

    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="bg-white dark:bg-[#111815] rounded-3xl p-5 border border-black/[0.04] dark:border-white/[0.06]"
      >
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full w-40 mb-5" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 bg-gray-100 dark:bg-gray-800/60 rounded-2xl" />
          <div className="h-24 bg-gray-100 dark:bg-gray-800/60 rounded-2xl" />
        </div>
      </div>
    ))}
  </div>
);

const ErrorState = ({ msg, onRetry }: { msg: string; onRetry: () => void }) => (
  <div className="max-w-2xl mx-auto px-3 py-16 flex flex-col items-center gap-4">
    <div className="h-14 w-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
      <Icon.Alert className="h-7 w-7" />
    </div>
    <p className="text-gray-600 dark:text-gray-400 text-center text-sm max-w-sm">
      {msg}
    </p>
    <button
      onClick={onRetry}
      className="px-5 py-2 bg-gradient-to-r from-[#00b884] to-[#009270] text-white rounded-full text-sm font-bold hover:brightness-105 active:scale-95 transition-all duration-200 shadow-sm shadow-[#009270]/30"
    >
      Retry
    </button>
  </div>
);

/* ═════════════════════════════════════════════════════════════════════
   PRE MATCH UI
   ═════════════════════════════════════════════════════════════════════ */

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) => (
  <div className="flex items-start justify-between gap-4 py-3 border-b border-black/[0.04] dark:border-white/[0.06] last:border-b-0">
    <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
      {label}
    </span>
    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 text-right break-words">
      {value || "TBA"}
    </span>
  </div>
);

const TeamLogo = ({ team }: { team: TeamMeta }) => (
  <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-white to-gray-100 dark:from-white/[0.08] dark:to-white/[0.02] border border-black/[0.05] dark:border-white/[0.08] shadow-lg shadow-black/5 overflow-hidden flex items-center justify-center">
    <img
      src={team.imageUrl || getAvatarUrl(team.shortName || team.name)}
      alt={team.name}
      className="h-full w-full object-cover"
      onError={(e) => {
        e.currentTarget.src = getAvatarUrl(team.shortName || team.name);
      }}
    />
  </div>
);

const TeamPremiumCard = ({ team }: { team: TeamMeta }) => (
  <div className="relative rounded-3xl bg-white/75 dark:bg-white/[0.035] backdrop-blur-xl border border-black/[0.04] dark:border-white/[0.07] p-4 flex flex-col items-center text-center min-w-0 overflow-hidden">
    <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#009270]/10 to-transparent" />

    <div className="relative mb-3">
      <TeamLogo team={team} />

      <div className="absolute -right-1 -bottom-1 h-8 w-8 rounded-full bg-white dark:bg-[#111815] border border-black/[0.06] dark:border-white/[0.08] shadow flex items-center justify-center text-lg">
        {team.flagUrl ? (
          <img
            src={team.flagUrl}
            alt={team.country || "Flag"}
            className="h-5 w-5 rounded-full object-cover"
          />
        ) : (
          countryToFlag(team.country || team.name)
        )}
      </div>
    </div>

    <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white truncate max-w-full">
      {team.name}
    </h3>

    <p className="mt-1 text-xs font-bold text-[#009270] dark:text-[#3ddba4] uppercase tracking-wider">
      {team.shortName}
    </p>

    {team.country && (
      <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
        {team.country}
      </p>
    )}
  </div>
);

const CountdownPanel = ({ secondsLeft }: { secondsLeft?: number }) => {
  if (secondsLeft === undefined) {
    return (
      <div className={cx(glassCard, "p-6 text-center")}>
        <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
          Match schedule will be updated soon.
        </p>
      </div>
    );
  }

  const units = getCountdownUnits(secondsLeft);

  return (
    <div className={cx(glassCard, "p-4 sm:p-5")}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#009270] dark:text-[#3ddba4]">
            Countdown
          </p>
          <h2 className="text-lg font-black text-gray-900 dark:text-white">
            Match starts in
          </h2>
        </div>

        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[#00b884]/50 animate-ping" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-[#00b884]" />
        </span>
      </div>

      <div
        className={cx(
          "grid gap-3",
          units.length === 4
            ? "grid-cols-2 sm:grid-cols-4"
            : units.length === 3
            ? "grid-cols-3"
            : "grid-cols-2"
        )}
      >
        {units.map((u) => (
          <div
            key={u.label}
            className="rounded-2xl bg-gradient-to-br from-[#009270]/10 to-white/40 dark:from-[#3ddba4]/10 dark:to-white/[0.025] border border-[#009270]/10 dark:border-[#3ddba4]/10 px-3 py-4 text-center animate-[countPulse_2.4s_ease-in-out_infinite]"
          >
            <div className="text-3xl sm:text-4xl font-black tabular-nums text-gray-900 dark:text-white tracking-tight">
              {u.value}
            </div>
            <div className="mt-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {u.label}
            </div>
          </div>
        ))}
      </div>

      {secondsLeft <= 0 && (
        <p className="mt-4 text-center text-xs font-bold text-[#009270] dark:text-[#3ddba4]">
          Starting soon. Refreshing match data…
        </p>
      )}
    </div>
  );
};

const getTossInfo = (data?: LiveScoreResponse | null) => {
  const root: any = data || {};
  const toss =
    root?.matchHeader?.tossResults ||
    root?.matchInfo?.tossResults ||
    root?.tossResults ||
    root?.toss;

  const winner = firstDefined(
    toss?.tossWinnerName,
    toss?.winner,
    toss?.tossWinner,
    toss?.teamName
  );

  const decision = firstDefined(toss?.decision, toss?.tossDecision);

  if (!winner && !decision) return null;

  return { winner, decision };
};

const WeatherCard = ({ data }: { data?: LiveScoreResponse | null }) => {
  const root: any = data || {};
  const weather =
    root?.weather ||
    root?.matchHeader?.weather ||
    root?.matchInfo?.weather ||
    root?.venueInfo?.weather;

  const temperature = firstDefined(
    weather?.temperature,
    weather?.temp,
    weather?.tempC,
    weather?.temperatureC
  );

  const rainChance = firstDefined(
    weather?.rainChance,
    weather?.chanceOfRain,
    weather?.precipitation
  );

  const humidity = firstDefined(weather?.humidity);
  const wind = firstDefined(weather?.wind, weather?.windSpeed);

  if (!temperature && !rainChance && !humidity && !wind) return null;

  const items = [
    { label: "Temperature", value: temperature },
    { label: "Rain Chance", value: rainChance },
    { label: "Humidity", value: humidity },
    { label: "Wind", value: wind },
  ].filter((x) => x.value);

  return (
    <div className={cx(glassCard, "p-4 sm:p-5")}>
      <h3 className="text-sm font-black text-gray-900 dark:text-white mb-3">
        Weather
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl bg-gray-50/80 dark:bg-white/[0.025] border border-black/[0.04] dark:border-white/[0.06] p-3"
          >
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {item.label}
            </p>
            <p className="mt-1 text-sm font-black text-gray-900 dark:text-white">
              {String(item.value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const OfficialsCard = ({ data }: { data?: LiveScoreResponse | null }) => {
  const root: any = data || {};
  const officials =
    root?.officials ||
    root?.matchHeader?.officials ||
    root?.matchInfo?.officials ||
    {};

  const umpires = firstDefined(officials?.umpires, officials?.umpire);
  const thirdUmpire = firstDefined(
    officials?.thirdUmpire,
    officials?.thirdumpire
  );
  const referee = firstDefined(
    officials?.matchReferee,
    officials?.referee,
    officials?.matchreferee
  );

  if (!umpires && !thirdUmpire && !referee) return null;

  return (
    <div className={cx(glassCard, "p-4 sm:p-5")}>
      <h3 className="text-sm font-black text-gray-900 dark:text-white mb-2">
        Match Officials
      </h3>

      {umpires && (
        <InfoRow
          label="Umpires"
          value={Array.isArray(umpires) ? umpires.join(", ") : umpires}
        />
      )}
      {thirdUmpire && <InfoRow label="Third Umpire" value={thirdUmpire} />}
      {referee && <InfoRow label="Match Referee" value={referee} />}
    </div>
  );
};

const HeadToHeadCard = ({
  data,
  team1,
  team2,
}: {
  data?: LiveScoreResponse | null;
  team1: TeamMeta;
  team2: TeamMeta;
}) => {
  const root: any = data || {};
  const h2h =
    root?.headToHead ||
    root?.h2h ||
    root?.matchHeader?.headToHead ||
    root?.matchInfo?.headToHead;

  if (!h2h) return null;

  const played = firstDefined(h2h?.matchesPlayed, h2h?.played, h2h?.total);
  const team1Wins = firstDefined(
    h2h?.team1Wins,
    h2h?.teamOneWins,
    h2h?.[team1.shortName]
  );
  const team2Wins = firstDefined(
    h2h?.team2Wins,
    h2h?.teamTwoWins,
    h2h?.[team2.shortName]
  );
  const noResult = firstDefined(h2h?.noResult, h2h?.nr, h2h?.noResults);

  if (
    played === undefined &&
    team1Wins === undefined &&
    team2Wins === undefined &&
    noResult === undefined
  ) {
    return null;
  }

  return (
    <div className={cx(glassCard, "p-4 sm:p-5")}>
      <h3 className="text-sm font-black text-gray-900 dark:text-white mb-3">
        Head To Head
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Played", value: played },
          { label: `${team1.shortName} Wins`, value: team1Wins },
          { label: `${team2.shortName} Wins`, value: team2Wins },
          { label: "No Result", value: noResult },
        ]
          .filter((x) => x.value !== undefined)
          .map((x) => (
            <div
              key={x.label}
              className="rounded-2xl bg-gray-50/80 dark:bg-white/[0.025] border border-black/[0.04] dark:border-white/[0.06] p-3 text-center"
            >
              <p className="text-2xl font-black text-[#009270] dark:text-[#3ddba4]">
                {x.value}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {x.label}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
};

const normalizeForm = (form: any): string[] => {
  if (!form) return [];
  if (Array.isArray(form)) return form.map(String).slice(0, 5);
  if (typeof form === "string") return form.split(/\s+/).filter(Boolean).slice(0, 5);
  return [];
};

const RecentFormCard = ({
  data,
  team1,
  team2,
}: {
  data?: LiveScoreResponse | null;
  team1: TeamMeta;
  team2: TeamMeta;
}) => {
  const root: any = data || {};

  const team1Form = normalizeForm(
    root?.recentForm?.team1 ||
      root?.team1RecentForm ||
      root?.matchHeader?.team1?.recentForm
  );

  const team2Form = normalizeForm(
    root?.recentForm?.team2 ||
      root?.team2RecentForm ||
      root?.matchHeader?.team2?.recentForm
  );

  if (!team1Form.length && !team2Form.length) return null;

  const FormDots = ({ form }: { form: string[] }) => (
    <div className="flex gap-1.5">
      {form.map((r, i) => {
        const result = r.toUpperCase();
        const win = result === "W";
        const loss = result === "L";

        return (
          <span
            key={`${r}-${i}`}
            className={cx(
              "h-7 w-7 rounded-full flex items-center justify-center text-xs font-black",
              win
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                : loss
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                : "bg-gray-100 text-gray-500 dark:bg-white/[0.05]"
            )}
          >
            {result}
          </span>
        );
      })}
    </div>
  );

  return (
    <div className={cx(glassCard, "p-4 sm:p-5")}>
      <h3 className="text-sm font-black text-gray-900 dark:text-white mb-3">
        Recent Form
      </h3>

      <div className="space-y-3">
        {team1Form.length > 0 && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              {team1.shortName}
            </span>
            <FormDots form={team1Form} />
          </div>
        )}

        {team2Form.length > 0 && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              {team2.shortName}
            </span>
            <FormDots form={team2Form} />
          </div>
        )}
      </div>
    </div>
  );
};

const getProbableXI = (data?: LiveScoreResponse | null) => {
  const root: any = data || {};

  const t1 =
    root?.probableXI?.team1 ||
    root?.probablePlayingXI?.team1 ||
    root?.matchInfo?.team1?.probableXI ||
    root?.matchHeader?.team1?.probableXI;

  const t2 =
    root?.probableXI?.team2 ||
    root?.probablePlayingXI?.team2 ||
    root?.matchInfo?.team2?.probableXI ||
    root?.matchHeader?.team2?.probableXI;

  const normalize = (xi: any) => {
    if (!xi) return [];
    if (Array.isArray(xi)) {
      return xi
        .map((p) => firstDefined(p?.name, p?.fullName, p?.batName, p))
        .filter(Boolean);
    }
    if (typeof xi === "string") return xi.split(",").map((x) => x.trim());
    return [];
  };

  return {
    team1: normalize(t1),
    team2: normalize(t2),
  };
};

const ProbableXICard = ({
  data,
  team1,
  team2,
}: {
  data?: LiveScoreResponse | null;
  team1: TeamMeta;
  team2: TeamMeta;
}) => {
  const xi = getProbableXI(data);

  if (!xi.team1.length && !xi.team2.length) {
    return (
      <div className={cx(glassCard, "p-4 sm:p-5")}>
        <h3 className="text-sm font-black text-gray-900 dark:text-white mb-2">
          Probable Playing XI
        </h3>

        <div className="rounded-2xl bg-[#009270]/[0.06] dark:bg-[#3ddba4]/[0.06] border border-[#009270]/10 dark:border-[#3ddba4]/10 p-4 text-sm font-semibold text-[#00734f] dark:text-[#3ddba4]">
          Playing XI will be available after toss.
        </div>
      </div>
    );
  }

  return (
    <div className={cx(glassCard, "p-4 sm:p-5")}>
      <h3 className="text-sm font-black text-gray-900 dark:text-white mb-4">
        Probable Playing XI
      </h3>

      <div className="grid sm:grid-cols-2 gap-4">
        {xi.team1.length > 0 && (
          <div>
            <p className="text-xs font-black text-[#009270] dark:text-[#3ddba4] mb-2">
              {team1.shortName}
            </p>
            <ol className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
              {xi.team1.map((p, i) => (
                <li key={`${p}-${i}`} className="truncate">
                  {i + 1}. {p}
                </li>
              ))}
            </ol>
          </div>
        )}

        {xi.team2.length > 0 && (
          <div>
            <p className="text-xs font-black text-[#009270] dark:text-[#3ddba4] mb-2">
              {team2.shortName}
            </p>
            <ol className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
              {xi.team2.map((p, i) => (
                <li key={`${p}-${i}`} className="truncate">
                  {i + 1}. {p}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};

const PreMatchScreen = ({
  data,
  ms,
  onRefresh,
  lastUpdated,
  refreshing,
}: {
  data?: LiveScoreResponse | null;
  ms?: MiniScore;
  onRefresh: () => void;
  lastUpdated: Date | null;
  refreshing: boolean;
}) => {
  const meta = getPreMatchMeta(data, ms);

  const secondsLeft = useCountdown(meta.startMs, onRefresh);
  const toss = getTossInfo(data);

  const statusText =
    ms?.status ||
    ms?.matchScoreDetails?.customStatus ||
    `Match starts at ${formatGmtStart(meta.startMs)}`;

  return (
    <main className="max-w-2xl mx-auto px-3 sm:px-4 py-5 space-y-4 w-full animate-[fadeUp_0.35s_ease]">
      {/* Premium header */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#00734f] via-[#009270] to-[#00b884] p-5 sm:p-6 text-white shadow-[0_24px_60px_-35px_rgba(0,146,112,0.9)]">
        <div className="absolute -top-20 -right-16 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-black/10 blur-2xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-wider backdrop-blur-md">
              🏏 Upcoming Match
            </div>

            <h1 className="mt-4 text-2xl sm:text-3xl font-black leading-tight">
              {statusText}
            </h1>

            <p className="mt-2 text-sm text-white/80">
              {meta.seriesName} • {meta.format}
            </p>
          </div>

          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="h-11 w-11 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-95 transition-all flex items-center justify-center backdrop-blur-md disabled:opacity-60"
            aria-label="Refresh"
          >
            <Icon.Refresh
              className={cx("h-5 w-5", refreshing && "animate-spin")}
            />
          </button>
        </div>
      </div>

      {/* Countdown */}
      <CountdownPanel secondsLeft={secondsLeft} />

      {/* Teams + VS */}
      <div className={cx(glassCard, "p-4 sm:p-5")}>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
          <TeamPremiumCard team={meta.team1} />

          <div className="flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#009270] to-[#00b884] text-white shadow-lg shadow-[#009270]/25 flex items-center justify-center text-lg font-black border-4 border-white/70 dark:border-[#101815]">
              VS
            </div>

            <div className="mt-3 text-center">
              <p className="text-[10px] uppercase tracking-wider font-black text-gray-400 dark:text-gray-500">
                Starts In
              </p>
              <p className="text-sm font-black text-[#009270] dark:text-[#3ddba4] tabular-nums">
                {getShortCountdown(secondsLeft)}
              </p>
            </div>
          </div>

          <TeamPremiumCard team={meta.team2} />
        </div>
      </div>

      {/* Match information */}
      <div className={cx(glassCard, "p-4 sm:p-5")}>
        <h3 className="text-sm font-black text-gray-900 dark:text-white mb-2">
          Match Information
        </h3>

        <InfoRow label="Series Name" value={meta.seriesName} />
        <InfoRow label="Match Description" value={meta.matchDesc} />
        <InfoRow label="Venue" value={meta.venue.ground || "TBA"} />
        <InfoRow label="City" value={meta.venue.city || "TBA"} />
        <InfoRow label="Country" value={meta.venue.country || "TBA"} />
        <InfoRow label="Date" value={formatDateOnly(meta.startMs)} />
        <InfoRow
          label="Time (Local)"
          value={formatVenueLocal(meta.startMs, meta.venue.timezone)}
        />
        <InfoRow label="Time (User Local Time)" value={formatUserLocal(meta.startMs)} />
        <InfoRow label="Match Format" value={meta.format} />
      </div>

      {/* Toss */}
      <div className={cx(glassCard, "p-4 sm:p-5")}>
        <h3 className="text-sm font-black text-gray-900 dark:text-white mb-2">
          Toss
        </h3>

        {!toss ? (
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 p-4 text-sm font-bold text-amber-700 dark:text-amber-300">
            Toss yet to happen
          </div>
        ) : (
          <>
            <InfoRow label="Toss Winner" value={toss.winner} />
            <InfoRow label="Decision" value={toss.decision} />
          </>
        )}
      </div>

      <WeatherCard data={data} />

      <OfficialsCard data={data} />

      <HeadToHeadCard data={data} team1={meta.team1} team2={meta.team2} />

      <RecentFormCard data={data} team1={meta.team1} team2={meta.team2} />

      <ProbableXICard data={data} team1={meta.team1} team2={meta.team2} />

      <div className="bg-white/75 dark:bg-[#111815]/80 backdrop-blur-xl rounded-3xl border border-black/[0.04] dark:border-white/[0.06] px-4 sm:px-5 py-4 text-xs sm:text-[11.5px] text-gray-400 dark:text-gray-600 flex flex-wrap items-center justify-between gap-3 w-full">
        <div className="flex items-center gap-4 flex-wrap min-w-0">
          {lastUpdated && (
            <span>
              Updated{" "}
              {lastUpdated.toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          )}

          <span className="inline-flex items-center gap-1.5 text-[#009270] dark:text-[#3ddba4] font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-[#009270] dark:bg-[#3ddba4] animate-pulse flex-shrink-0" />
            Auto-refresh 30s
          </span>
        </div>

        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#00b884] to-[#009270] text-white rounded-full font-bold hover:brightness-105 active:scale-95 transition-all duration-200 flex-shrink-0 disabled:opacity-60"
        >
          <Icon.Refresh className={cx("h-3.5 w-3.5", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>
    </main>
  );
};

/* ═════════════════════════════════════════════════════════════════════
   LIVE SCORE WIDGETS
   ═════════════════════════════════════════════════════════════════════ */

const RecentOvers = ({ recentStr }: { recentStr: string }) => {
  const tokens = recentStr.split(/\s+/).filter(Boolean);

  const getBallStyle = (token: string) => {
    const t = token.toUpperCase();

    if (t === "W") return "bg-red-500 text-white";
    if (t === "4") return "bg-blue-500 text-white";
    if (t === "6") return "bg-purple-500 text-white";
    if (t === "0" || t === ".")
      return "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400";
    if (t === "|") return null;
    if (t.includes("WD") || t.includes("NB") || t.includes("LB") || t.includes("B")) {
      return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400";
    }

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
      {icon && <span className="text-gray-400 dark:text-gray-500">{icon}</span>}
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

const BatsmanRow = ({
  batsman,
  isStriker,
}: {
  batsman?: BatsmanInfo | null;
  isStriker: boolean;
}) => {
  if (!hasBatsmanData(batsman)) return null;

  const runs = batsman?.batRuns ?? 0;
  const balls = batsman?.batBalls ?? 0;

  const sr = balls > 0 ? ((runs / balls) * 100).toFixed(1) : "0.0";

  return (
    <div
      className={cx(
        "flex items-center justify-between gap-3 px-3 sm:px-4 py-3 rounded-xl transition-colors duration-150",
        isStriker
          ? "bg-[#009270]/[0.05] dark:bg-[#3ddba4]/[0.06] border border-[#009270]/15 dark:border-[#3ddba4]/15"
          : "bg-gray-50/60 dark:bg-white/[0.015] border border-transparent"
      )}
    >
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
          {batsman?.batName}
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
            {runs}
          </span>

          <span className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500 ml-0.5">
            ({balls})
          </span>
        </div>

        <div className="text-right hidden sm:block">
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

const BowlerRow = ({ bowler }: { bowler?: BowlerInfo | null }) => {
  if (!hasBowlerData(bowler)) return null;

  const wkts = bowler?.bowlWkts ?? 0;
  const runs = bowler?.bowlRuns ?? 0;
  const ovs = bowler?.bowlOvs ?? 0;

  const econ = ovs > 0 ? (runs / ovs).toFixed(2) : "0.00";

  return (
    <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-3 rounded-xl bg-gray-50/60 dark:bg-white/[0.015] border border-transparent">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Icon.Ball className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
        <span className="text-[13px] sm:text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">
          {bowler?.bowlName}
        </span>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
        <div className="text-right">
          <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tabular-nums">
            {wkts}-{runs}
          </span>

          <span className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500 ml-0.5">
            ({fmtOvers(ovs)})
          </span>
        </div>

        <div className="text-right hidden sm:block">
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

const InningsScoresList = ({
  list,
}: {
  list?: NonNullable<MiniScore["matchScoreDetails"]>["inningsScoreList"];
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
            {inn.batTeamSName || inn.batTeamName || `Inn ${inn.inningsId ?? i + 1}`}
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

const LiveScoreScreen = ({
  ms,
  data,
  error,
  lastUpdated,
  onRefresh,
  refreshing,
}: {
  ms: MiniScore;
  data?: LiveScoreResponse | null;
  error: string | null;
  lastUpdated: Date | null;
  onRefresh: () => void;
  refreshing: boolean;
}) => {
  const inningsList = Array.isArray(ms.matchScoreDetails?.inningsScoreList)
    ? ms.matchScoreDetails?.inningsScoreList
    : [];

  const lastInn = inningsList.length ? inningsList[inningsList.length - 1] : undefined;

  const state = getMatchState(data, ms);
  const isComplete = isCompleteState(state);

  const showAtCrease =
    hasBatsmanData(ms.batsmanStriker) || hasBatsmanData(ms.batsmanNonStriker);

  const showBowler = hasBowlerData(ms.bowlerStriker);

  const statItems: React.ReactNode[] = [];

  if (ms.currentRunRate !== undefined) {
    statItems.push(
      <StatChip
        key="rr"
        label="Run Rate"
        value={fmtRate(ms.currentRunRate)}
        accent
        icon={<Icon.Activity className="h-3 w-3" />}
      />
    );
  }

  if (ms.requiredRunRate !== undefined && ms.requiredRunRate > 0) {
    statItems.push(
      <StatChip
        key="rrr"
        label="Req. Rate"
        value={fmtRate(ms.requiredRunRate)}
        icon={<Icon.Target className="h-3 w-3" />}
      />
    );
  }

  if (ms.overs !== undefined) {
    statItems.push(
      <StatChip
        key="overs"
        label="Overs"
        value={fmtOvers(ms.overs)}
        icon={<Icon.Ball className="h-3 w-3" />}
      />
    );
  }

  if (ms.target !== undefined && ms.target > 0) {
    const currentScore = lastInn?.score ?? 0;
    const need = Math.max(0, ms.target - currentScore);

    statItems.push(
      <StatChip
        key="need"
        label="Need"
        value={need}
        accent
        icon={<Icon.Zap className="h-3 w-3" />}
      />
    );
  }

  if (ms.partnership?.runs !== undefined) {
    statItems.push(
      <StatChip
        key="partnership"
        label="Partnership"
        value={`${ms.partnership.runs}(${ms.partnership.balls ?? 0})`}
        icon={<Icon.Link className="h-3 w-3" />}
      />
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-3 sm:px-4 py-5 space-y-4 w-full">
      {error && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3 text-xs sm:text-[13px] text-amber-700 dark:text-amber-400 flex items-center gap-2">
          <Icon.Alert className="h-4 w-4 shrink-0" />
          <span className="break-words">{error} — Showing cached data.</span>
        </div>
      )}

      {/* Status */}
      <div className={card}>
        <div className="px-3 sm:px-5 py-4">
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

          {inningsList.length > 0 && (
            <div className="mb-4">
              <InningsScoresList list={inningsList} />
            </div>
          )}

          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[10px] sm:text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                {ms.batTeam?.teamName || ms.batTeam?.teamSName || "Batting"}
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tabular-nums tracking-tight">
                  {lastInn
                    ? `${lastInn.score ?? 0}/${lastInn.wickets ?? 0}`
                    : "—"}
                </span>

                {ms.overs !== undefined && (
                  <span className="text-sm sm:text-base font-semibold text-gray-400 dark:text-gray-500">
                    ({fmtOvers(ms.overs)} ov)
                  </span>
                )}
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

      {/* Live stats only render in live mode */}
      {statItems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{statItems}</div>
      )}

      {/* At the Crease */}
      {showAtCrease && (
        <div className={card}>
          <div className={sectionTitle}>
            <AccentBar />
            <span className="text-[#009270] dark:text-[#3ddba4]">
              <Icon.Bat className="h-4 w-4" />
            </span>
            <span className={titleText}>At the Crease</span>
          </div>

          <div className="p-3 sm:p-4 space-y-2">
            <BatsmanRow batsman={ms.batsmanStriker} isStriker />
            <BatsmanRow batsman={ms.batsmanNonStriker} isStriker={false} />
          </div>
        </div>
      )}

      {/* Bowler */}
      {showBowler && (
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
      )}

      {/* Recent Overs */}
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

      {/* Last Wicket */}
      {ms.lastWicket && (
        <div className={card}>
          <div className={sectionTitle}>
            <AccentBar />
            <span className="text-red-500">
              <Icon.Fall className="h-4 w-4" />
            </span>
            <span className={cx(titleText, "!text-red-600 dark:!text-red-400")}>
              Last Wicket
            </span>
          </div>

          <div className="px-3 sm:px-5 py-3 text-xs sm:text-[13px] text-gray-700 dark:text-gray-300 break-words leading-relaxed">
            {ms.lastWicket}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#111815] rounded-3xl border border-black/[0.04] dark:border-white/[0.06] px-4 sm:px-5 py-4 text-xs sm:text-[11.5px] text-gray-400 dark:text-gray-600 flex flex-wrap items-center justify-between gap-3 w-full">
        <div className="flex items-center gap-4 flex-wrap min-w-0">
          {lastUpdated && (
            <span>
              Updated{" "}
              {lastUpdated.toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          )}

          {!isComplete && (
            <span className="inline-flex items-center gap-1.5 text-[#009270] dark:text-[#3ddba4] font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-[#009270] dark:bg-[#3ddba4] animate-pulse flex-shrink-0" />
              Auto-refresh 30s
            </span>
          )}
        </div>

        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#00b884] to-[#009270] text-white rounded-full font-bold hover:brightness-105 active:scale-95 transition-all duration-200 flex-shrink-0 disabled:opacity-60"
        >
          <Icon.Refresh className={cx("h-3.5 w-3.5", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>
    </main>
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
  const [refreshing, setRefreshing] = useState(false);
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
      setRefreshing(true);
      setError(null);

      const res = await fetch(`/api/score/livescore?matchId=${matchId}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(
          `API returned ${res.status}: ${res.statusText || "Unknown error"}`
        );
      }

      const json: LiveScoreResponse = await res.json();

      setData(json);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch live score");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  const ms = data?.miniscore;

  const matchState = getMatchState(data, ms);
  const stateIsPreview = isPreviewState(matchState);
  const stateIsComplete = isCompleteState(matchState);

  const inningsList = ms?.matchScoreDetails?.inningsScoreList;
  const inningsCount = Array.isArray(inningsList) ? inningsList.length : 0;

  /*
    IMPORTANT SAFETY RULE:
    If state is Preview OR inningsScoreList is empty,
    do NOT access batsmanStriker / batsmanNonStriker / bowlerStriker
    for rendering live widgets.
  */
  let missingLiveActors = true;

  if (!stateIsPreview && inningsCount > 0 && ms) {
    missingLiveActors = !(
      hasBatsmanData(ms.batsmanStriker) &&
      hasBatsmanData(ms.batsmanNonStriker) &&
      hasBowlerData(ms.bowlerStriker)
    );
  }

  const isPreMatch =
    Boolean(ms) &&
    !stateIsComplete &&
    (stateIsPreview || inningsCount === 0 || missingLiveActors);

  // Live refresh every 30 seconds.
  useEffect(() => {
    if (!data) return;
    if (stateIsComplete) return;

    const timer = window.setInterval(() => {
      fetchData();
    }, 30_000);

    return () => window.clearInterval(timer);
  }, [data, stateIsComplete, fetchData]);

  const formatLabel = getMatchFormat(data, ms);

  return (
    <div className="min-h-screen bg-[#f2f4f3] dark:bg-[#0a0f0d] transition-colors duration-300 font-sans overflow-x-hidden">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes countPulse {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
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

      {ms && (
        <div className="animate-[fadeUp_0.35s_ease]">
          {/* Top Bar */}
          <div className="sticky top-0 z-50 w-full">
            <div className="bg-gradient-to-r from-[#00734f] via-[#009270] to-[#00a67d] px-3 sm:px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {!stateIsComplete && (
                  <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-white/60 animate-ping" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
                  </span>
                )}

                <span className="text-white/95 text-[11px] sm:text-xs font-semibold tracking-wide truncate">
                  {isPreMatch
                    ? "UPCOMING"
                    : stateIsComplete
                    ? "MATCH COMPLETE"
                    : "LIVE"}
                </span>
              </div>

              {formatLabel && (
                <span className="text-white text-[10px] sm:text-[10.5px] font-bold bg-white/15 px-2.5 py-0.5 rounded-full tracking-wide flex-shrink-0">
                  {formatLabel}
                </span>
              )}
            </div>
          </div>

          {isPreMatch ? (
            <PreMatchScreen
              data={data}
              ms={ms}
              onRefresh={fetchData}
              lastUpdated={lastUpdated}
              refreshing={refreshing}
            />
          ) : (
            <LiveScoreScreen
              ms={ms}
              data={data}
              error={error}
              lastUpdated={lastUpdated}
              onRefresh={fetchData}
              refreshing={refreshing}
            />
          )}
        </div>
      )}
    </div>
  );
}
