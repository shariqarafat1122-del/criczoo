import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Share2,
  Copy,
  ExternalLink,
  Heart,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  UserX,
  Trophy,
  Calendar,
  MapPin,
  User,
  Hand,
  Flag,
  Cake,
  Sun,
  Moon,
  Activity,
  Users,
  Award,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════ */

interface RankingEntry {
  current: string;
  best: string;
}

interface Rankings {
  test: string;
  odi: string;
  t20i: RankingEntry | string;
}

interface BattingFormEntry {
  score: string;
  opponent: string;
  format: string;
  date: string;
}

interface CareerFormatStats {
  matches?: number;
  runs?: number;
  highest?: string;
  average?: number;
  strikeRate?: number;
  fifties?: number;
  hundreds?: number;
  fours?: number;
  sixes?: number;
  notOuts?: number;
}

interface CareerSummary {
  test?: CareerFormatStats;
  odi?: CareerFormatStats;
  t20i?: CareerFormatStats;
  ipl?: CareerFormatStats;
  text?: string;
}

interface PlayerProfile {
  success: boolean;
  profileId: string;
  name: string;
  country: string;
  playerImage: string | null;
  born: string;
  birthPlace: string;
  role: string;
  battingStyle: string;
  bowlingStyle: string;
  iccRankings: Rankings;
  teams: string[];
  battingForm: BattingFormEntry[];
  careerSummary: CareerSummary | string;
  isCaptain?: boolean;
  isKeeper?: boolean;
}

const CAREER_TABS = ["Test", "ODI", "T20I", "IPL"] as const;
type CareerTab = (typeof CAREER_TABS)[number];

/* ═══════════════════════════════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════════════════════════════ */

const cx = (...c: (string | false | undefined | null)[]) =>
  c.filter(Boolean).join(" ");

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

function formIndicator(score: string) {
  const runs = parseInt(score, 10);
  if (isNaN(runs)) return { color: "bg-emerald-500", label: "—" };
  if (runs >= 100) return { color: "bg-purple-500", label: "💯" };
  if (runs >= 50) return { color: "bg-emerald-500", label: "50+" };
  if (runs >= 20) return { color: "bg-amber-500", label: "OK" };
  return { color: "bg-red-500", label: "Low" };
}

function AnimatedCounter({ value }: { value: string | number }) {
  const [display, setDisplay] = useState<string>(String(value));
  useEffect(() => {
    const target = Number(value);
    if (isNaN(target)) {
      setDisplay(String(value));
      return;
    }
    let frame: number;
    const duration = 700;
    const start = performance.now();
    const animate = (t: number) => {
      const progress = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target).toString());
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <span>{display}</span>;
}

/* ═══════════════════════════════════════════════════════════════════════
   DESIGN TOKENS  (matches Squad / LiveMatch / UpcomingMatches)
   ═══════════════════════════════════════════════════════════════════════ */

const DT = {
  page:
    "min-h-screen bg-[#F5F7FA] dark:bg-[#0a0f0d] transition-colors duration-300 font-sans overflow-x-hidden",
  card:
    "bg-white dark:bg-[#111815] rounded-[24px] shadow-[0_2px_10px_-4px_rgba(15,23,20,0.08)] dark:shadow-[0_2px_20px_-8px_rgba(0,0,0,0.5)] border border-black/[0.05] dark:border-white/[0.06] overflow-hidden w-full",
  sectionBar:
    "flex items-center gap-2.5 px-4 sm:px-5 py-3 bg-gradient-to-r from-[#009270]/[0.06] via-[#009270]/[0.02] to-transparent dark:from-[#12b985]/[0.09] dark:via-[#12b985]/[0.03] dark:to-transparent border-b border-black/[0.04] dark:border-white/[0.05]",
  sectionTitle:
    "text-[11px] sm:text-[11.5px] font-bold text-[#00734f] dark:text-[#3ddba4] uppercase tracking-[0.08em]",
  accent:
    "w-1 h-5 rounded-full bg-gradient-to-b from-[#00b884] to-[#009270] dark:from-[#3ddba4] dark:to-[#12b985] flex-shrink-0",
};

/* ═══════════════════════════════════════════════════════════════════════
   STICKY HEADER
   ═══════════════════════════════════════════════════════════════════════ */

function StickyHeader({
  onBack,
  onShare,
  name,
}: {
  onBack: () => void;
  onShare: () => void;
  name?: string;
}) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#F5F7FA]/85 dark:bg-[#0a0f0d]/85 border-b border-black/[0.05] dark:border-white/[0.06]">
      <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
        <button
          onClick={onBack}
          aria-label="Go back"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-[#161d1a] border border-black/[0.05] dark:border-white/[0.06] text-gray-700 dark:text-gray-200 hover:text-[#009270] dark:hover:text-[#3ddba4] active:scale-95 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-[14px] sm:text-[15px] font-bold tracking-tight text-gray-900 dark:text-white truncate max-w-[55%]">
          {name || "Player Profile"}
        </h1>
        <button
          onClick={onShare}
          aria-label="Share profile"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-[#161d1a] border border-black/[0.05] dark:border-white/[0.06] text-gray-700 dark:text-gray-200 hover:text-[#009270] dark:hover:text-[#3ddba4] active:scale-95 transition-all"
        >
          <Share2 size={17} />
        </button>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   AVATAR
   ═══════════════════════════════════════════════════════════════════════ */

function PlayerAvatar({
  image,
  name,
}: {
  image: string | null;
  name: string;
}) {
  const [errored, setErrored] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const showFallback = !image || errored;

  return (
    <div className="relative w-[124px] h-[124px] shrink-0">
      {/* Glow */}
      <div className="absolute inset-[-16px] rounded-full bg-[radial-gradient(circle,rgba(0,146,112,0.35)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(61,219,164,0.35)_0%,transparent_70%)] blur-xl" />

      {showFallback ? (
        <div className="relative w-full h-full rounded-full border-[3px] border-white dark:border-white/10 shadow-[0_8px_28px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_28px_rgba(0,0,0,0.5)] bg-gradient-to-br from-[#00b884] to-[#009270] flex items-center justify-center">
          <span className="text-3xl font-black text-white">
            {getInitials(name)}
          </span>
        </div>
      ) : (
        <div className="relative w-full h-full rounded-full border-[3px] border-white dark:border-white/10 shadow-[0_8px_28px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_28px_rgba(0,0,0,0.5)] overflow-hidden bg-gradient-to-br from-[#00b884]/20 to-[#009270]/20">
          {!loaded && <div className="absolute inset-0 shimmer" />}
          <img
            src={image!}
            alt={name}
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
            className={cx(
              "w-full h-full object-cover transition-opacity duration-300",
              loaded ? "opacity-100" : "opacity-0"
            )}
          />
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   BADGES
   ═══════════════════════════════════════════════════════════════════════ */

function Badge({
  icon: Icon,
  label,
  variant = "default",
}: {
  icon: React.ElementType;
  label: string;
  variant?: "default" | "captain" | "keeper";
}) {
  const styles = {
    default:
      "bg-[#009270]/[0.1] text-[#00734f] dark:bg-[#3ddba4]/[0.12] dark:text-[#3ddba4] border-[#009270]/20 dark:border-[#3ddba4]/20",
    captain:
      "bg-amber-500/[0.12] text-amber-700 dark:text-amber-300 border-amber-500/25",
    keeper:
      "bg-blue-500/[0.1] text-blue-600 dark:text-blue-300 border-blue-500/25",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border",
        styles[variant]
      )}
    >
      <Icon size={11} />
      {label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════════════════════════════════ */

function PlayerHero({ data }: { data: PlayerProfile }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cx(
        DT.card,
        "relative px-6 py-8 flex flex-col items-center text-center"
      )}
    >
      {/* Gradient blobs */}
      <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[#00b884]/25 dark:bg-[#3ddba4]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-[#009270]/20 dark:bg-[#12b985]/15 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center gap-4">
        <PlayerAvatar image={data.playerImage} name={data.name} />

        <div>
          <h2 className="text-[24px] sm:text-[26px] font-black text-gray-900 dark:text-white leading-tight tracking-tight">
            {data.name}
          </h2>
          <div className="flex items-center justify-center gap-1.5 mt-1.5 text-gray-500 dark:text-gray-400 text-sm font-medium">
            <Flag size={13} />
            <span>{data.country}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {data.role && <Badge icon={User} label={data.role} />}
          {data.isCaptain && (
            <Badge icon={Trophy} label="Captain" variant="captain" />
          )}
          {data.isKeeper && (
            <Badge icon={Hand} label="Wicket Keeper" variant="keeper" />
          )}
        </div>
      </div>
    </motion.section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   INFO CARDS
   ═══════════════════════════════════════════════════════════════════════ */

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-2xl bg-white dark:bg-[#111815] border border-black/[0.05] dark:border-white/[0.06] p-3.5 shadow-[0_1px_8px_-3px_rgba(15,23,20,0.06)] transition-shadow hover:shadow-[0_6px_20px_-6px_rgba(15,23,20,0.15)]"
    >
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00b884] to-[#009270] flex items-center justify-center mb-2.5">
        <Icon size={15} className="text-white" />
      </div>
      <div className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-bold mb-0.5">
        {label}
      </div>
      <div className="text-[13.5px] text-gray-900 dark:text-white font-semibold leading-snug">
        {value || "—"}
      </div>
    </motion.div>
  );
}

function ProfileInfoGrid({ data }: { data: PlayerProfile }) {
  const age = data.born?.match(/\((\d+)\s*years?\)/)?.[1];
  const items = [
    { icon: Cake, label: "Born", value: data.born },
    { icon: MapPin, label: "Birth Place", value: data.birthPlace },
    { icon: User, label: "Role", value: data.role },
    { icon: Hand, label: "Batting", value: data.battingStyle },
    { icon: Hand, label: "Bowling", value: data.bowlingStyle },
    { icon: Flag, label: "Country", value: data.country },
    ...(age
      ? [{ icon: Calendar, label: "Age", value: `${age} years` }]
      : []),
  ];
  return (
    <section>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {items.map((item, i) => (
          <InfoCard key={i} {...item} />
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ICC RANKINGS
   ═══════════════════════════════════════════════════════════════════════ */

function normalizeT20i(t20i: RankingEntry | string): RankingEntry {
  if (typeof t20i === "string") return { current: t20i, best: t20i };
  return t20i;
}

function RankingRow({
  format,
  current,
  best,
  isTop,
}: {
  format: string;
  current: string;
  best: string;
  isTop: boolean;
}) {
  return (
    <div
      className={cx(
        "flex items-center justify-between px-4 py-3 rounded-2xl transition-colors border",
        isTop
          ? "bg-gradient-to-r from-[#009270]/[0.08] to-transparent border-[#009270]/20 dark:border-[#3ddba4]/25"
          : "bg-gray-50/70 dark:bg-white/[0.02] border-transparent"
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-gray-900 dark:text-white w-14">
          {format}
        </span>
        {isTop && (
          <span className="text-[9px] font-black uppercase tracking-wider bg-[#009270]/[0.15] text-[#00734f] dark:bg-[#3ddba4]/[0.15] dark:text-[#3ddba4] px-1.5 py-0.5 rounded-md">
            Top
          </span>
        )}
      </div>
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div
            className={cx(
              "text-xl font-black tabular-nums",
              isTop
                ? "text-[#00734f] dark:text-[#3ddba4]"
                : "text-gray-900 dark:text-white"
            )}
          >
            {current === "-" ? "—" : (
              <AnimatedCounter value={current} />
            )}
          </div>
          <div className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-bold mt-0.5">
            Current
          </div>
        </div>
        <div className="text-center">
          <div className="text-xl font-black text-gray-400 dark:text-gray-500 tabular-nums">
            {best === "-" ? "—" : <AnimatedCounter value={best} />}
          </div>
          <div className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-bold mt-0.5">
            Best
          </div>
        </div>
      </div>
    </div>
  );
}

function RankingCard({ rankings }: { rankings: Rankings }) {
  const t20i = normalizeT20i(rankings.t20i);
  const rows = [
    { format: "Test", current: rankings.test, best: rankings.test },
    { format: "ODI", current: rankings.odi, best: rankings.odi },
    { format: "T20I", current: t20i.current, best: t20i.best },
  ];
  const numericRanks = rows
    .map((r) => parseInt(r.current, 10))
    .filter((n) => !isNaN(n));
  const topRank = numericRanks.length ? Math.min(...numericRanks) : null;

  return (
    <section className={DT.card}>
      <div className={DT.sectionBar}>
        <span className={DT.accent} />
        <span className="text-[#009270] dark:text-[#3ddba4]">
          <Trophy size={16} />
        </span>
        <span className={DT.sectionTitle}>ICC Rankings</span>
      </div>
      <div className="p-3 sm:p-4 space-y-2">
        {rows.map((row) => (
          <RankingRow
            key={row.format}
            {...row}
            isTop={
              parseInt(row.current, 10) === topRank && topRank !== null
            }
          />
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TEAMS
   ═══════════════════════════════════════════════════════════════════════ */

function TeamsCard({ teams }: { teams: string[] }) {
  if (!teams?.length) return null;
  return (
    <section className={DT.card}>
      <div className={DT.sectionBar}>
        <span className={DT.accent} />
        <span className="text-[#009270] dark:text-[#3ddba4]">
          <Users size={16} />
        </span>
        <span className={DT.sectionTitle}>Teams</span>
        <span className="ml-auto text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/[0.06] h-5 min-w-[22px] flex items-center justify-center rounded-full tabular-nums px-1.5">
          {teams.length}
        </span>
      </div>
      <div className="p-4 flex flex-wrap gap-2">
        {teams.map((team, i) => (
          <motion.span
            key={team + i}
            whileHover={{ scale: 1.04, y: -1 }}
            className="px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold text-gray-800 dark:text-gray-200 bg-gray-100/80 dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.06] cursor-default transition-shadow hover:shadow-[0_4px_14px_-4px_rgba(0,146,112,0.35)] hover:border-[#009270]/25 dark:hover:border-[#3ddba4]/25"
          >
            {team}
          </motion.span>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   RECENT FORM
   ═══════════════════════════════════════════════════════════════════════ */

function RecentFormCard({ form }: { form: BattingFormEntry[] }) {
  if (!form?.length) return null;
  return (
    <section className={DT.card}>
      <div className={DT.sectionBar}>
        <span className={DT.accent} />
        <span className="text-[#009270] dark:text-[#3ddba4]">
          <Activity size={16} />
        </span>
        <span className={DT.sectionTitle}>Recent Form</span>
      </div>
      <div className="p-4">
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
          {form.map((entry, i) => {
            const { color } = formIndicator(entry.score);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="shrink-0 w-[144px] rounded-2xl bg-gray-50/70 dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.06] p-4 relative overflow-hidden"
              >
                <div
                  className={cx("absolute top-0 left-0 right-0 h-1", color)}
                />
                <div className="text-2xl font-black text-gray-900 dark:text-white mt-1.5 tabular-nums">
                  {entry.score}
                </div>
                <div className="text-[12px] text-gray-500 dark:text-gray-400 mt-1 truncate font-medium">
                  vs {entry.opponent}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-[#009270]/[0.1] dark:bg-[#3ddba4]/[0.12] text-[#00734f] dark:text-[#3ddba4]">
                    {entry.format}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {entry.date}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CAREER SUMMARY
   ═══════════════════════════════════════════════════════════════════════ */

const STAT_LABELS: { key: keyof CareerFormatStats; label: string }[] = [
  { key: "matches", label: "Matches" },
  { key: "runs", label: "Runs" },
  { key: "highest", label: "Highest" },
  { key: "average", label: "Average" },
  { key: "strikeRate", label: "Strike Rate" },
  { key: "fifties", label: "50s" },
  { key: "hundreds", label: "100s" },
  { key: "fours", label: "Fours" },
  { key: "sixes", label: "Sixes" },
  { key: "notOuts", label: "Not Outs" },
];

function CareerSummaryCard({
  summary,
}: {
  summary: CareerSummary | string;
}) {
  const [tab, setTab] = useState<CareerTab>("T20I");
  if (typeof summary === "string" || !summary) return null;

  const tabKeyMap: Record<CareerTab, keyof CareerSummary> = {
    Test: "test",
    ODI: "odi",
    T20I: "t20i",
    IPL: "ipl",
  };
  const stats = summary[tabKeyMap[tab]] as CareerFormatStats | undefined;

  return (
    <section className={DT.card}>
      <div className={DT.sectionBar}>
        <span className={DT.accent} />
        <span className="text-[#009270] dark:text-[#3ddba4]">
          <Award size={16} />
        </span>
        <span className={DT.sectionTitle}>Career Summary</span>
      </div>

      <div className="p-4">
        {/* Sliding tab */}
        <div className="relative flex gap-1 p-1 mb-4 rounded-full bg-gray-100 dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.06]">
          {CAREER_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cx(
                "relative flex-1 py-2 text-[12.5px] font-bold rounded-full transition-colors duration-200 z-10",
                tab === t
                  ? "text-white"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              )}
            >
              {tab === t && (
                <motion.div
                  layoutId="careerTabBg"
                  className="absolute inset-0 bg-gradient-to-r from-[#00b884] to-[#009270] rounded-full shadow-lg shadow-[#009270]/25 -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <span className="relative">{t}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.22 }}
          >
            {stats ? (
              <div className="grid grid-cols-2 gap-2">
                {STAT_LABELS.map(({ key, label }) =>
                  stats[key] !== undefined ? (
                    <div
                      key={key}
                      className="rounded-xl bg-gray-50/70 dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04] px-3 py-2.5 flex items-center justify-between"
                    >
                      <span className="text-[11.5px] text-gray-500 dark:text-gray-400 font-medium">
                        {label}
                      </span>
                      <span className="text-[14px] font-black text-gray-900 dark:text-white tabular-nums">
                        {stats[key]}
                      </span>
                    </div>
                  ) : null
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
                No {tab} data available
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   BIO
   ═══════════════════════════════════════════════════════════════════════ */

function PlayerBioCard({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  return (
    <section className={DT.card}>
      <div className={DT.sectionBar}>
        <span className={DT.accent} />
        <span className="text-[#009270] dark:text-[#3ddba4]">
          <User size={16} />
        </span>
        <span className={DT.sectionTitle}>About Player</span>
      </div>
      <div className="p-4">
        <p
          className={cx(
            "text-[13.5px] leading-relaxed text-gray-700 dark:text-gray-300",
            !expanded && "line-clamp-5"
          )}
        >
          {text}
        </p>
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-bold text-[#00734f] dark:text-[#3ddba4] hover:brightness-125 transition"
        >
          {expanded ? "Read Less" : "Read More"}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ACHIEVEMENTS TIMELINE
   ═══════════════════════════════════════════════════════════════════════ */

function AchievementsTimeline({ data }: { data: PlayerProfile }) {
  const t20i = normalizeT20i(data.iccRankings.t20i);
  const latestForm = data.battingForm?.[0];
  const items = [
    latestForm && {
      label: "Latest Match",
      detail: `${latestForm.score} vs ${latestForm.opponent} (${latestForm.format})`,
      date: latestForm.date,
    },
    t20i.best !== "-" && {
      label: "Best T20I Ranking",
      detail: `Ranked #${t20i.best}`,
      date: "",
    },
  ].filter(Boolean) as { label: string; detail: string; date: string }[];

  if (!items.length) return null;

  return (
    <section className={DT.card}>
      <div className={DT.sectionBar}>
        <span className={DT.accent} />
        <span className="text-[#009270] dark:text-[#3ddba4]">
          <Award size={16} />
        </span>
        <span className={DT.sectionTitle}>Achievements</span>
      </div>
      <div className="p-4">
        <div className="relative pl-6">
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-[#009270] via-[#009270]/30 to-transparent dark:from-[#3ddba4] dark:via-[#3ddba4]/30" />
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="relative pb-5 last:pb-0"
            >
              <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#00b884] to-[#009270] ring-4 ring-white dark:ring-[#111815] shadow-sm" />
              <div className="text-[13px] font-bold text-gray-900 dark:text-white">
                {item.label}
              </div>
              <div className="text-[13px] text-gray-600 dark:text-gray-300 mt-0.5">
                {item.detail}
              </div>
              {item.date && (
                <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                  {item.date}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ACTION BUTTONS
   ═══════════════════════════════════════════════════════════════════════ */

function ActionButtons({
  onCopyLink,
  onOpenCricbuzz,
  onFavorite,
  isFavorite,
}: {
  onCopyLink: () => void;
  onOpenCricbuzz: () => void;
  onFavorite: () => void;
  isFavorite: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    onCopyLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const btn =
    "flex flex-col items-center gap-1.5 py-3.5 rounded-2xl bg-white dark:bg-[#111815] border border-black/[0.05] dark:border-white/[0.06] hover:border-[#009270]/25 dark:hover:border-[#3ddba4]/25 hover:shadow-[0_6px_20px_-6px_rgba(0,146,112,0.25)] active:scale-95 transition-all";

  return (
    <div className="grid grid-cols-3 gap-3">
      <button onClick={handleCopy} className={btn}>
        <Copy size={17} className="text-[#009270] dark:text-[#3ddba4]" />
        <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
          {copied ? "Copied!" : "Copy Link"}
        </span>
      </button>
      <button onClick={onOpenCricbuzz} className={btn}>
        <ExternalLink
          size={17}
          className="text-[#009270] dark:text-[#3ddba4]"
        />
        <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
          Cricbuzz
        </span>
      </button>
      <button onClick={onFavorite} className={btn}>
        <Heart
          size={17}
          className={
            isFavorite
              ? "text-red-500 fill-red-500"
              : "text-[#009270] dark:text-[#3ddba4]"
          }
        />
        <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
          {isFavorite ? "Favorited" : "Favorite"}
        </span>
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SKELETONS
   ═══════════════════════════════════════════════════════════════════════ */

const Skel = ({ className }: { className?: string }) => (
  <div className={cx("shimmer rounded-full", className)} />
);

function LoadingSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
      <div className={cx(DT.card, "px-6 py-8 flex flex-col items-center gap-4")}>
        <div className="w-[124px] h-[124px] rounded-full shimmer" />
        <Skel className="h-6 w-44" />
        <Skel className="h-4 w-24" />
        <Skel className="h-6 w-36 !rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skel key={i} className="h-24 !rounded-2xl" />
        ))}
      </div>
      <Skel className="h-52 !rounded-3xl" />
      <Skel className="h-32 !rounded-3xl" />
      <Skel className="h-44 !rounded-3xl" />
      <Skel className="h-64 !rounded-3xl" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ERROR / EMPTY
   ═══════════════════════════════════════════════════════════════════════ */

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-24 flex flex-col items-center text-center">
      <div className="w-24 h-24 rounded-full bg-red-50 dark:bg-red-900/15 flex items-center justify-center mb-5">
        <RefreshCw size={32} className="text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        Unable to load player
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs leading-relaxed">
        Something went wrong while fetching this profile. Check your
        connection and try again.
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#00b884] to-[#009270] text-white rounded-full text-sm font-bold shadow-lg shadow-[#009270]/25 hover:brightness-105 active:scale-95 transition"
      >
        <RefreshCw size={15} />
        Retry
      </button>
    </div>
  );
}

function EmptyState({ onBack }: { onBack: () => void }) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-24 flex flex-col items-center text-center">
      <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center mb-5">
        <UserX size={32} className="text-gray-400 dark:text-gray-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        Player Not Found
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs leading-relaxed">
        We couldn't find a profile matching this ID. It may have been moved
        or doesn't exist.
      </p>
      <button
        onClick={onBack}
        className="px-6 py-2.5 rounded-full bg-white dark:bg-[#161d1a] border border-black/[0.05] dark:border-white/[0.06] text-gray-700 dark:text-gray-200 font-bold text-sm hover:border-[#009270]/25 dark:hover:border-[#3ddba4]/25 active:scale-95 transition"
      >
        Go Back
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════ */

export default function PlayerProfilePage() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<PlayerProfile | null>(null);
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "notfound"
  >("loading");
  const [isFavorite, setIsFavorite] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  /* ── Dark mode toggle ── */
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  const fetchProfile = useCallback(async () => {
    if (!profileId) return;
    setStatus("loading");
    try {
      const res = await fetch(
        `/api/player/profile?profileId=${profileId}`
      );
      if (res.status === 404) {
        setStatus("notfound");
        return;
      }
      if (!res.ok) {
        setStatus("error");
        return;
      }
      const json = await res.json();
      if (!json.success) {
        setStatus("notfound");
        return;
      }
      setData(json);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }, [profileId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/", { replace: true });
  };

  const handleShare = async () => {
    if (navigator.share && data) {
      try {
        await navigator.share({
          title: `${data.name} - Player Profile`,
          url: window.location.href,
        });
      } catch {
        /* cancelled */
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  const handleOpenCricbuzz = () => {
    if (profileId) {
      window.open(
        `https://www.cricbuzz.com/profiles/${profileId}`,
        "_blank"
      );
    }
  };

  const summaryText =
    typeof data?.careerSummary === "string"
      ? data.careerSummary
      : data?.careerSummary?.text || "";

  return (
    <div className={DT.page}>
      <style>{`
        .shimmer {
          background: linear-gradient(110deg, #e8e8e8 8%, #f5f5f5 18%, #e8e8e8 33%);
          background-size: 200% 100%;
          animation: shimmerMove 1.5s linear infinite;
        }
        .dark .shimmer {
          background: linear-gradient(110deg, #1a2420 8%, #222d28 18%, #1a2420 33%);
          background-size: 200% 100%;
        }
        @keyframes shimmerMove {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .line-clamp-5 {
          display: -webkit-box;
          -webkit-line-clamp: 5;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      <StickyHeader
        onBack={handleBack}
        onShare={handleShare}
        name={data?.name}
      />

      {/* Dark mode toggle */}
      <button
        onClick={() => setDarkMode((d) => !d)}
        className="fixed bottom-5 right-5 z-50 h-11 w-11 rounded-full bg-white dark:bg-[#161d1a] shadow-lg border border-black/[0.05] dark:border-white/10 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:scale-110 active:scale-95 transition-transform"
        aria-label="Toggle dark mode"
      >
        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {status === "loading" && <LoadingSkeleton />}
      {status === "error" && <ErrorState onRetry={fetchProfile} />}
      {status === "notfound" && <EmptyState onBack={handleBack} />}

      {status === "success" && data && (
        <main className="max-w-2xl mx-auto px-3 sm:px-4 py-4 space-y-4 pb-12">
          <PlayerHero data={data} />
          <ProfileInfoGrid data={data} />
          <RankingCard rankings={data.iccRankings} />
          <TeamsCard teams={data.teams} />
          <RecentFormCard form={data.battingForm} />
          <CareerSummaryCard summary={data.careerSummary} />
          {summaryText && <PlayerBioCard text={summaryText} />}
          <AchievementsTimeline data={data} />
          <ActionButtons
            onCopyLink={handleCopyLink}
            onOpenCricbuzz={handleOpenCricbuzz}
            onFavorite={() => setIsFavorite((f) => !f)}
            isFavorite={isFavorite}
          />
        </main>
      )}
    </div>
  );
}
