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

export default function DDDashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedWeekEnding, setSelectedWeekEnding] = useState<string>('');
  const [editForm, setEditForm] = useState({
    name: '',
    client: '',
    start_date: '',
    status: 'Active',
  });
  const user = getUser();

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

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setEditForm({
      name: project.name,
      client: project.client,
      start_date: project.start_date,
      status: project.status,
    });
    setShowEditModal(true);
  };

  const handleSaveProject = async () => {
    if (!editingProject) return;

    try {
      await api.put(`/projects/${editingProject.id}`, {
        name: editForm.name,
        client: editForm.client,
        startDate: editForm.start_date,
        status: editForm.status,
      });

      setShowEditModal(false);
      setEditingProject(null);
      fetchProjects(); // Refresh the list
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update project');
    }
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
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-text">My Projects</h1>
                <p className="mt-2 text-secondary">
                  {selectedWeekEnding
                    ? `Showing ${filteredProjects.length} of ${projects.length} projects for week ending ${formatDate(selectedWeekEnding)}`
                    : `You have ${projects.length} project${projects.length !== 1 ? 's' : ''} assigned`}
                </p>
              </div>
              <div className="flex gap-3">
                <select
                  value={selectedWeekEnding}
                  onChange={(e) => setSelectedWeekEnding(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
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
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors font-medium"
                  disabled={loading}
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

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
                      onClick={() => handleEditProject(project)}
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
        </div>

        {/* Edit Project Modal */}
        {showEditModal && editingProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Edit Project</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client
                    </label>
                    <input
                      type="text"
                      value={editForm.client}
                      onChange={(e) => setEditForm({ ...editForm, client: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={editForm.start_date}
                      onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="Active">Active</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleSaveProject}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors font-medium"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingProject(null);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
