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
const API_BASE_URL = 'https://criczoo.vercel.app'; // Replace with your actual API URL
const API_ENDPOINT = '/api/player/upcoming-series'; // Replace with your actual endpoint

const CricketSchedule: React.FC = () => {
  const [data, setData] = useState<CricketScheduleData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Fetch data from API
  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add any authentication headers if needed
          // 'Authorization': 'Bearer YOUR_TOKEN',
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

  // Fetch on component mount
  useEffect(() => {
    fetchSchedule();
  }, []);

  // Retry function
  const handleRetry = () => {
    if (retryCount < 3) {
      setRetryCount(retryCount + 1);
      fetchSchedule();
    }
  };

  // Format time
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Loading Skeleton
  const LoadingSkeleton = () => (
    <div className="cricket-schedule max-w-7xl mx-auto p-4">
      <div className="header mb-6 animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-64 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-48"></div>
      </div>

      {[...Array(5)].map((_, dayIndex) => (
        <div key={dayIndex} className="day-section bg-white rounded-lg shadow-md mb-6 overflow-hidden">
          <div className="day-header bg-gradient-to-r from-blue-600 to-blue-700 p-4">
            <div className="h-6 bg-white bg-opacity-20 rounded w-48"></div>
          </div>

          <div className="p-4 space-y-4">
            {[...Array(4)].map((_, matchIndex) => (
              <div key={matchIndex} className="border-b border-gray-200 pb-4 last:border-0">
                <div className="flex gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex gap-2">
                      <div className="h-6 bg-gray-300 rounded w-16"></div>
                      <div className="h-6 bg-gray-300 rounded w-20"></div>
                    </div>
                    <div className="h-4 bg-gray-300 rounded w-64"></div>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
                        <div className="space-y-1">
                          <div className="h-4 bg-gray-300 rounded w-24"></div>
                          <div className="h-3 bg-gray-300 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
                        <div className="space-y-1">
                          <div className="h-4 bg-gray-300 rounded w-24"></div>
                          <div className="h-3 bg-gray-300 rounded w-16"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  // Error Component
  const ErrorComponent = () => (
    <div className="cricket-schedule max-w-7xl mx-auto p-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-red-800 mb-2">Failed to Load Schedule</h2>
        <p className="text-red-600 mb-4">{error}</p>
        <p className="text-sm text-red-500 mb-6">
          Attempts: {retryCount}/3
        </p>
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

  // Main Render
  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorComponent />;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="cricket-schedule max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="header mb-6 bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">🏏 Cricket Schedule</h1>
            <p className="text-gray-600 mt-2">
              Total Matches: {data.totalMatches} | Days: {data.totalDays}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">
              Generated: {formatDate(new Date(data.generatedAt).getTime())}
            </p>
            <button
              onClick={fetchSchedule}
              className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Days */}
      <div className="schedule-days space-y-8">
        {data.days.map((day, dayIndex) => (
          <div key={dayIndex} className="day-section bg-white rounded-lg shadow-md overflow-hidden">
            {/* Day Header */}
            <div className="day-header bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{day.date}</h2>
                  <p className="text-sm opacity-90">{day.totalMatches} Matches Scheduled</p>
                </div>
                <div className="text-3xl font-bold opacity-20">
                  {dayIndex + 1}
                </div>
              </div>
            </div>

            {/* Matches */}
            <div className="matches-list divide-y divide-gray-200">
              {day.matches.map((match) => (
                <div
                  key={match.matchId}
                  className="match-card p-4 hover:bg-gray-50 transition-all duration-200 hover:shadow-sm"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Left Section - Match Info & Teams */}
                    <div className="flex-1 space-y-3">
                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                          {match.format}
                        </span>
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          {match.status}
                        </span>
                        <span className="text-sm text-gray-600 font-medium">
                          {match.matchDesc}
                        </span>
                      </div>

                      {/* Series Name */}
                      <h3 className="text-sm font-medium text-gray-700">
                        {match.seriesName}
                      </h3>

                      {/* Teams */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Team 1 */}
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                          <img
                            src={match.team1.imageUrl}
                            alt={match.team1.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                          />
                          <div>
                            <p className="font-semibold text-gray-800">
                              {match.team1.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {match.team1.shortName}
                            </p>
                          </div>
                        </div>

                        {/* Team 2 */}
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                          <img
                            src={match.team2.imageUrl}
                            alt={match.team2.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                          />
                          <div>
                            <p className="font-semibold text-gray-800">
                              {match.team2.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {match.team2.shortName}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Time & Venue */}
                    <div className="lg:text-right space-y-3 lg:border-l lg:border-gray-200 lg:pl-6">
                      {/* Time */}
                      <div>
                        <p className="text-lg font-bold text-gray-800">
                          {formatTime(match.startTimestamp)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(match.startTimestamp)}
                        </p>
                      </div>

                      {/* Venue */}
                      <div className="text-sm text-gray-600">
                        <p className="font-semibold text-gray-700">
                          📍 {match.venue.ground}
                        </p>
                        {match.venue.city !== 'TBC' && (
                          <p>{match.venue.city}</p>
                        )}
                        {match.venue.country !== 'TBC' && (
                          <p>{match.venue.country}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Timezone: {match.venue.timezone}
                        </p>
                      </div>

                      {/* Action Button */}
                      <a
                        href={match.matchUrl}
                        className="inline-block px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                      >
                        View Details →
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500 pb-4">
        <p>Powered by Cricbuzz API | {data.totalMatches} matches across {data.totalDays} days</p>
      </div>
    </div>
  );
};

export default CricketSchedule;
