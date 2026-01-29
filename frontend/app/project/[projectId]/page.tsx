'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import Navbar from '@/components/Navbar';

interface Project {
  id: string;
  name: string;
  client: string;
  status: string;
}

interface StatusUpdate {
  id: string;
  week_ending_date: string;
  overall_status: 'Green' | 'Amber' | 'Red';
  all_is_well: string;
  risks?: string;
  opportunities?: string;
  action_items?: string;
  submitted_by_name: string;
  created_at: string;
}

export default function ProjectStatusPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [statuses, setStatuses] = useState<StatusUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  // Form state for Delivery Director
  const [formData, setFormData] = useState({
    weekEndingDate: '',
    overallStatus: 'Green' as 'Green' | 'Amber' | 'Red',
    allIsWell: '',
    risks: '',
    opportunities: '',
    actionItems: '',
  });

  useEffect(() => {
    fetchProjectAndStatuses();
  }, [projectId]);

  const fetchProjectAndStatuses = async () => {
    try {
      setLoading(true);
      // Fetch project details
      const projectResponse = await api.get(`/projects/${projectId}`);
      setProject(projectResponse.data);

      // Fetch all status updates for this project
      const statusResponse = await api.get(`/status?projectId=${projectId}`);
      setStatuses(statusResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch project data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.weekEndingDate || !formData.allIsWell.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await api.post('/status', {
        projectId,
        weekEndingDate: formData.weekEndingDate,
        overallStatus: formData.overallStatus,
        allIsWell: formData.allIsWell,
        risks: formData.risks,
        opportunities: formData.opportunities,
        actionItems: formData.actionItems,
      });

      alert('Status submitted successfully!');
      // Reset form
      setFormData({
        weekEndingDate: '',
        overallStatus: 'Green',
        allIsWell: '',
        risks: '',
        opportunities: '',
        actionItems: '',
      });
      // Refresh status list
      fetchProjectAndStatuses();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Green':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Amber':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Red':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
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

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-xl text-secondary">Loading project status...</div>
        </div>
      </>
    );
  }

  if (error || !project) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-xl text-red-600">{error || 'Project not found'}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="text-primary hover:text-blue-600 mb-4 flex items-center"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-text mb-2">{project.name} Status</h1>
            <p className="text-secondary">Client: {project.client}</p>
          </div>

          {/* Submit Form for Delivery Director */}
          {showSubmitForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Submit New Status Update</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Week Ending Date *
                    </label>
                    <input
                      type="date"
                      value={formData.weekEndingDate}
                      onChange={(e) =>
                        setFormData({ ...formData, weekEndingDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Overall Status *
                    </label>
                    <select
                      value={formData.overallStatus}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          overallStatus: e.target.value as 'Green' | 'Amber' | 'Red',
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="Green">🟢 Green</option>
                      <option value="Amber">🟡 Amber</option>
                      <option value="Red">🔴 Red</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    All is Well * (max 1000 chars)
                  </label>
                  <textarea
                    value={formData.allIsWell}
                    onChange={(e) => setFormData({ ...formData, allIsWell: e.target.value })}
                    maxLength={1000}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.allIsWell.length}/1000 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Risks (optional)
                  </label>
                  <textarea
                    value={formData.risks}
                    onChange={(e) => setFormData({ ...formData, risks: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opportunities (optional)
                  </label>
                  <textarea
                    value={formData.opportunities}
                    onChange={(e) => setFormData({ ...formData, opportunities: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action Items (optional)
                  </label>
                  <textarea
                    value={formData.actionItems}
                    onChange={(e) => setFormData({ ...formData, actionItems: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Submit Status Update
                </button>
              </form>
            </div>
          )}

          {/* Status History */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Status Update History</h2>
            {statuses.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-500">No status updates yet</p>
              </div>
            ) : (
              <div className="space-y-6">
                {statuses.map((status) => (
                  <div
                    key={status.id}
                    className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${getStatusColor(
                      status.overall_status
                    )}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{getStatusIcon(status.overall_status)}</span>
                        <div>
                          <h3 className="text-lg font-semibold">
                            Week Ending: {new Date(status.week_ending_date).toLocaleDateString()}
                          </h3>
                          <p className="text-sm text-secondary">
                            Submitted by: {status.submitted_by_name}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 text-sm rounded-full font-medium ${getStatusColor(
                          status.overall_status
                        )}`}
                      >
                        {status.overall_status}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="font-semibold text-gray-700 mb-1">All is Well:</p>
                        <p className="text-gray-600">{status.all_is_well}</p>
                      </div>

                      {status.risks && (
                        <div>
                          <p className="font-semibold text-gray-700 mb-1">⚠️ Risks:</p>
                          <p className="text-gray-600">{status.risks}</p>
                        </div>
                      )}

                      {status.opportunities && (
                        <div>
                          <p className="font-semibold text-gray-700 mb-1">💡 Opportunities:</p>
                          <p className="text-gray-600">{status.opportunities}</p>
                        </div>
                      )}

                      {status.action_items && (
                        <div>
                          <p className="font-semibold text-gray-700 mb-1">📌 Action Items:</p>
                          <p className="text-gray-600">{status.action_items}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t text-sm text-gray-500">
                      Submitted on: {new Date(status.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
