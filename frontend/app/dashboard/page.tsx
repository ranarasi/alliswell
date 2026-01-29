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

interface ProjectOperations {
  project_id: string;
  project_name: string;
  client: string;
  pdm_name: string; // Delivery Director
  project_manager: string; // Delivery Manager
  business_unit_head: string; // Business Unit Head
  month: number;
  year: number;
  team_size: number;
  revenue: number;
  cost: number;
  gm_percentage: number;
  utilization_percentage: number;
  shadows: number;
  ramp_up: number;
  ramp_down: number;
  open_positions: number;
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
  const [activeTab, setActiveTab] = useState<'all-is-well' | 'project-ops' | 'values'>('all-is-well');

  // Project Ops state
  const [opsMonth, setOpsMonth] = useState(new Date().getMonth() + 1);
  const [opsYear, setOpsYear] = useState(new Date().getFullYear());
  const [projectOperations, setProjectOperations] = useState<ProjectOperations[]>([]);
  const [opsLoading, setOpsLoading] = useState(false);
  const [opsDataLoaded, setOpsDataLoaded] = useState(false);
  const [sortColumn, setSortColumn] = useState<keyof ProjectOperations | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Values state
  const [valuesFromDate, setValuesFromDate] = useState('');
  const [valuesToDate, setValuesToDate] = useState('');
  const [projectValues, setProjectValues] = useState<any[]>([]);
  const [valuesLoading, setValuesLoading] = useState(false);
  const [valuesDataLoaded, setValuesDataLoaded] = useState(false);

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

  const fetchProjectOperations = async () => {
    try {
      setOpsLoading(true);

      // Fetch all projects
      const projectsResponse = await api.get('/projects');
      const allProjects = projectsResponse.data;

      // Fetch operations data for each project for the selected month/year
      const operationsData: ProjectOperations[] = [];

      await Promise.all(
        allProjects.map(async (project: any) => {
          try {
            const response = await api.get(`/projects/${project.id}/operations/${opsMonth}/${opsYear}`);
            const data = response.data;
            operationsData.push({
              project_id: project.id,
              project_name: project.name,
              client: project.client,
              pdm_name: project.pdm_name || 'Not assigned',
              project_manager: project.project_manager || '-',
              business_unit_head: project.business_unit_head || '-',
              month: data.month,
              year: data.year,
              team_size: data.team_size,
              revenue: data.revenue,
              cost: data.cost,
              gm_percentage: data.gm_percentage,
              utilization_percentage: data.utilization_percentage,
              shadows: data.shadows,
              ramp_up: data.ramp_up,
              ramp_down: data.ramp_down,
              open_positions: data.open_positions,
            });
          } catch (err) {
            // Skip projects that don't have operations data for this month/year
          }
        })
      );

      setProjectOperations(operationsData);
      setOpsDataLoaded(true);
    } catch (err: any) {
      console.error('Failed to fetch operations data:', err);
    } finally {
      setOpsLoading(false);
    }
  };

  const handleSubmitOps = () => {
    fetchProjectOperations();
  };

  const fetchProjectValues = async () => {
    try {
      setValuesLoading(true);

      let url = '/values';
      const params = new URLSearchParams();

      if (valuesFromDate) {
        params.append('fromDate', valuesFromDate);
      }
      if (valuesToDate) {
        params.append('toDate', valuesToDate);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await api.get(url);
      setProjectValues(response.data);
      setValuesDataLoaded(true);
    } catch (err: any) {
      console.error('Failed to fetch values:', err);
    } finally {
      setValuesLoading(false);
    }
  };

  const handleShowValues = () => {
    fetchProjectValues();
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

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization < 85) {
      return 'bg-red-600 text-white font-semibold';
    }
    return '';
  };

  const getGmColor = (gm: number) => {
    if (gm < 25) {
      return 'bg-red-600 text-white font-semibold';
    } else if (gm >= 25 && gm <= 39) {
      return 'bg-orange-500 text-white font-semibold';
    }
    return '';
  };

  const handleSort = (column: keyof ProjectOperations) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortedOperations = () => {
    if (!sortColumn) return projectOperations;

    return [...projectOperations].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // String comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Number comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  };

  const SortableHeader = ({ column, children }: { column: keyof ProjectOperations; children: React.ReactNode }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortColumn === column && (
          <span className="text-primary">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar mode="admin" />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Project Dashboard</h1>
          <p className="text-secondary">
            Week: {currentDate || 'Loading...'}
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              type="button"
              onClick={() => setActiveTab('all-is-well')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'all-is-well'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All is well
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('project-ops')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'project-ops'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Project Ops
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('values')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'values'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Values
            </button>
          </nav>
        </div>

        {/* All is well Tab */}
        {activeTab === 'all-is-well' && (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Summary</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6 text-center border border-gray-100">
                  <div className="text-2xl sm:text-3xl font-bold">{summary.total}</div>
                  <div className="text-xs sm:text-sm text-secondary mt-1 sm:mt-2">Projects</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6 text-center border border-gray-100">
                  <div className="text-2xl sm:text-3xl font-bold text-green-600">{summary.green}</div>
                  <div className="text-xs sm:text-sm text-secondary mt-1 sm:mt-2">Green</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6 text-center border border-gray-100">
                  <div className="text-2xl sm:text-3xl font-bold text-amber-600">{summary.amber}</div>
                  <div className="text-xs sm:text-sm text-secondary mt-1 sm:mt-2">Amber</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6 text-center border border-gray-100">
                  <div className="text-2xl sm:text-3xl font-bold text-red-600">{summary.red}</div>
                  <div className="text-xs sm:text-sm text-secondary mt-1 sm:mt-2">Red</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6 text-center border border-gray-100 col-span-2 sm:col-span-1">
                  <div className="text-2xl sm:text-3xl font-bold text-gray-600">{summary.noStatus}</div>
                  <div className="text-xs sm:text-sm text-secondary mt-1 sm:mt-2">No Status</div>
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
          </>
        )}

        {/* Project Ops Tab */}
        {activeTab === 'project-ops' && (
          <div className="space-y-6">
            {/* Month/Year Selection */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Project Operations Overview</h2>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                <div className="flex-1 sm:flex-none">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Month *
                  </label>
                  <select
                    value={opsMonth}
                    onChange={(e) => setOpsMonth(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="1">January</option>
                    <option value="2">February</option>
                    <option value="3">March</option>
                    <option value="4">April</option>
                    <option value="5">May</option>
                    <option value="6">June</option>
                    <option value="7">July</option>
                    <option value="8">August</option>
                    <option value="9">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                </div>
                <div className="flex-1 sm:flex-none">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year *
                  </label>
                  <input
                    type="number"
                    value={opsYear}
                    onChange={(e) => setOpsYear(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    min="2000"
                    max="2100"
                  />
                </div>
                <button
                  onClick={handleSubmitOps}
                  disabled={opsLoading}
                  className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
                >
                  {opsLoading ? 'Loading...' : 'Submit'}
                </button>
              </div>
            </div>

            {/* Operations Table */}
            {opsDataLoaded && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Operations Data for {getMonthName(opsMonth)} {opsYear}
                </h3>
                {projectOperations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No operations data found for {getMonthName(opsMonth)} {opsYear}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border">
                      <thead className="bg-gray-50">
                        <tr>
                          <SortableHeader column="project_name">Project</SortableHeader>
                          <SortableHeader column="client">Client</SortableHeader>
                          <SortableHeader column="pdm_name">DD</SortableHeader>
                          <SortableHeader column="project_manager">DM</SortableHeader>
                          <SortableHeader column="business_unit_head">BUH</SortableHeader>
                          <SortableHeader column="team_size">Team Size</SortableHeader>
                          <SortableHeader column="revenue">Revenue</SortableHeader>
                          <SortableHeader column="cost">Cost</SortableHeader>
                          <SortableHeader column="gm_percentage">GM%</SortableHeader>
                          <SortableHeader column="utilization_percentage">Utilization%</SortableHeader>
                          <SortableHeader column="shadows">Shadows</SortableHeader>
                          <SortableHeader column="ramp_up">Ramp Up</SortableHeader>
                          <SortableHeader column="ramp_down">Ramp Down</SortableHeader>
                          <SortableHeader column="open_positions">Open Positions</SortableHeader>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getSortedOperations().map((op) => (
                          <tr key={op.project_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{op.project_name}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{op.client}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{op.pdm_name}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{op.project_manager}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{op.business_unit_head}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{op.team_size}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">${op.revenue.toLocaleString()}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">${op.cost.toLocaleString()}</td>
                            <td className={`px-4 py-3 whitespace-nowrap text-sm ${getGmColor(op.gm_percentage)}`}>{op.gm_percentage}%</td>
                            <td className={`px-4 py-3 whitespace-nowrap text-sm ${getUtilizationColor(op.utilization_percentage)}`}>{op.utilization_percentage}%</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{op.shadows}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{op.ramp_up}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{op.ramp_down}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{op.open_positions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {!opsDataLoaded && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-xl text-gray-500">
                  Select a month and year, then click Submit to view operations data
                </p>
              </div>
            )}
          </div>
        )}

        {/* Values Tab */}
        {activeTab === 'values' && (
          <div className="space-y-6">
            {/* Date Range Selection */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Project Values</h2>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={valuesFromDate}
                    onChange={(e) => setValuesFromDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={valuesToDate}
                    onChange={(e) => setValuesToDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <button
                  onClick={handleShowValues}
                  disabled={valuesLoading}
                  className="w-full sm:w-auto px-6 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
                >
                  {valuesLoading ? 'Loading...' : 'Show Value Projects'}
                </button>
              </div>
            </div>

            {/* Values Feed */}
            {valuesDataLoaded && (
              <div className="bg-white rounded-lg shadow-md p-6">
                {projectValues.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No values found for the selected date range
                  </div>
                ) : (
                  <div className="space-y-6">
                    {projectValues.map((value, index) => (
                      <div key={value.id}>
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {value.project_name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Updated on: {new Date(value.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <div
                            className="prose max-w-none text-gray-700"
                            dangerouslySetInnerHTML={{ __html: value.content }}
                          />
                        </div>
                        {index < projectValues.length - 1 && (
                          <hr className="mt-6 border-gray-300" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!valuesDataLoaded && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-xl text-gray-500">
                  Select a date range and click "Show Value Projects" to view values
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
