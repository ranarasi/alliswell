'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import Navbar from '@/components/Navbar';

interface Project {
  id: string;
  name: string;
  client: string;
  status: string;
  start_date: string;
  latest_status?: {
    week_ending_date: string;
    overall_status: 'Green' | 'Amber' | 'Red';
    all_is_well: string;
  };
}

interface ProjectOperations {
  project_id: string;
  project_name: string;
  client: string;
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

export default function DDDashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedWeekEnding, setSelectedWeekEnding] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all-is-well' | 'project-ops'>('all-is-well');
  const user = getUser();

  // Project Ops state
  const [opsMonth, setOpsMonth] = useState(new Date().getMonth() + 1);
  const [opsYear, setOpsYear] = useState(new Date().getFullYear());
  const [projectOperations, setProjectOperations] = useState<ProjectOperations[]>([]);
  const [opsLoading, setOpsLoading] = useState(false);
  const [opsDataLoaded, setOpsDataLoaded] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'PDM') {
      router.push('/login');
      return;
    }

    fetchProjects();
  }, [router]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      // Fetch projects assigned to this Delivery Director
      const projectsResponse = await api.get('/projects');
      const allProjects = projectsResponse.data;

      // Fetch latest status for each project
      const projectsWithStatus = await Promise.all(
        allProjects.map(async (project: Project) => {
          try {
            const statusResponse = await api.get(`/status/latest/${project.id}`);
            return {
              ...project,
              latest_status: statusResponse.data,
            };
          } catch (err) {
            return project;
          }
        })
      );

      // Sort by latest status update date (most recent first)
      projectsWithStatus.sort((a, b) => {
        const dateA = a.latest_status?.week_ending_date
          ? new Date(a.latest_status.week_ending_date).getTime()
          : 0;
        const dateB = b.latest_status?.week_ending_date
          ? new Date(b.latest_status.week_ending_date).getTime()
          : 0;
        return dateB - dateA;
      });

      setProjects(projectsWithStatus);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectOperations = async () => {
    try {
      setOpsLoading(true);
      setError('');

      // Fetch all projects for the DD
      const projectsResponse = await api.get('/projects');
      const allProjects = projectsResponse.data;

      // Fetch operations data for each project for the selected month/year
      const operationsData: ProjectOperations[] = [];

      await Promise.all(
        allProjects.map(async (project: Project) => {
          try {
            const response = await api.get(`/projects/${project.id}/operations/${opsMonth}/${opsYear}`);
            const data = response.data;
            operationsData.push({
              project_id: project.id,
              project_name: project.name,
              client: project.client,
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
      setError(err.response?.data?.message || 'Failed to fetch operations data');
    } finally {
      setOpsLoading(false);
    }
  };

  const handleSubmitOps = () => {
    fetchProjectOperations();
  };

  const getStatusIcon = (status?: 'Green' | 'Amber' | 'Red') => {
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

  const getStatusText = (status?: 'Green' | 'Amber' | 'Red') => {
    return status || 'No Status';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleEditProject = (projectId: string) => {
    router.push(`/pdm/edit/${projectId}`);
  };

  // Get unique week ending dates from projects
  const getUniqueWeekEndingDates = () => {
    const dates = projects
      .filter((p) => p.latest_status?.week_ending_date)
      .map((p) => p.latest_status!.week_ending_date);
    const uniqueDates = Array.from(new Set(dates));
    return uniqueDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  };

  // Filter projects by selected week ending
  const filteredProjects = selectedWeekEnding
    ? projects.filter((p) => p.latest_status?.week_ending_date === selectedWeekEnding)
    : projects;

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

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-xl text-secondary">Loading your projects...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text mb-6">My Dashboard</h1>

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
              </nav>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* All is well Tab */}
          {activeTab === 'all-is-well' && (
            <>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                <p className="text-secondary text-sm sm:text-base">
                  {selectedWeekEnding
                    ? `Showing ${filteredProjects.length} of ${projects.length} projects for week ending ${formatDate(selectedWeekEnding)}`
                    : `You have ${projects.length} project${projects.length !== 1 ? 's' : ''} assigned`}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <select
                    value={selectedWeekEnding}
                    onChange={(e) => setSelectedWeekEnding(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-sm sm:text-base w-full sm:w-auto"
                  >
                    <option value="">All Weeks</option>
                    {getUniqueWeekEndingDates().map((date) => (
                      <option key={date} value={date}>
                        Week ending {formatDate(date)}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={fetchProjects}
                    className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors font-medium text-sm sm:text-base w-full sm:w-auto"
                    disabled={loading}
                  >
                    {loading ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              </div>

              {/* Projects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      {/* Project Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-text mb-1 line-clamp-2">
                            {project.name}
                          </h3>
                          <p className="text-sm text-secondary">{project.client}</p>
                        </div>
                        <span className="text-2xl ml-2">
                          {getStatusIcon(project.latest_status?.overall_status)}
                        </span>
                      </div>

                      {/* Status Information */}
                      <div className="space-y-3 mb-4">
                        <div>
                          <p className="text-xs text-secondary mb-1">Current Status</p>
                          <p className="text-sm font-medium text-text">
                            {getStatusText(project.latest_status?.overall_status)}
                          </p>
                        </div>

                        {project.latest_status ? (
                          <>
                            <div>
                              <p className="text-xs text-secondary mb-1">Last Updated</p>
                              <p className="text-sm text-text">
                                {formatDate(project.latest_status.week_ending_date)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-secondary mb-1">Summary</p>
                              <p className="text-sm text-text line-clamp-2">
                                {project.latest_status.all_is_well}
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                            <p className="text-xs text-yellow-800">
                              No status updates yet
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/project/${project.id}`)}
                          className="flex-1 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors text-sm font-medium"
                        >
                          View Status Updates
                        </button>
                        <button
                          onClick={() => handleEditProject(project.id)}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm font-medium"
                          title="Edit Project"
                        >
                          Edit
                        </button>
                      </div>
                    </div>

                    {/* Project Details Footer */}
                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-secondary">
                          Started: {formatDate(project.start_date)}
                        </span>
                        <span
                          className={`px-2 py-1 rounded ${
                            project.status === 'Active'
                              ? 'bg-green-100 text-green-800'
                              : project.status === 'On Hold'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {project.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredProjects.length === 0 && projects.length > 0 && (
                <div className="text-center py-12">
                  <p className="text-xl text-secondary">No projects found for the selected week</p>
                  <button
                    onClick={() => setSelectedWeekEnding('')}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                  >
                    Clear Filter
                  </button>
                </div>
              )}

              {projects.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-xl text-secondary">No projects assigned yet</p>
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
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team Size</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">GM%</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilization%</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shadows</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ramp Up</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ramp Down</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Open Positions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {projectOperations.map((op) => (
                            <tr key={op.project_id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{op.project_name}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">{op.client}</td>
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
        </div>
      </div>
    </>
  );
}
