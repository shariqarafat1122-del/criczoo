import React, { useState, useMemo, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════════
   INTERFACES
   ═══════════════════════════════════════════════════════════════════════ */

interface Country {
  countryId: number;
  name: string;
  imageId: number;
}

interface Team {
  teamId: number;
  teamName: string;
  teamShortName: string;
  teamImageId: number;
}

interface Role {
  roleId: number;
  name: string;
}

interface Status {
  statusId: number;
  name: string;
}

interface CapStatus {
  capId: number;
  name: string;
}

interface SortOption {
  key: string;
  label: string;
  order: "asc" | "desc";
}

interface Filters {
  countries: Country[];
  roles: Role[];
  caps: CapStatus[];
  statuses: Status[];
  teams: Team[];
}

interface EditorPickMeta {
  label: string;
  tag: "SMART_BUY" | "SURPRISE_PICK" | "TOP_PICK";
  intro: string[];
}

interface Player {
  playerId: number;
  playerName: string;
  playerImageId: number;
  countryId: number;
  countryName: string;
  countryImageId: number;
  roleId: number;
  role: string;
  capStatus: "CAPPED" | "UNCAPPED";
  auctionStatus: "SOLD" | "UNSOLD" | "RETAINED" | "RTM" | "DRAFTED";
  basePrice: number;
  finalPrice: number;
  teamId: number | null;
  teamName: string | null;
  teamImageId: number | null;
  updatedAt: number;
  isEditorPick: boolean;
  editorPick?: EditorPickMeta;
}

interface AuctionData {
  success: boolean;
  auctionTitle: string;
  auctionYear: number;
  auctionStatus: "LIVE" | "PAUSED" | "COMPLETED";
  currency: string;
  totalPlayers: number;
  soldPlayers: number;
  retainedPlayers: number;
  unsoldPlayers: number;
  overseasPlayers: number;
  indianPlayers: number;
  totalTeams: number;
  sortOptions: SortOption[];
  filters: Filters;
  players: Player[];
}

/* ═══════════════════════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════════════════════ */

const AUCTION: AuctionData = {
  success: true,
  auctionTitle: "IPL Auction 2026",
  auctionYear: 2026,
  auctionStatus: "LIVE",
  currency: "Cr",
  totalPlayers: 24,
  soldPlayers: 14,
  retainedPlayers: 4,
  unsoldPlayers: 4,
  overseasPlayers: 9,
  indianPlayers: 15,
  totalTeams: 10,
  sortOptions: [
    { key: "updatedAt", label: "Recent First", order: "desc" },
    { key: "isEditorPick", label: "Editor's Picks", order: "desc" },
    { key: "basePrice", label: "Base Price: High → Low", order: "desc" },
    { key: "basePrice", label: "Base Price: Low → High", order: "asc" },
    { key: "finalPrice", label: "Final Price: High → Low", order: "desc" },
    { key: "finalPrice", label: "Final Price: Low → High", order: "asc" },
  ],
  filters: {
    countries: [
      { countryId: 1, name: "India", imageId: 226 },
      { countryId: 2, name: "Australia", imageId: 227 },
      { countryId: 3, name: "England", imageId: 228 },
      { countryId: 4, name: "South Africa", imageId: 229 },
      { countryId: 5, name: "New Zealand", imageId: 230 },
      { countryId: 6, name: "West Indies", imageId: 231 },
      { countryId: 7, name: "Sri Lanka", imageId: 232 },
      { countryId: 8, name: "Afghanistan", imageId: 233 },
    ],
    roles: [
      { roleId: 1, name: "Batter" },
      { roleId: 2, name: "Bowler" },
      { roleId: 3, name: "All-Rounder" },
      { roleId: 4, name: "WK-Batter" },
    ],
    caps: [
      { capId: 1, name: "CAPPED" },
      { capId: 2, name: "UNCAPPED" },
    ],
    statuses: [
      { statusId: 1, name: "SOLD" },
      { statusId: 2, name: "UNSOLD" },
      { statusId: 3, name: "RETAINED" },
      { statusId: 4, name: "RTM" },
      { statusId: 5, name: "DRAFTED" },
    ],
    teams: [
      { teamId: 1, teamName: "Mumbai Indians", teamShortName: "MI", teamImageId: 226288 },
      { teamId: 2, teamName: "Chennai Super Kings", teamShortName: "CSK", teamImageId: 226289 },
      { teamId: 3, teamName: "Royal Challengers Bengaluru", teamShortName: "RCB", teamImageId: 226290 },
      { teamId: 4, teamName: "Kolkata Knight Riders", teamShortName: "KKR", teamImageId: 226291 },
      { teamId: 5, teamName: "Sunrisers Hyderabad", teamShortName: "SRH", teamImageId: 226292 },
      { teamId: 6, teamName: "Delhi Capitals", teamShortName: "DC", teamImageId: 226293 },
      { teamId: 7, teamName: "Rajasthan Royals", teamShortName: "RR", teamImageId: 226294 },
      { teamId: 8, teamName: "Punjab Kings", teamShortName: "PBKS", teamImageId: 226295 },
      { teamId: 9, teamName: "Gujarat Titans", teamShortName: "GT", teamImageId: 226296 },
      { teamId: 10, teamName: "Lucknow Super Giants", teamShortName: "LSG", teamImageId: 226297 },
    ],
  },
  players: [
    {
      playerId: 101,
      playerName: "Rishabh Pant",
      playerImageId: 626,
      countryId: 1,
      countryName: "India",
      countryImageId: 226,
      roleId: 4,
      role: "WK-Batter",
      capStatus: "CAPPED",
      auctionStatus: "SOLD",
      basePrice: 2.0,
      finalPrice: 27.0,
      teamId: 10,
      teamName: "Lucknow Super Giants",
      teamImageId: 226297,
      updatedAt: Date.now() - 1000 * 60 * 5,
      isEditorPick: true,
      editorPick: {
        label: "TOP PICK",
        tag: "TOP_PICK",
        intro: [
          "Most expensive buy of the auction night at ₹27 Cr",
          "Aggressive finisher with proven big-match temperament",
          "Adds explosive batting depth & wicket-keeping to LSG",
        ],
      },
    },
    {
      playerId: 102,
      playerName: "Shreyas Iyer",
      playerImageId: 627,
      countryId: 1,
      countryName: "India",
      countryImageId: 226,
      roleId: 1,
      role: "Batter",
      capStatus: "CAPPED",
      auctionStatus: "SOLD",
      basePrice: 2.0,
      finalPrice: 26.75,
      teamId: 8,
      teamName: "Punjab Kings",
      teamImageId: 226295,
      updatedAt: Date.now() - 1000 * 60 * 15,
      isEditorPick: true,
      editorPick: {
        label: "SMART BUY",
        tag: "SMART_BUY",
        intro: [
          "IPL-winning captain, natural leadership fit for PBKS",
          "Dominant vs spin, key middle-order anchor",
          "Provides tactical clarity and player-management edge",
        ],
      },
    },
    {
      playerId: 103,
      playerName: "Jos Buttler",
      playerImageId: 628,
      countryId: 3,
      countryName: "England",
      countryImageId: 228,
      roleId: 4,
      role: "WK-Batter",
      capStatus: "CAPPED",
      auctionStatus: "SOLD",
      basePrice: 2.0,
      finalPrice: 15.75,
      teamId: 9,
      teamName: "Gujarat Titans",
      teamImageId: 226296,
      updatedAt: Date.now() - 1000 * 60 * 45,
      isEditorPick: true,
      editorPick: {
        label: "SURPRISE PICK",
        tag: "SURPRISE_PICK",
        intro: [
          "Global T20 superstar switches franchise to GT",
          "Powerplay wrecker with best-in-class strike rate",
          "Ideal replacement for departing overseas openers",
        ],
      },
    },
    {
      playerId: 104,
      playerName: "David Miller",
      playerImageId: 629,
      countryId: 4,
      countryName: "South Africa",
      countryImageId: 229,
      roleId: 1,
      role: "Batter",
      capStatus: "CAPPED",
      auctionStatus: "SOLD",
      basePrice: 1.5,
      finalPrice: 7.5,
      teamId: 10,
      teamName: "Lucknow Super Giants",
      teamImageId: 226297,
      updatedAt: Date.now() - 1000 * 60 * 90,
      isEditorPick: false,
    },
    {
      playerId: 105,
      playerName: "Mitchell Starc",
      playerImageId: 630,
      countryId: 2,
      countryName: "Australia",
      countryImageId: 227,
      roleId: 2,
      role: "Bowler",
      capStatus: "CAPPED",
      auctionStatus: "SOLD",
      basePrice: 2.0,
      finalPrice: 22.5,
      teamId: 4,
      teamName: "Kolkata Knight Riders",
      teamImageId: 226291,
      updatedAt: Date.now() - 1000 * 60 * 120,
      isEditorPick: true,
      editorPick: {
        label: "TOP PICK",
        tag: "TOP_PICK",
        intro: [
          "World-class left-arm pacer for KKR's spearhead role",
          "Death-overs specialist with elite yorker execution",
          "Big-money marquee buy signals title intent",
        ],
      },
    },
    {
      playerId: 106,
      playerName: "Kane Williamson",
      playerImageId: 631,
      countryId: 5,
      countryName: "New Zealand",
      countryImageId: 230,
      roleId: 1,
      role: "Batter",
      capStatus: "CAPPED",
      auctionStatus: "UNSOLD",
      basePrice: 2.0,
      finalPrice: 0,
      teamId: null,
      teamName: null,
      teamImageId: null,
      updatedAt: Date.now() - 1000 * 60 * 180,
      isEditorPick: false,
    },
    {
      playerId: 107,
      playerName: "Hardik Pandya",
      playerImageId: 632,
      countryId: 1,
      countryName: "India",
      countryImageId: 226,
      roleId: 3,
      role: "All-Rounder",
      capStatus: "CAPPED",
      auctionStatus: "RETAINED",
      basePrice: 2.0,
      finalPrice: 16.35,
      teamId: 1,
      teamName: "Mumbai Indians",
      teamImageId: 226288,
      updatedAt: Date.now() - 1000 * 60 * 60 * 24,
      isEditorPick: false,
    },
    {
      playerId: 108,
      playerName: "Virat Kohli",
      playerImageId: 1413,
      countryId: 1,
      countryName: "India",
      countryImageId: 226,
      roleId: 1,
      role: "Batter",
      capStatus: "CAPPED",
      auctionStatus: "RETAINED",
      basePrice: 2.0,
      finalPrice: 21.0,
      teamId: 3,
      teamName: "Royal Challengers Bengaluru",
      teamImageId: 226290,
      updatedAt: Date.now() - 1000 * 60 * 60 * 26,
      isEditorPick: false,
    },
    {
      playerId: 109,
      playerName: "MS Dhoni",
      playerImageId: 265,
      countryId: 1,
      countryName: "India",
      countryImageId: 226,
      roleId: 4,
      role: "WK-Batter",
      capStatus: "CAPPED",
      auctionStatus: "RETAINED",
      basePrice: 4.0,
      finalPrice: 4.0,
      teamId: 2,
      teamName: "Chennai Super Kings",
      teamImageId: 226289,
      updatedAt: Date.now() - 1000 * 60 * 60 * 30,
      isEditorPick: false,
    },
    {
      playerId: 110,
      playerName: "Rohit Sharma",
      playerImageId: 576,
      countryId: 1,
      countryName: "India",
      countryImageId: 226,
      roleId: 1,
      role: "Batter",
      capStatus: "CAPPED",
      auctionStatus: "RETAINED",
      basePrice: 2.0,
      finalPrice: 16.3,
      teamId: 1,
      teamName: "Mumbai Indians",
      teamImageId: 226288,
      updatedAt: Date.now() - 1000 * 60 * 60 * 32,
      isEditorPick: false,
    },
    {
      playerId: 111,
      playerName: "Yuzvendra Chahal",
      playerImageId: 633,
      countryId: 1,
      countryName: "India",
      countryImageId: 226,
      roleId: 2,
      role: "Bowler",
      capStatus: "CAPPED",
      auctionStatus: "SOLD",
      basePrice: 2.0,
      finalPrice: 18.0,
      teamId: 8,
      teamName: "Punjab Kings",
      teamImageId: 226295,
      updatedAt: Date.now() - 1000 * 60 * 200,
      isEditorPick: false,
    },
    {
      playerId: 112,
      playerName: "Sanju Samson",
      playerImageId: 634,
      countryId: 1,
      countryName: "India",
      countryImageId: 226,
      roleId: 4,
      role: "WK-Batter",
      capStatus: "CAPPED",
      auctionStatus: "RTM",
      basePrice: 2.0,
      finalPrice: 14.0,
      teamId: 7,
      teamName: "Rajasthan Royals",
      teamImageId: 226294,
      updatedAt: Date.now() - 1000 * 60 * 240,
      isEditorPick: false,
    },
    {
      playerId: 113,
      playerName: "Trent Boult",
      playerImageId: 635,
      countryId: 5,
      countryName: "New Zealand",
      countryImageId: 230,
      roleId: 2,
      role: "Bowler",
      capStatus: "CAPPED",
      auctionStatus: "SOLD",
      basePrice: 2.0,
      finalPrice: 12.5,
      teamId: 7,
      teamName: "Rajasthan Royals",
      teamImageId: 226294,
      updatedAt: Date.now() - 1000 * 60 * 260,
      isEditorPick: false,
    },
    {
      playerId: 114,
      playerName: "Rashid Khan",
      playerImageId: 636,
      countryId: 8,
      countryName: "Afghanistan",
      countryImageId: 233,
      roleId: 3,
      role: "All-Rounder",
      capStatus: "CAPPED",
      auctionStatus: "RETAINED",
      basePrice: 2.0,
      finalPrice: 18.0,
      teamId: 9,
      teamName: "Gujarat Titans",
      teamImageId: 226296,
      updatedAt: Date.now() - 1000 * 60 * 60 * 40,
      isEditorPick: false,
    },
    {
      playerId: 115,
      playerName: "Nicholas Pooran",
      playerImageId: 637,
      countryId: 6,
      countryName: "West Indies",
      countryImageId: 231,
      roleId: 4,
      role: "WK-Batter",
      capStatus: "CAPPED",
      auctionStatus: "SOLD",
      basePrice: 2.0,
      finalPrice: 21.0,
      teamId: 10,
      teamName: "Lucknow Super Giants",
      teamImageId: 226297,
      updatedAt: Date.now() - 1000 * 60 * 300,
      isEditorPick: false,
    },
    {
      playerId: 116,
      playerName: "Wanindu Hasaranga",
      playerImageId: 638,
      countryId: 7,
      countryName: "Sri Lanka",
      countryImageId: 232,
      roleId: 3,
      role: "All-Rounder",
      capStatus: "CAPPED",
      auctionStatus: "UNSOLD",
      basePrice: 1.5,
      finalPrice: 0,
      teamId: null,
      teamName: null,
      teamImageId: null,
      updatedAt: Date.now() - 1000 * 60 * 340,
      isEditorPick: false,
    },
    {
      playerId: 117,
      playerName: "Shubman Gill",
      playerImageId: 639,
      countryId: 1,
      countryName: "India",
      countryImageId: 226,
      roleId: 1,
      role: "Batter",
      capStatus: "CAPPED",
      auctionStatus: "RETAINED",
      basePrice: 2.0,
      finalPrice: 16.5,
      teamId: 9,
      teamName: "Gujarat Titans",
      teamImageId: 226296,
      updatedAt: Date.now() - 1000 * 60 * 60 * 50,
      isEditorPick: false,
    },
    {
      playerId: 118,
      playerName: "Marcus Stoinis",
      playerImageId: 640,
      countryId: 2,
      countryName: "Australia",
      countryImageId: 227,
      roleId: 3,
      role: "All-Rounder",
      capStatus: "CAPPED",
      auctionStatus: "SOLD",
      basePrice: 2.0,
      finalPrice: 11.0,
      teamId: 8,
      teamName: "Punjab Kings",
      teamImageId: 226295,
      updatedAt: Date.now() - 1000 * 60 * 360,
      isEditorPick: false,
    },
    {
      playerId: 119,
      playerName: "Arshdeep Singh",
      playerImageId: 641,
      countryId: 1,
      countryName: "India",
      countryImageId: 226,
      roleId: 2,
      role: "Bowler",
      capStatus: "CAPPED",
      auctionStatus: "RTM",
      basePrice: 2.0,
      finalPrice: 18.0,
      teamId: 8,
      teamName: "Punjab Kings",
      teamImageId: 226295,
      updatedAt: Date.now() - 1000 * 60 * 380,
      isEditorPick: false,
    },
    {
      playerId: 120,
      playerName: "Prasidh Krishna",
      playerImageId: 642,
      countryId: 1,
      countryName: "India",
      countryImageId: 226,
      roleId: 2,
      role: "Bowler",
      capStatus: "CAPPED",
      auctionStatus: "SOLD",
      basePrice: 2.0,
      finalPrice: 9.5,
      teamId: 9,
      teamName: "Gujarat Titans",
      teamImageId: 226296,
      updatedAt: Date.now() - 1000 * 60 * 420,
      isEditorPick: false,
    },
    {
      playerId: 121,
      playerName: "Sherfane Rutherford",
      playerImageId: 643,
      countryId: 6,
      countryName: "West Indies",
      countryImageId: 231,
      roleId: 1,
      role: "Batter",
      capStatus: "CAPPED",
      auctionStatus: "SOLD",
      basePrice: 1.0,
      finalPrice: 2.6,
      teamId: 9,
      teamName: "Gujarat Titans",
      teamImageId: 226296,
      updatedAt: Date.now() - 1000 * 60 * 460,
      isEditorPick: false,
    },
    {
      playerId: 122,
      playerName: "Rachin Ravindra",
      playerImageId: 644,
      countryId: 5,
      countryName: "New Zealand",
      countryImageId: 230,
      roleId: 3,
      role: "All-Rounder",
      capStatus: "CAPPED",
      auctionStatus: "SOLD",
      basePrice: 1.5,
      finalPrice: 1.8,
      teamId: 2,
      teamName: "Chennai Super Kings",
      teamImageId: 226289,
      updatedAt: Date.now() - 1000 * 60 * 500,
      isEditorPick: false,
    },
    {
      playerId: 123,
      playerName: "Kagiso Rabada",
      playerImageId: 645,
      countryId: 4,
      countryName: "South Africa",
      countryImageId: 229,
      roleId: 2,
      role: "Bowler",
      capStatus: "CAPPED",
      auctionStatus: "UNSOLD",
      basePrice: 2.0,
      finalPrice: 0,
      teamId: null,
      teamName: null,
      teamImageId: null,
      updatedAt: Date.now() - 1000 * 60 * 520,
      isEditorPick: false,
    },
    {
      playerId: 124,
      playerName: "Tilak Varma",
      playerImageId: 646,
      countryId: 1,
      countryName: "India",
      countryImageId: 226,
      roleId: 1,
      role: "Batter",
      capStatus: "UNCAPPED",
      auctionStatus: "DRAFTED",
      basePrice: 0.3,
      finalPrice: 8.0,
      teamId: 1,
      teamName: "Mumbai Indians",
      teamImageId: 226288,
      updatedAt: Date.now() - 1000 * 60 * 60 * 60,
      isEditorPick: false,
    },
  ],
};

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════ */

const cx = (...c: (string | false | undefined | null)[]): string =>
  c.filter(Boolean).join(" ");

const playerImg = (id: number): string =>
  `https://static.cricbuzz.com/a/img/v1/152x152/i1/c${id}/img.jpg`;

const teamImg = (id: number): string =>
  `https://static.cricbuzz.com/a/img/v1/72x72/i1/c${id}/img.jpg`;

const countryImg = (id: number): string =>
  `https://static.cricbuzz.com/a/img/v1/48x48/i1/c${id}/img.jpg`;

const formatPrice = (v: number, currency: string): string =>
  v > 0 ? `₹${v.toFixed(2)} ${currency}` : "—";

const initials = (n: string): string =>
  n
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");

const timeAgo = (ts: number): string => {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

const statusStyle = (s: Player["auctionStatus"]): string => {
  switch (s) {
    case "SOLD":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "UNSOLD":
      return "bg-red-100 text-red-700 border-red-200";
    case "RETAINED":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "RTM":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "DRAFTED":
      return "bg-orange-100 text-orange-700 border-orange-200";
  }
};

const statusDot = (s: Player["auctionStatus"]): string => {
  switch (s) {
    case "SOLD":
      return "bg-emerald-500";
    case "UNSOLD":
      return "bg-red-500";
    case "RETAINED":
      return "bg-blue-500";
    case "RTM":
      return "bg-purple-500";
    case "DRAFTED":
      return "bg-orange-500";
  }
};

const roleStyle = (r: string): string => {
  const l = r.toLowerCase();
  if (l.includes("wk"))
    return "bg-sky-100 text-sky-700 border-sky-200";
  if (l.includes("all"))
    return "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200";
  if (l.includes("bowl"))
    return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-indigo-100 text-indigo-700 border-indigo-200";
};

const editorPickBadge = (
  tag: EditorPickMeta["tag"]
): { classes: string; emoji: string } => {
  switch (tag) {
    case "SMART_BUY":
      return {
        classes:
          "bg-gradient-to-r from-emerald-500 to-teal-600 text-white",
        emoji: "🎯",
      };
    case "SURPRISE_PICK":
      return {
        classes:
          "bg-gradient-to-r from-pink-500 to-rose-600 text-white",
        emoji: "✨",
      };
    case "TOP_PICK":
      return {
        classes:
          "bg-gradient-to-r from-amber-500 to-orange-600 text-white",
        emoji: "🏆",
      };
  }
};

const auctionStatusBadge = (s: AuctionData["auctionStatus"]): string => {
  switch (s) {
    case "LIVE":
      return "bg-red-500 text-white";
    case "PAUSED":
      return "bg-amber-500 text-white";
    case "COMPLETED":
      return "bg-slate-500 text-white";
  }
};

/* ═══════════════════════════════════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════════════════════════════════ */

interface IconProps {
  className?: string;
}

const I = {
  Search: ({ className }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  Sort: ({ className }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18M6 12h12M10 18h4" />
    </svg>
  ),
  Filter: ({ className }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
    </svg>
  ),
  Users: ({ className }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Check: ({ className }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  X: ({ className }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  Shield: ({ className }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Globe: ({ className }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  Flag: ({ className }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />
    </svg>
  ),
  ChevDown: ({ className }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  ChevLeft: ({ className }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  ),
  ChevRight: ({ className }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  ),
  Bat: ({ className }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 3.5 20.5 9.5" />
      <path d="M9 9 3 15a2.5 2.5 0 0 0 3.5 3.5L12 13" />
      <path d="M12.5 5.5 18.5 11.5 14 16 8 10Z" />
    </svg>
  ),
  Trophy: ({ className }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 21h8M12 17v4M17 4h3v3a4 4 0 0 1-4 4M7 4H4v3a4 4 0 0 0 4 4M17 4H7v6a5 5 0 0 0 10 0V4Z" />
    </svg>
  ),
  Cross: ({ className }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
    </svg>
  ),
  Star: ({ className }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  Empty: ({ className }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3M8 11h6" />
    </svg>
  ),
};

/* ═══════════════════════════════════════════════════════════════════════
   IMAGE COMPONENTS
   ═══════════════════════════════════════════════════════════════════════ */

interface PlayerAvatarProps {
  playerImageId: number;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  ring?: boolean;
}

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  playerImageId,
  name,
  size = "md",
  ring = false,
}) => {
  const [errored, setErrored] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);
  const sizes: Record<NonNullable<PlayerAvatarProps["size"]>, string> = {
    sm: "w-10 h-10 text-xs",
    md: "w-14 h-14 text-sm",
    lg: "w-20 h-20 text-lg",
    xl: "w-28 h-28 text-2xl",
  };
  return (
    <div
      className={cx(
        "relative rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-slate-200 to-slate-300 shadow-md flex items-center justify-center",
        ring && "ring-4 ring-white",
        sizes[size]
      )}
    >
      {!errored && (
        <>
          {!loaded && (
            <div className="absolute inset-0 animate-pulse bg-slate-300" />
          )}
          <img
            src={playerImg(playerImageId)}
            alt={name}
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
            className={cx(
              "w-full h-full object-cover transition-opacity duration-300",
              loaded ? "opacity-100" : "opacity-0"
            )}
          />
        </>
      )}
      {errored && (
        <span className="font-black text-slate-600 select-none">
          {initials(name)}
        </span>
      )}
    </div>
  );
};

interface TeamBadgeProps {
  imageId: number | null;
  name: string | null;
  short?: string;
  size?: "sm" | "md" | "lg";
}

const TeamBadge: React.FC<TeamBadgeProps> = ({
  imageId,
  name,
  short,
  size = "sm",
}) => {
  const [errored, setErrored] = useState<boolean>(false);
  const sizes: Record<NonNullable<TeamBadgeProps["size"]>, string> = {
    sm: "w-6 h-6 text-[9px]",
    md: "w-9 h-9 text-[10px]",
    lg: "w-12 h-12 text-xs",
  };
  return (
    <div
      className={cx(
        "relative rounded-lg overflow-hidden bg-white shadow-sm ring-1 ring-slate-200 flex items-center justify-center flex-shrink-0",
        sizes[size]
      )}
    >
      {imageId && !errored ? (
        <img
          src={teamImg(imageId)}
          alt={name ?? "Team"}
          onError={() => setErrored(true)}
          className="w-full h-full object-contain p-0.5"
        />
      ) : (
        <span className="font-black text-slate-500">
          {short ?? (name ? initials(name) : "?")}
        </span>
      )}
    </div>
  );
};

interface CountryFlagProps {
  imageId: number;
  name: string;
  size?: "sm" | "md";
}

const CountryFlag: React.FC<CountryFlagProps> = ({
  imageId,
  name,
  size = "sm",
}) => {
  const [errored, setErrored] = useState<boolean>(false);
  const sizes: Record<NonNullable<CountryFlagProps["size"]>, string> = {
    sm: "w-4 h-3",
    md: "w-6 h-4",
  };
  if (errored)
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-500 font-semibold">
        {name}
      </span>
    );
  return (
    <img
      src={countryImg(imageId)}
      alt={name}
      onError={() => setErrored(true)}
      className={cx("object-cover rounded-sm shadow-sm", sizes[size])}
    />
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   SUMMARY CARD
   ═══════════════════════════════════════════════════════════════════════ */

interface SummaryCardProps {
  label: string;
  value: number;
  subtitle: string;
  gradient: string;
  icon: React.ReactNode;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  label,
  value,
  subtitle,
  gradient,
  icon,
}) => (
  <div
    className={cx(
      "relative overflow-hidden rounded-2xl p-4 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br",
      gradient
    )}
  >
    <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
    <div className="relative flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">
          {label}
        </p>
        <p className="text-2xl sm:text-3xl font-black mt-1 tabular-nums">
          {value}
        </p>
        <p className="text-[11px] font-semibold opacity-85 mt-0.5 truncate">
          {subtitle}
        </p>
      </div>
      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════
   EDITOR PICK CARD (slider item)
   ═══════════════════════════════════════════════════════════════════════ */

interface EditorPickCardProps {
  player: Player;
  currency: string;
}

const EditorPickCard: React.FC<EditorPickCardProps> = ({
  player,
  currency,
}) => {
  const pick = player.editorPick;
  if (!pick) return null;
  const badge = editorPickBadge(pick.tag);

  return (
    <article className="relative flex-shrink-0 w-[320px] sm:w-[380px] snap-start bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl border border-slate-200 hover:border-slate-300 transition-all duration-300 hover:-translate-y-1">
      {/* Colored top strip */}
      <div className="relative h-24 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,white,transparent_60%)]" />
        {/* Pick badge */}
        <div
          className={cx(
            "absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md",
            badge.classes
          )}
        >
          <span>{badge.emoji}</span>
          <span>{pick.label}</span>
        </div>
        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <span
            className={cx(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
              statusStyle(player.auctionStatus)
            )}
          >
            <span className={cx("w-1.5 h-1.5 rounded-full", statusDot(player.auctionStatus))} />
            {player.auctionStatus}
          </span>
        </div>
        {/* Team badge floating bottom right */}
        {player.teamImageId && (
          <div className="absolute -bottom-4 right-4">
            <TeamBadge
              imageId={player.teamImageId}
              name={player.teamName}
              size="md"
            />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-start gap-3 -mt-10 relative z-10">
          <PlayerAvatar
            playerImageId={player.playerImageId}
            name={player.playerName}
            size="lg"
            ring
          />
          <div className="pt-11 min-w-0 flex-1">
            <h3 className="text-[15px] font-black text-slate-900 leading-tight truncate">
              {player.playerName}
            </h3>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold mt-0.5">
              <CountryFlag
                imageId={player.countryImageId}
                name={player.countryName}
              />
              <span>{player.countryName}</span>
            </div>
          </div>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <span
            className={cx(
              "px-2 py-0.5 rounded-md text-[10px] font-black border",
              roleStyle(player.role)
            )}
          >
            {player.role}
          </span>
          <span
            className={cx(
              "px-2 py-0.5 rounded-md text-[10px] font-black border",
              player.capStatus === "CAPPED"
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-slate-100 text-slate-600 border-slate-200"
            )}
          >
            {player.capStatus}
          </span>
          {player.teamName && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200 truncate max-w-[140px]">
              {player.teamName}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Base
            </p>
            <p className="text-sm font-black text-slate-700 tabular-nums">
              {formatPrice(player.basePrice, currency)}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 px-3 py-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">
              Sold At
            </p>
            <p className="text-sm font-black text-emerald-700 tabular-nums">
              {formatPrice(player.finalPrice, currency)}
            </p>
          </div>
        </div>

        {/* Intro */}
        <ul className="mt-3 space-y-1.5">
          {pick.intro.slice(0, 3).map((line, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-[12px] text-slate-600 leading-snug"
            >
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-fuchsia-500 flex-shrink-0" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   PLAYER CARD (grid)
   ═══════════════════════════════════════════════════════════════════════ */

interface PlayerCardProps {
  player: Player;
  currency: string;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, currency }) => {
  const topGrad =
    player.auctionStatus === "SOLD"
      ? "from-emerald-400 to-teal-500"
      : player.auctionStatus === "UNSOLD"
      ? "from-red-400 to-rose-500"
      : player.auctionStatus === "RETAINED"
      ? "from-blue-400 to-indigo-500"
      : player.auctionStatus === "RTM"
      ? "from-purple-400 to-fuchsia-500"
      : "from-orange-400 to-amber-500";

  return (
    <article className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl border border-slate-200/70 hover:border-slate-300 transition-all duration-300 hover:-translate-y-1">
      {/* Gradient top border */}
      <div
        className={cx("h-1 w-full bg-gradient-to-r", topGrad)}
      />

      {/* Editor pick ribbon */}
      {player.isEditorPick && player.editorPick && (
        <div className="absolute top-3 right-3 z-10">
          <span
            className={cx(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md",
              editorPickBadge(player.editorPick.tag).classes
            )}
          >
            <I.Star className="w-2.5 h-2.5" />
            Editor Pick
          </span>
        </div>
      )}

      <div className="p-4">
        {/* Header row: avatar + name + country */}
        <div className="flex items-start gap-3">
          <PlayerAvatar
            playerImageId={player.playerImageId}
            name={player.playerName}
            size="lg"
            ring
          />
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="text-[15px] font-black text-slate-900 leading-tight truncate">
              {player.playerName}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <CountryFlag
                imageId={player.countryImageId}
                name={player.countryName}
              />
              <span className="text-[11px] font-semibold text-slate-500">
                {player.countryName}
              </span>
            </div>
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span
                className={cx(
                  "px-1.5 py-0.5 rounded-md text-[9.5px] font-black border",
                  roleStyle(player.role)
                )}
              >
                {player.role}
              </span>
              <span
                className={cx(
                  "px-1.5 py-0.5 rounded-md text-[9.5px] font-black border",
                  player.capStatus === "CAPPED"
                    ? "bg-slate-800 text-white border-slate-800"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                )}
              >
                {player.capStatus}
              </span>
              <span
                className={cx(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-black border",
                  statusStyle(player.auctionStatus)
                )}
              >
                <span
                  className={cx(
                    "w-1.5 h-1.5 rounded-full",
                    statusDot(player.auctionStatus)
                  )}
                />
                {player.auctionStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Price row */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Base Price
            </p>
            <p className="text-sm font-black text-slate-700 tabular-nums">
              {formatPrice(player.basePrice, currency)}
            </p>
          </div>
          <div
            className={cx(
              "rounded-xl border px-3 py-2",
              player.finalPrice > 0
                ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50"
                : "border-slate-200 bg-slate-50"
            )}
          >
            <p
              className={cx(
                "text-[9px] font-black uppercase tracking-widest",
                player.finalPrice > 0 ? "text-emerald-600" : "text-slate-500"
              )}
            >
              Auction Price
            </p>
            <p
              className={cx(
                "text-sm font-black tabular-nums",
                player.finalPrice > 0 ? "text-emerald-700" : "text-slate-500"
              )}
            >
              {formatPrice(player.finalPrice, currency)}
            </p>
          </div>
        </div>

        {/* Team row */}
        {player.teamName ? (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
            <TeamBadge
              imageId={player.teamImageId}
              name={player.teamName}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black text-slate-800 truncate leading-tight">
                {player.teamName}
              </p>
              <p className="text-[10px] font-semibold text-slate-500">
                Bought by
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200">
            <div className="w-9 h-9 rounded-lg bg-red-100 text-red-500 flex items-center justify-center">
              <I.Cross className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-black text-red-700">
                Not Sold
              </p>
              <p className="text-[10px] font-semibold text-red-500">
                No team assigned
              </p>
            </div>
          </div>
        )}

        {/* Intro (from editor if available) */}
        {player.editorPick?.intro?.[0] && (
          <p className="mt-3 text-[12px] text-slate-600 leading-snug line-clamp-2">
            {player.editorPick.intro[0]}
          </p>
        )}

        {/* Updated at */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
          <span>Updated {timeAgo(player.updatedAt)}</span>
          <span>#{player.playerId}</span>
        </div>
      </div>
    </article>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   SKELETONS
   ═══════════════════════════════════════════════════════════════════════ */

const CardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
    <div className="h-1 bg-slate-200" />
    <div className="p-4">
      <div className="flex items-start gap-3">
        <div className="w-20 h-20 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2 pt-2">
          <div className="h-3 w-2/3 bg-slate-200 rounded" />
          <div className="h-2.5 w-1/3 bg-slate-100 rounded" />
          <div className="flex gap-1.5">
            <div className="h-4 w-14 bg-slate-100 rounded" />
            <div className="h-4 w-14 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="h-14 bg-slate-100 rounded-xl" />
        <div className="h-14 bg-slate-100 rounded-xl" />
      </div>
      <div className="mt-3 h-12 bg-slate-100 rounded-xl" />
    </div>
  </div>
);

const SummarySkeleton: React.FC = () => (
  <div className="h-24 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl animate-pulse" />
);

const EditorSkeleton: React.FC = () => (
  <div className="flex-shrink-0 w-[320px] sm:w-[380px] bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
    <div className="h-24 bg-slate-200" />
    <div className="p-4 space-y-3">
      <div className="h-4 w-1/2 bg-slate-200 rounded" />
      <div className="h-3 w-1/3 bg-slate-100 rounded" />
      <div className="flex gap-1.5">
        <div className="h-4 w-14 bg-slate-100 rounded" />
        <div className="h-4 w-14 bg-slate-100 rounded" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="h-12 bg-slate-100 rounded-xl" />
        <div className="h-12 bg-slate-100 rounded-xl" />
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════════════════════════════════ */

interface EmptyStateProps {
  onClear: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onClear }) => (
  <div className="col-span-full flex flex-col items-center justify-center py-16 sm:py-20 gap-4">
    <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center">
      <I.Empty className="w-12 h-12 text-slate-400" />
    </div>
    <div className="text-center">
      <h3 className="text-lg sm:text-xl font-black text-slate-800">
        No Players Found
      </h3>
      <p className="text-sm text-slate-500 mt-1 max-w-xs">
        Try adjusting your search or filters to find the players you're looking for.
      </p>
    </div>
    <button
      onClick={onClear}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-bold hover:bg-slate-700 transition"
    >
      Clear Filters
    </button>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════
   FILTER PANEL
   ═══════════════════════════════════════════════════════════════════════ */

interface FilterState {
  countries: Set<number>;
  roles: Set<number>;
  caps: Set<string>;
  statuses: Set<string>;
  teams: Set<number>;
}

interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  state: FilterState;
  onChange: (s: FilterState) => void;
  onReset: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  open,
  onClose,
  filters,
  state,
  onChange,
  onReset,
}) => {
  const toggle = <T,>(set: Set<T>, val: T): Set<T> => {
    const next = new Set(set);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    return next;
  };

  const chip = (
    active: boolean,
    onClick: () => void,
    children: React.ReactNode,
    key: string
  ) => (
    <button
      key={key}
      onClick={onClick}
      className={cx(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold transition-all border",
        active
          ? "bg-slate-900 text-white border-slate-900 shadow"
          : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
      )}
    >
      {active && <I.Check className="w-3 h-3" />}
      {children}
    </button>
  );

  const totalActive =
    state.countries.size +
    state.roles.size +
    state.caps.size +
    state.statuses.size +
    state.teams.size;

  return (
    <>
      {/* backdrop */}
      <div
        className={cx(
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      {/* panel */}
      <aside
        className={cx(
          "fixed top-0 right-0 h-full w-full sm:max-w-md bg-white z-50 shadow-2xl transition-transform duration-300 flex flex-col",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div>
            <h3 className="text-lg font-black">Filters</h3>
            <p className="text-xs opacity-80">
              {totalActive} active filter{totalActive !== 1 && "s"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/20 transition"
          >
            <I.X className="w-5 h-5" />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Country */}
          <section>
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2.5">
              Country
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {filters.countries.map((c) =>
                chip(
                  state.countries.has(c.countryId),
                  () =>
                    onChange({
                      ...state,
                      countries: toggle(state.countries, c.countryId),
                    }),
                  c.name,
                  `c-${c.countryId}`
                )
              )}
            </div>
          </section>

          {/* Role */}
          <section>
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2.5">
              Role
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {filters.roles.map((r) =>
                chip(
                  state.roles.has(r.roleId),
                  () =>
                    onChange({
                      ...state,
                      roles: toggle(state.roles, r.roleId),
                    }),
                  r.name,
                  `r-${r.roleId}`
                )
              )}
            </div>
          </section>

          {/* Cap */}
          <section>
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2.5">
              Cap
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {filters.caps.map((c) =>
                chip(
                  state.caps.has(c.name),
                  () =>
                    onChange({
                      ...state,
                      caps: toggle(state.caps, c.name),
                    }),
                  c.name,
                  `cap-${c.capId}`
                )
              )}
            </div>
          </section>

          {/* Status */}
          <section>
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2.5">
              Status
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {filters.statuses.map((s) =>
                chip(
                  state.statuses.has(s.name),
                  () =>
                    onChange({
                      ...state,
                      statuses: toggle(state.statuses, s.name),
                    }),
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={cx(
                        "w-1.5 h-1.5 rounded-full",
                        statusDot(s.name as Player["auctionStatus"])
                      )}
                    />
                    {s.name}
                  </span>,
                  `s-${s.statusId}`
                )
              )}
            </div>
          </section>

          {/* Team */}
          <section>
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2.5">
              Team
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {filters.teams.map((t) =>
                chip(
                  state.teams.has(t.teamId),
                  () =>
                    onChange({
                      ...state,
                      teams: toggle(state.teams, t.teamId),
                    }),
                  <span className="inline-flex items-center gap-1.5">
                    <TeamBadge
                      imageId={t.teamImageId}
                      name={t.teamName}
                      short={t.teamShortName}
                      size="sm"
                    />
                    {t.teamShortName}
                  </span>,
                  `t-${t.teamId}`
                )
              )}
            </div>
          </section>
        </div>

        {/* footer */}
        <div className="px-5 py-4 border-t border-slate-200 flex items-center gap-3">
          <button
            onClick={onReset}
            className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-100 transition"
          >
            Reset All
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold hover:brightness-110 transition shadow-lg shadow-indigo-500/30"
          >
            Apply
          </button>
        </div>
      </aside>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════ */

export default function IPLAuctionPage(): React.ReactElement {
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [sortIndex, setSortIndex] = useState<number>(0);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const [filterState, setFilterState] = useState<FilterState>({
    countries: new Set(),
    roles: new Set(),
    caps: new Set(),
    statuses: new Set(),
    teams: new Set(),
  });

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  const activeSort = AUCTION.sortOptions[sortIndex];

  const editorPicks = useMemo<Player[]>(
    () => AUCTION.players.filter((p) => p.isEditorPick && p.editorPick),
    []
  );

  const filteredPlayers = useMemo<Player[]>(() => {
    const q = search.trim().toLowerCase();
    let list = AUCTION.players.filter((p) => {
      if (q) {
        const hay = [
          p.playerName,
          p.teamName ?? "",
          p.countryName,
          p.role,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filterState.countries.size && !filterState.countries.has(p.countryId))
        return false;
      if (filterState.roles.size && !filterState.roles.has(p.roleId))
        return false;
      if (filterState.caps.size && !filterState.caps.has(p.capStatus))
        return false;
      if (filterState.statuses.size && !filterState.statuses.has(p.auctionStatus))
        return false;
      if (
        filterState.teams.size &&
        (p.teamId === null || !filterState.teams.has(p.teamId))
      )
        return false;
      return true;
    });

    // sort
    const { key, order } = activeSort;
    list.sort((a, b) => {
      const va = (a as unknown as Record<string, unknown>)[key];
      const vb = (b as unknown as Record<string, unknown>)[key];

      // boolean → editor pick sort
      if (typeof va === "boolean" && typeof vb === "boolean") {
        const na = va ? 1 : 0;
        const nb = vb ? 1 : 0;
        return order === "asc" ? na - nb : nb - na;
      }
      if (typeof va === "number" && typeof vb === "number") {
        return order === "asc" ? va - vb : vb - va;
      }
      const sa = String(va ?? "");
      const sb = String(vb ?? "");
      return order === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });

    return list;
  }, [search, filterState, activeSort]);

  const totalActiveFilters =
    filterState.countries.size +
    filterState.roles.size +
    filterState.caps.size +
    filterState.statuses.size +
    filterState.teams.size;

  const resetFilters = (): void => {
    setFilterState({
      countries: new Set(),
      roles: new Set(),
      caps: new Set(),
      statuses: new Set(),
      teams: new Set(),
    });
  };

  const clearAll = (): void => {
    resetFilters();
    setSearch("");
  };

  const scrollSlider = (dir: "left" | "right"): void => {
    if (!sliderRef.current) return;
    const amt = sliderRef.current.clientWidth * 0.9;
    sliderRef.current.scrollBy({
      left: dir === "left" ? -amt : amt,
      behavior: "smooth",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* ═══ STICKY HEADER ═══ */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/85 border-b border-slate-200/70 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          {/* Top row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="hidden sm:flex w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 items-center justify-center shadow-lg">
                <I.Trophy className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight truncate">
                  {AUCTION.auctionTitle}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={cx(
                      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                      auctionStatusBadge(AUCTION.auctionStatus)
                    )}
                  >
                    <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                    {AUCTION.auctionStatus}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {AUCTION.totalPlayers} Players · {AUCTION.totalTeams} Teams
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Controls row */}
          <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <I.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search player, team, country or role…"
                className="w-full pl-10 pr-9 py-2.5 rounded-full bg-slate-100 border border-transparent focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none text-sm font-medium text-slate-800 placeholder-slate-400 transition"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <I.X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="relative flex-shrink-0 sm:w-56">
              <I.Sort className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <I.ChevDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={sortIndex}
                onChange={(e) => setSortIndex(Number(e.target.value))}
                className="w-full pl-10 pr-9 py-2.5 rounded-full bg-slate-100 border border-transparent focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none text-sm font-semibold text-slate-800 appearance-none cursor-pointer transition"
              >
                {AUCTION.sortOptions.map((opt, i) => (
                  <option key={`${opt.key}-${opt.order}-${i}`} value={i}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter */}
            <button
              onClick={() => setFilterOpen(true)}
              className={cx(
                "relative flex-shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition shadow",
                totalActiveFilters > 0
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-500/30"
                  : "bg-slate-900 text-white hover:bg-slate-700"
              )}
            >
              <I.Filter className="w-4 h-4" />
              Filter
              {totalActiveFilters > 0 && (
                <span className="ml-1 min-w-[20px] h-5 px-1.5 rounded-full bg-white text-indigo-700 text-[10px] font-black flex items-center justify-center">
                  {totalActiveFilters}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ═══ MAIN ═══ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* ── SUMMARY CARDS ── */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <SummarySkeleton key={i} />
            ))
          ) : (
            <>
              <SummaryCard
                label="Total Players"
                value={AUCTION.totalPlayers}
                subtitle="Registered pool"
                gradient="from-indigo-600 to-blue-700"
                icon={<I.Users className="w-5 h-5" />}
              />
              <SummaryCard
                label="Sold"
                value={AUCTION.soldPlayers}
                subtitle="In squads"
                gradient="from-emerald-500 to-teal-600"
                icon={<I.Check className="w-5 h-5" />}
              />
              <SummaryCard
                label="Retained"
                value={AUCTION.retainedPlayers}
                subtitle="Kept by teams"
                gradient="from-blue-500 to-cyan-600"
                icon={<I.Shield className="w-5 h-5" />}
              />
              <SummaryCard
                label="Unsold"
                value={AUCTION.unsoldPlayers}
                subtitle="Went unsold"
                gradient="from-rose-500 to-red-600"
                icon={<I.Cross className="w-5 h-5" />}
              />
              <SummaryCard
                label="Overseas"
                value={AUCTION.overseasPlayers}
                subtitle="Non-Indian pool"
                gradient="from-purple-600 to-fuchsia-600"
                icon={<I.Globe className="w-5 h-5" />}
              />
              <SummaryCard
                label="Indian"
                value={AUCTION.indianPlayers}
                subtitle="Domestic pool"
                gradient="from-orange-500 to-amber-600"
                icon={<I.Flag className="w-5 h-5" />}
              />
            </>
          )}
        </section>

        {/* ── EDITOR'S PICKS ── */}
        {(loading || editorPicks.length > 0) && (
          <section>
            <div className="flex items-end justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 items-center justify-center shadow">
                  <I.Star className="w-4 h-4 text-white" />
                </span>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                    Editor's Picks
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-semibold">
                    Curated marquee moves of the auction
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  onClick={() => scrollSlider("left")}
                  className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition"
                >
                  <I.ChevLeft className="w-4 h-4 mx-auto" />
                </button>
                <button
                  onClick={() => scrollSlider("right")}
                  className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition"
                >
                  <I.ChevRight className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>

            <div
              ref={sliderRef}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <EditorSkeleton key={i} />
                  ))
                : editorPicks.map((p) => (
                    <EditorPickCard
                      key={p.playerId}
                      player={p}
                      currency={AUCTION.currency}
                    />
                  ))}
            </div>
          </section>
        )}

        {/* ── PLAYER LIST ── */}
        <section>
          <div className="flex items-end justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 items-center justify-center shadow">
                <I.Bat className="w-4 h-4 text-white" />
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                  All Players
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 font-semibold">
                  Showing{" "}
                  <span className="font-black text-slate-800">
                    {filteredPlayers.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-black text-slate-800">
                    {AUCTION.totalPlayers}
                  </span>{" "}
                  players
                </p>
              </div>
            </div>
            {(search || totalActiveFilters > 0) && (
              <button
                onClick={clearAll}
                className="text-xs sm:text-sm font-bold text-indigo-700 hover:text-indigo-900"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))
            ) : filteredPlayers.length === 0 ? (
              <EmptyState onClear={clearAll} />
            ) : (
              filteredPlayers.map((p) => (
                <PlayerCard
                  key={p.playerId}
                  player={p}
                  currency={AUCTION.currency}
                />
              ))
            )}
          </div>
        </section>

        <footer className="pt-6 pb-8 text-center text-xs text-slate-400 font-medium">
          <p>
            Live data · Updated in real-time · IPL Auction{" "}
            {AUCTION.auctionYear}
          </p>
        </footer>
      </main>

      {/* Filter panel */}
      <FilterPanel
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={AUCTION.filters}
        state={filterState}
        onChange={setFilterState}
        onReset={resetFilters}
      />
    </div>
  );
}
