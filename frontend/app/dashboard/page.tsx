'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { WeeklyStatus, Project } from '@/types';
import Navbar from '@/components/Navbar';

interface StatusWithProject extends WeeklyStatus {
  project_name: string;
  client: string;
  submitted_by_name: string;
  project_id: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [statuses, setStatuses] = useState<StatusWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWeekEnding, setSelectedWeekEnding] = useState<string>('');
  const [expandedStatusId, setExpandedStatusId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString());
    fetchLatestStatuses();
  }, []);

  const fetchLatestStatuses = async () => {
    try {
      const response = await api.get<StatusWithProject[]>('/status/latest');
      // Sort by latest status update date (most recent first)
      const sortedStatuses = response.data.sort((a, b) => {
        const dateA = a.week_ending_date ? new Date(a.week_ending_date).getTime() : 0;
        const dateB = b.week_ending_date ? new Date(b.week_ending_date).getTime() : 0;
        return dateB - dateA;
      });
      setStatuses(sortedStatuses);
    } catch (error) {
      console.error('Failed to fetch statuses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Green':
        return 'bg-green text-white';
      case 'Amber':
        return 'bg-amber text-white';
      case 'Red':
        return 'bg-red text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Green':
        return '🟢';
      case 'Amber':
        return '🟡';
      case 'Red':
        return '🔴';
      default:
        return '⚪';
    }
  };

  // Get unique week ending dates
  const getUniqueWeekEndingDates = () => {
    const dates = statuses
      .filter((s) => s.week_ending_date)
      .map((s) => s.week_ending_date);
    const uniqueDates = Array.from(new Set(dates));
    return uniqueDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  };

  const filteredStatuses = statuses.filter((status) => {
    const matchesStatus = !filterStatus || status.overall_status === filterStatus;
    const matchesSearch =
      !searchQuery ||
      status.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      status.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      status.all_is_well?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWeek = !selectedWeekEnding || status.week_ending_date === selectedWeekEnding;
    return matchesStatus && matchesSearch && matchesWeek;
  });

  const summary = {
    total: statuses.filter(s => s.overall_status).length,
    green: statuses.filter((s) => s.overall_status === 'Green').length,
    amber: statuses.filter((s) => s.overall_status === 'Amber').length,
    red: statuses.filter((s) => s.overall_status === 'Red').length,
    noStatus: statuses.filter((s) => !s.overall_status).length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Project Dashboard</h1>
          <p className="text-secondary">
            Week: {currentDate || 'Loading...'}
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Summary</h2>
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 text-center border border-gray-100">
              <div className="text-3xl font-bold">{summary.total}</div>
              <div className="text-sm text-secondary mt-2">Projects</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 text-center border border-gray-100">
              <div className="text-3xl font-bold text-green-600">{summary.green}</div>
              <div className="text-sm text-secondary mt-2">Green</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 text-center border border-gray-100">
              <div className="text-3xl font-bold text-amber-600">{summary.amber}</div>
              <div className="text-sm text-secondary mt-2">Amber</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 text-center border border-gray-100">
              <div className="text-3xl font-bold text-red-600">{summary.red}</div>
              <div className="text-sm text-secondary mt-2">Red</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 text-center border border-gray-100">
              <div className="text-3xl font-bold text-gray-600">{summary.noStatus}</div>
              <div className="text-sm text-secondary mt-2">No Status</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Status</option>
              <option value="Green">Green</option>
              <option value="Amber">Amber</option>
              <option value="Red">Red</option>
            </select>
            <select
              value={selectedWeekEnding}
              onChange={(e) => setSelectedWeekEnding(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Weeks</option>
              {getUniqueWeekEndingDates().map((date) => (
                <option key={date} value={date}>
                  Week ending {new Date(date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStatuses.map((status) => (
              <div
                key={status.id || status.project_name}
                className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-gray-100"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">
                      {getStatusIcon(status.overall_status)} {status.project_name}
                    </h3>
                    <p className="text-sm text-secondary">Client: {status.client}</p>
                  </div>
                  {status.overall_status && (
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                        status.overall_status
                      )}`}
                    >
                      {status.overall_status}
                    </span>
                  )}
                </div>

                {status.submitted_by_name && (
                  <p className="text-sm text-secondary mb-2">
                    DD: {status.submitted_by_name}
                  </p>
                )}

                {status.week_ending_date && (
                  <p className="text-sm text-secondary mb-3">
                    Updated: {new Date(status.week_ending_date).toLocaleDateString()}
                  </p>
                )}

                {status.all_is_well ? (
                  <div className="mb-4">
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {status.all_is_well.substring(0, 150)}
                      {status.all_is_well.length > 150 && '...'}
                    </p>
                  </div>
                ) : (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 italic">No status submitted yet</p>
                  </div>
                )}

                <div className="flex items-center space-x-4 text-sm">
                  {status.risks && (
                    <span className="flex items-center text-amber-600">
                      ⚠️ Risks
                    </span>
                  )}
                  {status.opportunities && (
                    <span className="flex items-center text-blue-600">
                      💡 Opportunities
                    </span>
                  )}
                  {status.action_items && (
                    <span className="flex items-center text-purple-600">
                      📌 Actions
                    </span>
                  )}
                </div>

                {status.project_id && (
                  <div className="mt-4 pt-4 border-t">
                    <button
                      onClick={() => router.push(`/project/${status.project_id}`)}
                      className="text-primary text-sm hover:text-blue-600 font-medium"
                    >
                      View Status Updates →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {filteredStatuses.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500">No projects found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
