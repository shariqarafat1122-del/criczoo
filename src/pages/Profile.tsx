import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { 
  ArrowLeft, Share2, Star, MapPin, Calendar, Trophy, Activity, Users, 
  FileText, ChevronUp, ChevronDown, ExternalLink, RefreshCw, AlertCircle, 
  UserX, TrendingUp, Goal, Shield, Target, Zap 
} from "lucide-react";

interface ICCRanking {
  current: string | number;
  best: string | number;
}

interface FormEntry {
  score: string;
  opponent: string;
  format: string;
  date: string;
}

interface CareerStats {
  matches?: number;
  runs?: number;
  highest?: number;
  average?: number;
  strikeRate?: number;
  fifties?: number;
  hundreds?: number;
  fours?: number;
  sixes?: number;
  notOuts?: number;
}

interface PlayerData {
  success: boolean;
  profileId: string;
  name: string;
  country: string;
  playerImage: string;
  born: string;
  birthPlace: string;
  role: string;
  battingStyle: string;
  bowlingStyle: string;
  iccRankings: {
    test?: ICCRanking;
    odi?: ICCRanking;
    t20i?: ICCRanking;
  };
  teams: string[];
  battingForm: FormEntry[];
  careerSummary?: {
    test?: CareerStats;
    odi?: CareerStats;
    t20i?: CareerStats;
    ipl?: CareerStats;
  };
  bio?: string;
}

// Utility Functions
const getInitials = (name: string) =>
  name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

const getCountryFlag = (c: string) => {
  const map: Record<string, string> = {
    India: "🇮🇳",
    Australia: "🇦🇺",
    England: "🏏",
    "South Africa": "🇿🇦",
    "New Zealand": "🇳🇿",
    Pakistan: "🇵🇰",
    Sri Lanka: "🇱🇰",
    "West Indies": "🇼🇮",
    Bangladesh: "🇧🇩",
    Afghanistan: "🇦🇫"
  };
  return map[c] || "⚫";
};

const getScoreColor = (score: string) => {
  const runs = parseInt(score.replace(/\D/g, ""), 10);
  if (runs >= 50) return "from-[#009270] to-[#00b884]";
  if (runs >= 10) return "from-blue-500 to-cyan-400";
  return "from-gray-400 to-gray-300";
};

const getScoreBg = (score: string) => {
  const runs = parseInt(score.replace(/\D/g, ""), 10);
  if (runs >= 50) return "bg-[#009270]/[0.06] dark:bg-[#009270]/[0.1] border-[#009270]/20";
  if (runs >= 10) return "bg-blue-500/[0.05] dark:bg-blue-500/[0.08] border-blue-400/20";
  return "bg-gray-100 dark:bg-white/[0.02] border-gray-200 dark:border-white/[0.06]";
};

// Components
const Counter = ({ target, duration = 1.2 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const step = target / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  returnspan ref={ref} className="tabular-nums">{countspan>;
};

const Skeleton = () => (
 div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
   div className="h-14 bg-white/80 dark:bg-[#111815]/80 rounded-2xl animate-pulse" />
   div className="bg-white dark:bg-[#111815] rounded-3xl p-6 shadow-sm border border-black/[0.04] dark:border-white/[0.06]">
     div className="flex flex-col items-center gap-4">
       div className="h-[120px] w-[120px] rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
       div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
       div className="h-4 w-32 bg-gray-100 dark:bg-gray-800/60 rounded animate-pulse" />
       div className="flex gap-2">
         div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
         div className="h-6 w-16 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
       div>
     div>
     div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
         div key={i} className="h-24 bg-white dark:bg-[#111815] rounded-2xl animate-pulse border border-black/[0.04] dark:border-white/[0.06]" />
        ))}
       div className="h-40 bg-white dark:bg-[#111815] rounded-3xl animate-pulse border border-black/[0.04] dark:border-white/[0.06]" />
       div className="h-36 bg-white dark:bg-[#111815] rounded-3xl animate-pulse border border-black/[0.04] dark:border-white/[0.06]" />
       div className="h-44 bg-white dark:bg-[#111815] rounded-3xl animate-pulse border border-black/[0.04] dark:border-white/[0.06]" />
     div>
   div>
 div>
);

const ErrorState = ({ msg, onRetry }) => (
 motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="max-w-lg mx-auto px-6 py-20 flex flex-col items-center gap-5"
  >
   div className="relative">
     div className="h-28 w-28 rounded-full bg-red-50 dark:bg-red-900/15 flex items-center justify-center">
       AlertCircle className="h-12 w-12 text-red-400" />
     div>
     div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-white dark:bg-[#111815] border-2 border-red-200 dark:border-red-800 flex items-center justify-center shadow-sm">
       RefreshCw className="h-5 w-5 text-red-500" />
     div>
   div>
   div className="text-center space-y-1.5">
     h3 className="text-xl font-bold text-gray-900 dark:text-white">Unable to Load Profileh3>
     p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">{msg || "Please check your connection and try again."p>
   div>
   motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onRetry}
      className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#00b884] to-[#009270] text-white rounded-full font-semibold shadow-lg shadow-[#009270]/25"
    >
     RefreshCw className="h-4 w-4" />
      Try Again
   motion.button>
 div>
);

const EmptyState = () => (
 motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="max-w-lg mx-auto px-6 py-20 flex flex-col items-center gap-5"
  >
   div className="h-28 w-28 rounded-full bg-gray-100 dark:bg-gray-800/50 flex items-center justify-center">
     UserX className="h-12 w-12 text-gray-400" />
   div>
   div className="text-center space-y-1.5">
     h3 className="text-xl font-bold text-gray-900 dark:text-white">Player Not Foundh3>
     p className="text-sm text-gray-500 dark:text-gray-400">The requested profile could not be locatedp>
   div>
 div>
);

const StickyHeader = ({ onBack }) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
   motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? "bg-white/80 dark:bg-[#0a0f0d]/80 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.05)] dark:shadow-[#0_1px_0_rgba(255,255,255,0.05)]" : "bg-transparent"}`}
    >
     div className="max-w-2xl mx-auto flex items-center justify-between px-4 h-14">
       motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="h-10 w-10 rounded-xl flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
        >
         ArrowLeft className="h-5 w-5" />
       motion.button>
       h1 className="text-[15px] font-bold text-gray-900 dark:text-white tracking-tight">Player Profileh1>
       motion.button
          whileTap={{ scale: 0.9 }}
          className="h-10 w-10 rounded-xl flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
        >
         Share2 className="h-5 w-5" />
       motion.button>
     div>
   motion.header>
  );
};

const PlayerHero = ({ data }) => (
 motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
    className="bg-white dark:bg-[#111815] rounded-3xl p-5 sm:p-6 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_30px_-8px_rgba(0,0,0,0.4)] border border-black/[0.04] dark:border-white/[0.06]"
  >
   div className="flex flex-col items-center text-center">
     div className="relative group">
       div className="absolute -inset-1 bg-gradient-to-br from-[#00b884] to-[#009270] rounded-full blur opacity-25 group-hover:opacity-40 transition-opacity duration-500" />
       div className="relative h-[120px] w-[120px] rounded-full overflow-hidden border-4 border-white dark:border-[#1a2420] shadow-lg">
          {data.playerImage ? (
           img src={data.playerImage} alt={data.name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
           div className="w-full h-full bg-gradient-to-br from-[#009270]/20 to-[#00b884]/20 dark:from-[#009270]/10 dark:to-[#00b884]/10 flex items-center justify-center text-3xl font-black text-[#009270] dark:text-[#3ddba4]">
              {getInitials(data.name)}
           div>
          )}
       div>
       div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white dark:bg-[#111815] rounded-full px-2 py-0.5 shadow-md border border-black/[0.04] dark:border-white/[0.06] text-lg">
          {getCountryFlag(data.country)}
       div>
     div>
     h2 className="mt-4 text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">{data.nameh2>
     p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{data.countryp>
     div className="flex items-center gap-2 mt-3">
       span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[#009270]/10 to-[#00b884]/10 dark:from-[#009270]/20 dark:to-[#00b884]/20 text-[#00734f] dark:text-[#3ddba4] border border-[#009270]/20 dark:border-[#3ddba4]/20">
         Shield className="h-3 w-3" />
          {data.role}
       span>
        {data.battingStyle.includes("Right") && (
         span className="text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/[0.06] px-2 py-1 rounded-full">RH Batspan>
        )}
        {data.battingStyle.includes("Left") && (
         span className="text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/[0.06] px-2 py-1 rounded-full">LH Batspan>
        )}
     div>
   div>
 motion.div>
);

const InfoGrid = ({ data }) => {
  const items = [
    { label: "Born", value: data.born, icon:Calendar className="h-4 w-4" />, color: "text-blue-500" },
    { label: "Birth Place", value: data.birthPlace, icon:MapPin className="h-4 w-4" />, color: "text-purple-500" },
    { label: "Batting Style", value: data.battingStyle || "―", icon:Activity className="h-4 w-4" />, color: "text-amber-500" },
    { label: "Bowling Style", value: data.bowlingStyle || "―", icon:Target className="h-4 w-4" />, color: "text-rose-500" },
    { label: "Age", value: data.born?.match(/\((\d+)\s*years?\)/)?.[1] || "―", icon:rophy className="h-4 w-4" />, color: "text-green-500" },
    { label: "Teams", value: `${data.teams.length} Teams`, icon:Users className="h-4 w-4" />, color: "text-indigo-500" },
  ];

  return (
   motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="grid grid-cols-2 gap-3"
    >
      {items.map((item, i) => (
       motion.div
          key={i}
          whileHover={{ y: -2 }}
          className="bg-white dark:bg-[#111815] rounded-2xl p-4 shadow-sm border border-black/[0.04] dark:border-white/[0.06] flex flex-col gap-1.5"
        >
         div className={`flex items-center gap-1.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider ${item.color}`}>
            {item.icon}
            {item.label}
         div>
         div className="text-sm sm:text-[15px] font-bold text-gray-900 dark:text-white truncate leading-snug">
            {item.value}
         div>
       motion.div>
      ))}
   motion.div>
  );
};

const RankingCard = ({ rankings }) => {
  const getRank = (r: ICCRanking): { current: string | number; best: string | number } => {
    if (!r) return { current: "―", best: "―" };
    if (typeof r === "string") return { current: r, best: "―" };
    return { current: r.current, best: r.best };
  };

  const rows = [
    { format: "Test", ...getRank(rankings.test) },
    { format: "ODI", ...getRank(rankings.odi) },
    { format: "T20I", ...getRank(rankings.t20i) },
  ].filter(r => r.current !== "―" || r.best !== "―");

  if (!rows.length) return null;

  return (
   motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white dark:bg-[#111815] rounded-3xl shadow-sm border border-black/[0.04] dark:border-white/[0.06] overflow-hidden"
    >
     div className="px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.05] flex items-center gap-2.5">
       span className="w-1 h-5 rounded-full bg-gradient-to-b from-[#00b884] to-[#009270]" />
       span className="text-[11px] font-bold text-[#00734f] dark:text-[#3ddba4] uppercase tracking-wider">ICC Rankingsspan>
     div>
     div className="px-5 py-4">
       div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">
         span>Formatspan>
         span className="flex gap-6span>Currentspanspan>Bestspanspan>
       div>
        {rows.map((r, i) => (
         motion.div
            key={r.format}
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.25 + i * 0.05 }}
            className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-white/[0.04] last:border-0"
          >
           span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{r.formatspan>
           div className="flex gap-6">
             span className="text-sm font-black text-gray-900 dark:text-white tabular-nums w-6 text-right">
                {typeof r.current === "number" ?Counter target={r.current} /> : r.current}
             span>
             span className="text-sm font-bold text-gray-500 dark:text-gray-400 tabular-nums w-6 text-right">{r.bestspan>
           div>
         motion.div>
        ))}
     div>
   motion.div>
  );
};

const TeamsCard = ({ teams }) => (
 motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.25 }}
    className="bg-white dark:bg-[#111815] rounded-3xl p-5 shadow-sm border border-black/[0.04] dark:border-white/[0.06]"
  >
   div className="flex items-center gap-2.5 mb-4">
     span className="w-1 h-5 rounded-full bg-gradient-to-b from-[#00b884] to-[#009270]" />
     span className="text-[11px] font-bold text-[#00734f] dark:text-[#3ddba4] uppercase tracking-wider">Teamsspan>
   div>
   div className="flex flex-wrap gap-2">
      {teams.map((t, i) => (
       motion.span
          key={i}
          whileHover={{ scale: 1.05 }}
          className=`inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-semibold bg-gray-50 dark:bg-white/[0.04] text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-white/[0.06] hover:border-[#009270]/30 dark:hover:border-[#3ddba4]/30 transition-colors cursor-default`
        >
          {t}
       motion.span>
      ))}
   div>
 motion.div>
);

const RecentFormCard = ({ forms }) => (
 motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
    className="bg-white dark:bg-[#111815] rounded-3xl p-5 shadow-sm border border-black/[0.04] dark:border-white/[0.06]"
  >
   div className="flex items-center justify-between mb-4">
     div className="flex items-center gap-2.5">
       span className="w-1 h-5 rounded-full bg-gradient-to-b from-[#00b884] to-[#009270]" />
       span className="text-[11px] font-bold text-[#00734f] dark:text-[#3ddba4] uppercase tracking-wider">Recent Formspan>
     div>
     Activity className="h-4 w-4 text-gray-400" />
   div>
   div className="overflow-x-auto no-scrollbar flex gap-3 pb-1">
      {forms.map((f, i) => (
       motion.div
          key={i}
          whileHover={{ y: -2 }}
          className={`flex-shrink-0 w-[110px] rounded-2xl p-3 border transition-all ${getScoreBg(f.score)} flex flex-col items-center text-center`}
        >
         span className={`text-lg font-black bg-gradient-to-r ${getScoreColor(f.score)} bg-clip-text text-transparent tabular-nums`}>
            {f.score}
         span>
         span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-0.5">{f.opponentspan>
         span className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 mt-0.5">{f.formatspan>
         span className="text-[9px] text-gray-400 dark:text-gray-500 mt-1">{f.datespan>
       motion.div>
      ))}
   div>
 motion.div>
);

const CareerSummaryCard = ({ stats }) => {
  const tabs = [
    { id: "test", label: "Test" },
    { id: "odi", label: "ODI" },
    { id: "t20i", label: "T20I" },
    { id: "ipl", label: "IPL" }
  ].filter(t => stats?.[t.id as keyof typeof stats]);

  const [active, setActive] = useState(tabs[0]?.id || "test");
  const current = (stats?.[active as keyof typeof stats] || {}) as CareerStats;
  const cols = ["Mat", "Runs", "HS", "Avg", "SR", "50s", "100s", "4s", "6s", "NO"];
  const vals = [
    current.matches,
    current.runs,
    current.highest,
    current.average,
    current.strikeRate,
    current.fifties,
    current.hundreds,
    current.fours,
    current.sixes,
    current.notOuts
  ];

  return (
   motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="bg-white dark:bg-[#111815] rounded-3xl shadow-sm border border-black/[0.04] dark:border-white/[0.06] overflow-hidden"
    >
     div className="px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.05] flex items-center justify-between">
       div className="flex items-center gap-2.5">
         span className="w-1 h-5 rounded-full bg-gradient-to-b from-[#00b884] to-[#009270]" />
         span className="text-[11px] font-bold text-[#00734f] dark:text-[#3ddba4] uppercase tracking-wider">Career Summaryspan>
       div>
       div className="relative flex p-1 bg-gray-100 dark:bg-white/[0.04] rounded-lg">
          {tabs.map(t => (
           button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors ${active === t.id ? "bg-white dark:bg-[#111815] shadow-sm text-[#00734f] dark:text-[#3ddba4]" : "text-gray-500 dark:text-gray-400"}`}
            >
              {t.label}
           button>
          )
        ))}
     div>
   div>
   div className="p-5 overflow-x-auto">
     div className="flex min-w-[600px] justify-between">
        {cols.map((c, i) => (
         div key={c} className="flex flex-col items-center flex-1">
           span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">{cspan>
           span className="text-[15px] font-black text-gray-900 dark:text-white tabular-nums">
              {typeof vals[i] === "number" ?Counter target={vals[i]} duration={0.8} /> : fmtNum(vals[i])}
           span>
         div>
        ))}
     div>
   div>
 motion.div>
);

const BioCard = ({ bio }) => {
  const [open, setOpen] = useState(false);
  if (!bio) return null;

  return (
   motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white dark:bg-[#111815] rounded-3xl p-5 shadow-sm border border-black/[0.04] dark:border-white/[0.06]"
    >
     div className="flex items-center justify-between mb-3">
       div className="flex items-center gap-2.5">
         span className="w-1 h-5 rounded-full bg-gradient-to-b from-[#00b884] to-[#009270]" />
         span className="text-[11px] font-bold text-[#00734f] dark:text-[#3ddba4] uppercase tracking-wider">About Playerspan>
       div>
       button
          onClick={() => setOpen(!open)}
          className="text-[10px] font-bold text-gray-500 hover:text-[#00734f] dark:hover:text-[#3ddba4] flex items-center gap-1 transition-colors"
        >
          {open ? "Read Less" : "Read More"}
          {open ?ChevronUp className="h-3 w-3" /> :ChevronDown className="h-3 w-3" />}
       button>
     div>
     AnimatePresence>
       motion.div
          initial={{ height: 120, opacity: 0 }}
          animate={{ height: open ? "auto" : 120, opacity: 1 }}
          exit={{ height: 120, opacity: 0 }}
          className="overflow-hidden text-sm text-gray-600 dark:text-gray-300 leading-relaxed"
        >
          {bio}
          {!open &&span className="inline-block w-16 h-5 bg-gradient-to-r from-transparent to-white dark:to-[#111815] absolute" />}
       motion.div>
     AnimatePresence>
   motion.div>
  );
};

const ActionButtons = () => (
 motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5 }}
    className="grid grid-cols-4 gap-3"
  >
    {[ 
      { icon:Share2 className="h-5 w-5" />, label: "Share" },
      { icon:ExternalLink className="h-5 w-5" />, label: "Cricbuzz" },
      { icon:Star className="h-5 w-5" />, label: "Favorite" },
      { icon:Zap className="h-5 w-5" />, label: "Stats" }
    ].map((btn, i) => (
     motion.button
        key={i}
        whileTap={{ scale: 0.9 }}
        className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white dark:bg-[#111815] shadow-sm border border-black/[0.04] dark:border-white/[0.06] text-gray-600 dark:text-gray-400 hover:text-[#00734f] dark:hover:text-[#3ddba4] hover:border-[#009270]/20 transition-colors"
      >
        {btn.icon}
       span className="text-[10px] font-bold">{btn.label}</span>
     motion.button>
    ))}
 motion.div>
);

// Main Component
export default function PlayerProfilePage() {
  const { profileId } = useParams
