import React, { useState, useEffect } from 'react';

// Types
interface Team {
  id: number;
  name: string;
  shortName: string;
  imageId: number;
  imageUrl: string;
}

interface Venue {
  ground: string;
  city: string;
  country: string;
  timezone: string;
}

interface Match {
  matchId: number;
  matchSlug: string;
  seriesId: number;
  seriesSlug: string;
  seriesName: string;
  matchDesc: string;
  format: string;
  status: string;
  startTimestamp: number;
  endTimestamp: number;
  team1: Team;
  team2: Team;
  venue: Venue;
  matchUrl: string;
  seriesUrl: string;
}

interface Day {
  date: string;
  timestamp: number;
  totalMatches: number;
  matches: Match[];
}

interface CricketScheduleData {
  success: boolean;
  generatedAt: string;
  totalDays: number;
  totalMatches: number;
  days: Day[];
}

// API Configuration
const API_BASE_URL = 'https://criczoo.vercel.app';
const API_ENDPOINT = '/api/player/upcoming-series';

const CricketSchedule: React.FC = () => {
  const [data, setData] = useState<CricketScheduleData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: CricketScheduleData = await response.json();

      if (result.success) {
        setData(result);
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const handleRetry = () => {
    if (retryCount < 3) {
      setRetryCount(retryCount + 1);
      fetchSchedule();
    }
  };

  const formatMatchTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).toLowerCase();
    return `${day} ${month} ${year}, ${time}`;
  };

  const formatStartTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const time = date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${month} ${day}, ${time} GMT`;
  };

  // Get format badge colors
  const getFormatStyle = (format: string) => {
    const upperFormat = format.toUpperCase();
    if (upperFormat === 'TEST') {
      return 'bg-red-50 text-red-600 border border-red-200';
    } else if (upperFormat === 'T20' || upperFormat === 'T20I') {
      return 'bg-purple-50 text-purple-600 border border-purple-200';
    } else if (upperFormat === 'ODI') {
      return 'bg-blue-50 text-blue-600 border border-blue-200';
    }
    return 'bg-gray-50 text-gray-600 border border-gray-200';
  };

  // Get status badge colors
  const getStatusStyle = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('upcoming')) {
      return 'bg-blue-50 text-blue-600 border border-blue-200';
    } else if (lowerStatus.includes('live')) {
      return 'bg-green-50 text-green-600 border border-green-200';
    } else if (lowerStatus.includes('complete')) {
      return 'bg-gray-100 text-gray-700 border border-gray-200';
    } else if (lowerStatus.includes('lunch') || lowerStatus.includes('tea') || lowerStatus.includes('stump')) {
      return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
    return 'bg-gray-50 text-gray-600 border border-gray-200';
  };

  // Count matches by status
  const getStatusCounts = () => {
    if (!data) return { all: 0, live: 0, upcoming: 0, completed: 0 };
    let live = 0, upcoming = 0, completed = 0;
    data.days.forEach(day => {
      day.matches.forEach(match => {
        const s = match.status.toLowerCase();
        if (s.includes('live')) live++;
        else if (s.includes('upcoming') || s.includes('preview')) upcoming++;
        else if (s.includes('complete')) completed++;
      });
    });
    return { all: data.totalMatches, live, upcoming, completed };
  };

  // Filter matches
  const getFilteredDays = (): Day[] => {
    if (!data) return [];
    return data.days.map(day => ({
      ...day,
      matches: day.matches.filter(match => {
        // Search filter
        const query = searchQuery.toLowerCase();
        const matchesSearch = !query ||
          match.team1.name.toLowerCase().includes(query) ||
          match.team2.name.toLowerCase().includes(query) ||
          match.seriesName.toLowerCase().includes(query);

        // Status filter
        const s = match.status.toLowerCase();
        let matchesFilter = true;
        if (activeFilter === 'Live') matchesFilter = s.includes('live');
        else if (activeFilter === 'Upcoming') matchesFilter = s.includes('upcoming') || s.includes('preview');
        else if (activeFilter === 'Completed') matchesFilter = s.includes('complete');

        return matchesSearch && matchesFilter;
      })
    })).filter(day => day.matches.length > 0);
  };

  const counts = getStatusCounts();
  const filteredDays = getFilteredDays();
  const totalFilteredMatches = filteredDays.reduce((sum, day) => sum + day.matches.length, 0);

  // Loading Skeleton
  const LoadingSkeleton = () => (
    <div className="max-w-3xl mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="animate-pulse space-y-4">
        <div className="flex gap-2 mb-4">
          <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
          <div className="h-10 w-20 bg-gray-200 rounded-full"></div>
          <div className="h-10 flex-1 bg-gray-200 rounded-full"></div>
        </div>
        <div className="flex gap-2 mb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 w-20 bg-gray-200 rounded-full"></div>
          ))}
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-4 bg-gray-200 rounded w-48"></div>
              <div className="flex gap-2">
                <div className="h-6 w-12 bg-gray-200 rounded-full"></div>
                <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center justify-around py-4">
              <div className="flex flex-col items-center gap-2">
                <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
                <div className="h-3 w-16 bg-gray-200 rounded"></div>
              </div>
              <div className="h-4 w-8 bg-gray-200 rounded"></div>
              <div className="flex flex-col items-center gap-2">
                <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
                <div className="h-3 w-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Error Component
  const ErrorComponent = () => (
    <div className="max-w-3xl mx-auto p-4 min-h-screen bg-gray-50">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center mt-8">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-red-800 mb-2">Failed to Load Schedule</h2>
        <p className="text-red-600 mb-4">{error}</p>
        <p className="text-sm text-red-500 mb-6">Attempts: {retryCount}/3</p>
        <button
          onClick={handleRetry}
          disabled={retryCount >= 3}
          className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {retryCount >= 3 ? 'Max Retries Reached' : 'Try Again'}
        </button>
      </div>
    </div>
  );

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorComponent />;
  if (!data) return null;

  const filters = [
    { name: 'All', count: counts.all },
    { name: 'Live', count: counts.live },
    { name: 'Upcoming', count: counts.upcoming },
    { name: 'Completed', count: counts.completed },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-4">
        {/* Top Bar */}
        <div className="flex items-center gap-2 mb-4">
          {/* Logo */}
          <div className="w-11 h-11 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white text-xl">🏏</span>
          </div>

          {/* Live indicator */}
          {counts.live > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-emerald-200 rounded-full flex-shrink-0">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-semibold text-emerald-600">{counts.live} Live</span>
            </div>
          )}

          {/* Search */}
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team"
              className="w-full pl-10 pr-3 py-2.5 bg-gray-100 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white"
            />
          </div>

          {/* Refresh */}
          <button
            onClick={fetchSchedule}
            className="w-11 h-11 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center hover:bg-blue-100 transition-colors flex-shrink-0"
            title="Refresh"
          >
            <span className="text-blue-600 text-lg">🔄</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.name}
              onClick={() => setActiveFilter(filter.name)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeFilter === filter.name
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-300'
              }`}
            >
              {filter.name}
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeFilter === filter.name
                  ? 'bg-white/25 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>

        {/* Match Count */}
        <p className="text-sm text-gray-500 mb-3">{totalFilteredMatches} matches</p>

        {/* Matches List */}
        {totalFilteredMatches === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <div className="text-5xl mb-3">🏏</div>
            <p className="text-gray-500 font-medium">No matches found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or search</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDays.map((day) =>
              day.matches.map((match) => (
                <a
                  key={match.matchId}
                  href={match.matchUrl}
                  className="block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100"
                >
                  {/* Top: Series + Badges */}
                  <div className="flex items-start justify-between gap-3 p-4 pb-3">
                    <h3 className="text-gray-800 font-medium text-sm flex-1">
                      {match.seriesName}
                    </h3>
                    <div className="flex gap-2 flex-shrink-0">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-md ${getFormatStyle(match.format)}`}>
                        {match.format.toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-md ${getStatusStyle(match.status)}`}>
                        {match.status}
                      </span>
                    </div>
                  </div>

                  {/* Teams - Vertical Layout */}
                  <div className="flex items-center justify-around px-4 py-3">
                    {/* Team 1 */}
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <div className="w-16 h-16 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center overflow-hidden">
                        <img
                          src={match.team1.imageUrl}
                          alt={match.team1.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${match.team1.shortName}&background=e5e7eb&color=374151`;
                          }}
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-semibold text-gray-800">
                          {match.team1.shortName || match.team1.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">Yet to bat</p>
                      </div>
                    </div>

                    {/* VS */}
                    <div className="px-3">
                      <span className="text-gray-400 text-sm font-semibold">VS</span>
                    </div>

                    {/* Team 2 */}
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <div className="w-16 h-16 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center overflow-hidden">
                        <img
                          src={match.team2.imageUrl}
                          alt={match.team2.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${match.team2.shortName}&background=e5e7eb&color=374151`;
                          }}
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-semibold text-gray-800">
                          {match.team2.shortName || match.team2.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">Yet to bat</p>
                      </div>
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="bg-gray-50/70 px-4 py-3 border-t border-gray-100">
                    <p className="text-sm font-semibold text-gray-800 mb-1.5">
                      Match starts at {formatStartTime(match.startTimestamp)}
                    </p>
                    {match.venue.city && match.venue.city !== 'TBC' && (
                      <p className="text-xs text-gray-600 flex items-center gap-1 mb-1">
                        <span className="text-red-500">📍</span>
                        {match.venue.city}
                        {match.venue.ground && match.venue.ground !== match.venue.city && `, ${match.venue.ground}`}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <span>📅</span>
                      {formatMatchTime(match.startTimestamp)}
                    </p>
                  </div>
                </a>
              ))
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-400 pb-4">
          <p>Powered by CricZoo</p>
        </div>
      </div>
    </div>
  );
};

export default CricketSchedule;
