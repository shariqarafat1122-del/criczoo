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
} from "lucide-react";

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

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

function formIndicatorColor(score: string): string {
  const runs = parseInt(score, 10);
  if (isNaN(runs)) return "bg-[#5FD3A3]";
  if (runs >= 50) return "bg-[#5FD3A3]";
  if (runs >= 20) return "bg-[#F2A65A]";
  return "bg-[#E85D5D]";
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
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0B0F14]/70 border-b border-white/[0.06]">
      <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3.5">
        <button
          onClick={onBack}
          aria-label="Go back"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.09] active:scale-95 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
        >
          <ArrowLeft size={18} className="text-[#E8EDF2]" />
        </button>
        <h1 className="font-[Space_Grotesk] text-[15px] font-medium tracking-wide text-[#E8EDF2] truncate max-w-[55%]">
          {name || "Player Profile"}
        </h1>
        <button
          onClick={onShare}
          aria-label="Share profile"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.09] active:scale-95 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
        >
          <Share2 size={17} className="text-[#E8EDF2]" />
        </button>
      </div>
    </header>
  );
}

function PlayerAvatar({
  image,
  name,
}: {
  image: string | null;
  name: string;
}) {
  const [errored, setErrored] = useState(false);
  const showFallback = !image || errored;
  return (
    <div className="relative w-[120px] h-[120px] shrink-0">
      <div className="absolute inset-[-14px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.35)_0%,transparent_70%)] blur-xl" />
      {showFallback ? (
        <div className="relative w-full h-full rounded-full border-[3px] border-white/90 shadow-[0_8px_32px_rgba(0,0,0,0.5)] bg-gradient-to-br from-[#1E3A5F] to-[#0B0F14] flex items-center justify-center">
          <span className="font-[Space_Grotesk] text-3xl font-bold text-[#D4AF37]">
            {getInitials(name)}
          </span>
        </div>
      ) : (
        <img
          src={image}
          alt={name}
          onError={() => setErrored(true)}
          className="relative w-full h-full rounded-full object-cover border-[3px] border-white/90 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        />
      )}
    </div>
  );
}

function Badge({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gradient-to-r from-[#D4AF37]/20 to-[#F4E5A1]/10 border border-[#D4AF37]/30 text-[#F4E5A1]">
      <Icon size={11} />
      {label}
    </span>
  );
}

function PlayerHero({ data }: { data: PlayerProfile }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[24px] bg-gradient-to-b from-[#12181F] to-[#0B0F14] border border-white/[0.06] shadow-[0_20px_60px_rgba(0,0,0,0.4)] px-6 py-9 flex flex-col items-center text-center"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08)_0%,transparent_60%)]" />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <PlayerAvatar image={data.playerImage} name={data.name} />
        <div>
          <h2 className="font-[Space_Grotesk] text-[26px] font-bold text-[#E8EDF2] leading-tight">
            {data.name}
          </h2>
          <div className="flex items-center justify-center gap-1.5 mt-1.5 text-[#8B98A5] text-sm">
            <Flag size={13} />
            <span>{data.country}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {data.role && <Badge icon={User} label={data.role} />}
          {data.isCaptain && <Badge icon={Trophy} label="Captain" />}
          {data.isKeeper && <Badge icon={Hand} label="Keeper" />}
        </div>
      </div>
    </motion.section>
  );
}

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
      className="rounded-[20px] bg-[#12181F] border border-white/[0.06] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-shadow hover:shadow-[0_8px_28px_rgba(0,0,0,0.35)]"
    >
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#1E3A5F] flex items-center justify-center mb-3">
        <Icon size={16} className="text-white" />
      </div>
      <div className="text-[11px] uppercase tracking-wider text-[#8B98A5] font-medium mb-1">
        {label}
      </div>
      <div className="text-[14px] text-[#E8EDF2] font-medium leading-snug">
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
    { icon: Hand, label: "Batting Style", value: data.battingStyle },
    { icon: Hand, label: "Bowling Style", value: data.bowlingStyle },
    { icon: Flag, label: "Country", value: data.country },
    ...(age ? [{ icon: Calendar, label: "Age", value: `${age} years` }] : []),
  ];
  return (
    <section>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item, i) => (
          <InfoCard key={i} {...item} />
        ))}
      </div>
    </section>
  );
}

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
      className={`flex items-center justify-between px-4 py-3.5 rounded-2xl transition-colors ${
        isTop
          ? "bg-gradient-to-r from-[#D4AF37]/15 to-[#F4E5A1]/5 border border-[#D4AF37]/30"
          : "bg-white/[0.02]"
      }`}
    >
      <span className="font-[Space_Grotesk] text-sm font-medium text-[#E8EDF2] w-16">
        {format}
      </span>
      <div className="flex items-center gap-8 font-[JetBrains_Mono]">
        <div className="text-center">
          <div
            className={`text-xl font-bold ${
              isTop ? "text-[#F4E5A1]" : "text-[#E8EDF2]"
            }`}
          >
            <AnimatedCounter value={current === "-" ? "-" : current} />
          </div>
          <div className="text-[10px] text-[#8B98A5] uppercase tracking-wide mt-0.5">
            Current
          </div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-[#8B98A5]">
            <AnimatedCounter value={best === "-" ? "-" : best} />
          </div>
          <div className="text-[10px] text-[#8B98A5] uppercase tracking-wide mt-0.5">
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
    <section className="rounded-[24px] bg-[#12181F] border border-white/[0.06] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.25)]">
      <h3 className="font-[Space_Grotesk] text-[17px] font-semibold text-[#E8EDF2] mb-4 flex items-center gap-2">
        <Trophy size={17} className="text-[#D4AF37]" />
        ICC Rankings
      </h3>
      <div className="space-y-2.5">
        {rows.map((row) => (
          <RankingRow
            key={row.format}
            {...row}
            isTop={parseInt(row.current, 10) === topRank && topRank !== null}
          />
        ))}
      </div>
    </section>
  );
}

function TeamsCard({ teams }: { teams: string[] }) {
  if (!teams?.length) return null;
  return (
    <section className="rounded-[24px] bg-[#12181F] border border-white/[0.06] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.25)]">
      <h3 className="font-[Space_Grotesk] text-[17px] font-semibold text-[#E8EDF2] mb-4">
        Teams
      </h3>
      <div className="flex flex-wrap gap-2">
        {teams.map((team, i) => (
          <motion.span
            key={team + i}
            whileHover={{ scale: 1.05, y: -1 }}
            className="px-3.5 py-1.5 rounded-full text-[13px] font-medium text-[#E8EDF2] bg-gradient-to-br from-[#1E3A5F]/60 to-white/[0.03] border border-white/[0.08] cursor-default transition-shadow hover:shadow-[0_4px_16px_rgba(212,175,55,0.15)]"
          >
            {team}
          </motion.span>
        ))}
      </div>
    </section>
  );
}

function RecentFormCard({ form }: { form: BattingFormEntry[] }) {
  if (!form?.length) return null;
  return (
    <section className="rounded-[24px] bg-[#12181F] border border-white/[0.06] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.25)]">
      <h3 className="font-[Space_Grotesk] text-[17px] font-semibold text-[#E8EDF2] mb-4">
        Recent Form
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {form.map((entry, i) => (
          <div
            key={i}
            className="shrink-0 w-[140px] rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 relative overflow-hidden"
          >
            <div
              className={`absolute top-0 left-0 right-0 h-[3px] ${formIndicatorColor(
                entry.score
              )}`}
            />
            <div className="font-[JetBrains_Mono] text-xl font-bold text-[#E8EDF2] mt-1.5">
              {entry.score}
            </div>
            <div className="text-[13px] text-[#8B98A5] mt-1 truncate">
              vs {entry.opponent}
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#1E3A5F]/50 text-[#8FB4DB]">
                {entry.format}
              </span>
              <span className="text-[10px] text-[#5C6773]">{entry.date}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

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

function CareerSummaryCard({ summary }: { summary: CareerSummary | string }) {
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
    <section className="rounded-[24px] bg-[#12181F] border border-white/[0.06] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.25)]">
      <h3 className="font-[Space_Grotesk] text-[17px] font-semibold text-[#E8EDF2] mb-4">
        Career Summary
      </h3>
      <div className="flex gap-1.5 mb-4 p-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
        {CAREER_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative flex-1 py-2 text-[13px] font-medium rounded-full transition-colors duration-200 ${
              tab === t ? "text-[#0B0F14]" : "text-[#8B98A5] hover:text-[#E8EDF2]"
            }`}
          >
            {tab === t && (
              <motion.div
                layoutId="careerTabBg"
                className="absolute inset-0 bg-gradient-to-r from-[#D4AF37] to-[#F4E5A1] rounded-full"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
            <span className="relative z-10">{t}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.25 }}
        >
          {stats ? (
            <div className="grid grid-cols-2 gap-2.5">
              {STAT_LABELS.map(({ key, label }) =>
                stats[key] !== undefined ? (
                  <div
                    key={key}
                    className="rounded-xl bg-white/[0.02] px-3.5 py-2.5 flex items-center justify-between"
                  >
                    <span className="text-[12px] text-[#8B98A5]">{label}</span>
                    <span className="font-[JetBrains_Mono] text-[14px] font-semibold text-[#E8EDF2]">
                      {stats[key]}
                    </span>
                  </div>
                ) : null
              )}
            </div>
          ) : (
            <p className="text-sm text-[#5C6773] text-center py-6">
              No {tab} data available.
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

function PlayerBioCard({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  return (
    <section className="rounded-[24px] bg-[#12181F] border border-white/[0.06] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.25)]">
      <h3 className="font-[Space_Grotesk] text-[17px] font-semibold text-[#E8EDF2] mb-3">
        About Player
      </h3>
      <p
        className={`text-[14px] leading-relaxed text-[#B4BEC9] ${
          expanded ? "" : "line-clamp-5"
        }`}
      >
        {text}
      </p>
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-2.5 inline-flex items-center gap-1 text-[13px] font-medium text-[#D4AF37] hover:text-[#F4E5A1] transition-colors"
      >
        {expanded ? "Read Less" : "Read More"}
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
    </section>
  );
}

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
      label: "Best Ranking",
      detail: `T20I #${t20i.best}`,
      date: "",
    },
  ].filter(Boolean) as { label: string; detail: string; date: string }[];

  if (!items.length) return null;

  return (
    <section className="rounded-[24px] bg-[#12181F] border border-white/[0.06] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.25)]">
      <h3 className="font-[Space_Grotesk] text-[17px] font-semibold text-[#E8EDF2] mb-5">
        Achievements
      </h3>
      <div className="relative pl-6">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-[#D4AF37] via-white/10 to-transparent" />
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="relative pb-6 last:pb-0"
          >
            <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-[#D4AF37] ring-4 ring-[#0B0F14]" />
            <div className="text-[13px] font-semibold text-[#E8EDF2]">
              {item.label}
            </div>
            <div className="text-[13px] text-[#B4BEC9] mt-0.5">
              {item.detail}
            </div>
            {item.date && (
              <div className="text-[11px] text-[#5C6773] mt-0.5">
                {item.date}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

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
  return (
    <div className="grid grid-cols-3 gap-3">
      <button
        onClick={handleCopy}
        className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl bg-[#12181F] border border-white/[0.06] hover:bg-white/[0.05] active:scale-95 transition-all"
      >
        <Copy size={17} className="text-[#8FB4DB]" />
        <span className="text-[11px] text-[#B4BEC9]">
          {copied ? "Copied!" : "Copy Link"}
        </span>
      </button>
      <button
        onClick={onOpenCricbuzz}
        className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl bg-[#12181F] border border-white/[0.06] hover:bg-white/[0.05] active:scale-95 transition-all"
      >
        <ExternalLink size={17} className="text-[#8FB4DB]" />
        <span className="text-[11px] text-[#B4BEC9]">Cricbuzz</span>
      </button>
      <button
        onClick={onFavorite}
        className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl bg-[#12181F] border border-white/[0.06] hover:bg-white/[0.05] active:scale-95 transition-all"
      >
        <Heart
          size={17}
          className={isFavorite ? "text-[#E85D5D] fill-[#E85D5D]" : "text-[#8FB4DB]"}
        />
        <span className="text-[11px] text-[#B4BEC9]">
          {isFavorite ? "Favorited" : "Favorite"}
        </span>
      </button>
    </div>
  );
}

function HeroSkeleton() {
  return (
    <div className="rounded-[24px] bg-[#12181F] border border-white/[0.06] px-6 py-9 flex flex-col items-center gap-4 animate-pulse">
      <div className="w-[120px] h-[120px] rounded-full bg-white/[0.06]" />
      <div className="w-40 h-6 rounded-full bg-white/[0.06]" />
      <div className="w-24 h-4 rounded-full bg-white/[0.04]" />
      <div className="w-32 h-6 rounded-full bg-white/[0.04]" />
    </div>
  );
}

function CardSkeleton({ height = "h-40" }: { height?: string }) {
  return (
    <div
      className={`rounded-[24px] bg-[#12181F] border border-white/[0.06] ${height} animate-pulse`}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
      <HeroSkeleton />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[20px] bg-[#12181F] border border-white/[0.06] h-24 animate-pulse"
          />
        ))}
      </div>
      <CardSkeleton height="h-52" />
      <CardSkeleton height="h-32" />
      <CardSkeleton height="h-44" />
      <CardSkeleton height="h-64" />
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-24 flex flex-col items-center text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#E85D5D]/20 to-transparent flex items-center justify-center mb-5">
        <RefreshCw size={28} className="text-[#E85D5D]" />
      </div>
      <h2 className="font-[Space_Grotesk] text-xl font-semibold text-[#E8EDF2] mb-2">
        Unable to load player
      </h2>
      <p className="text-sm text-[#8B98A5] mb-6 max-w-xs">
        Something went wrong while fetching this profile. Check your connection and try again.
      </p>
      <button
        onClick={onRetry}
        className="px-6 py-3 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F4E5A1] text-[#0B0F14] font-medium text-sm hover:opacity-90 active:scale-95 transition-all"
      >
        Retry
      </button>
    </div>
  );
}

function EmptyState({ onBack }: { onBack: () => void }) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-24 flex flex-col items-center text-center">
      <div className="w-20 h-20 rounded-full bg-white/[0.04] flex items-center justify-center mb-5">
        <UserX size={28} className="text-[#8B98A5]" />
      </div>
      <h2 className="font-[Space_Grotesk] text-xl font-semibold text-[#E8EDF2] mb-2">
        Player Not Found
      </h2>
      <p className="text-sm text-[#8B98A5] mb-6 max-w-xs">
        We couldn't find a profile matching this ID. It may have been moved or doesn't exist.
      </p>
      <button
        onClick={onBack}
        className="px-6 py-3 rounded-full bg-white/[0.06] text-[#E8EDF2] font-medium text-sm hover:bg-white/[0.1] active:scale-95 transition-all"
      >
        Go Back
      </button>
    </div>
  );
}

export default function PlayerProfilePage() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<PlayerProfile | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error" | "notfound">(
    "loading"
  );
  const [isFavorite, setIsFavorite] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!profileId) return;
    setStatus("loading");
    try {
      const res = await fetch(`/api/player/profile?profileId=${profileId}`);
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

  const handleBack = () => navigate(-1);

  const handleShare = async () => {
    if (navigator.share && data) {
      try {
        await navigator.share({
          title: `${data.name} - Player Profile`,
          url: window.location.href,
        });
      } catch {
        /* user cancelled */
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
      window.open(`https://www.cricbuzz.com/profiles/${profileId}`, "_blank");
    }
  };

  const summaryText =
    typeof data?.careerSummary === "string"
      ? data.careerSummary
      : data?.careerSummary?.text || "";

  return (
    <div className="min-h-screen bg-[#0B0F14] bg-[radial-gradient(ellipse_at_top,rgba(30,58,95,0.15)_0%,transparent_50%)]">
      <StickyHeader onBack={handleBack} onShare={handleShare} name={data?.name} />

      {status === "loading" && <LoadingSkeleton />}
      {status === "error" && <ErrorState onRetry={fetchProfile} />}
      {status === "notfound" && <EmptyState onBack={handleBack} />}

      {status === "success" && data && (
        <main className="max-w-2xl mx-auto px-4 py-5 space-y-5 pb-10">
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
