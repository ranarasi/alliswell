'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import Navbar from '@/components/Navbar';

interface ProjectStatus {
  project_id: string;
  project_name: string;
  client: string;
  overall_status: 'Green' | 'Amber' | 'Red';
  all_is_well: string;
  risks?: string;
  opportunities?: string;
  action_items?: string;
  week_ending_date: string;
}

export default function WeeklySummaryPage() {
  const router = useRouter();
  const user = getUser();
  const [weekEndingDates, setWeekEndingDates] = useState<string[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [summaryGenerated, setSummaryGenerated] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'PDM') {
      router.push('/login');
      return;
    }
    fetchWeekEndingDates();
  }, [router]);

  const fetchWeekEndingDates = async () => {
    try {
      // Fetch all statuses to get unique week ending dates
      const response = await api.get('/status');
      const statuses = response.data;
      console.log('Fetched statuses for week dates:', statuses);

      const dates = statuses
        .filter((s: any) => s.week_ending_date)
        .map((s: any) => s.week_ending_date.split('T')[0]); // Just take the date part directly

      console.log('Extracted dates:', dates);

      const uniqueDates = Array.from(new Set(dates)) as string[];
      const sortedDates = uniqueDates.sort((a, b) =>
        new Date(b).getTime() - new Date(a).getTime()
      );

      console.log('Sorted unique dates:', sortedDates);
      setWeekEndingDates(sortedDates);

      // Pre-select the most recent week
      if (sortedDates.length > 0) {
        setSelectedWeek(sortedDates[0]);
        console.log('Pre-selected week:', sortedDates[0]);
      }
    } catch (error) {
      console.error('Failed to fetch week ending dates:', error);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    const dayOfWeek = selectedDate.getDay();

    // Check if selected date is a Friday (5 = Friday)
    if (dayOfWeek !== 5) {
      alert('Please select a Friday as the week ending date');
      return;
    }

    setSelectedWeek(e.target.value);
    setSummaryGenerated(false);
  };

  const generateSummary = async () => {
    if (!selectedWeek) {
      alert('Please select a week ending date');
      return;
    }

    try {
      setLoading(true);
      // Fetch all statuses for the selected week
      const response = await api.get(`/status?weekEndingDate=${selectedWeek}`);
      console.log('API Response:', response.data);

      // Map the response to match our interface
      const mappedData = response.data.map((item: any) => ({
        project_id: item.project_id,
        project_name: item.project_name,
        client: item.client,
        overall_status: item.overall_status,
        all_is_well: item.all_is_well,
        risks: item.risks,
        opportunities: item.opportunities,
        action_items: item.action_items,
        week_ending_date: item.week_ending_date,
      }));

      console.log('Mapped data:', mappedData);
      setProjectStatuses(mappedData);
      setSummaryGenerated(true);
    } catch (error: any) {
      console.error('Failed to generate summary:', error);
      alert(error.response?.data?.message || 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
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

  const copySummaryToClipboard = () => {
    const summaryText = generateSummaryText();
    navigator.clipboard.writeText(summaryText).then(() => {
      alert('Summary copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy summary');
    });
  };

  const generateSummaryText = () => {
    let text = `Weekly Project Status Summary\n`;
    text += `Week Ending: ${formatDate(selectedWeek)}\n`;
    text += `Delivery Director: ${user?.name}\n`;
    text += `\n${'='.repeat(60)}\n\n`;

    projectStatuses.forEach((project, index) => {
      text += `${index + 1}. ${project.project_name}\n`;
      text += `   Client: ${project.client}\n`;
      text += `   Status: ${project.overall_status} ${getStatusIcon(project.overall_status)}\n`;
      text += `\n   All is Well:\n   ${project.all_is_well}\n`;

      if (project.risks) {
        text += `\n   Risks:\n   ${project.risks}\n`;
      }

      if (project.opportunities) {
        text += `\n   Opportunities:\n   ${project.opportunities}\n`;
      }

      if (project.action_items) {
        text += `\n   Action Items:\n   ${project.action_items}\n`;
      }

      text += `\n${'-'.repeat(60)}\n\n`;
    });

    return text;
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text mb-2">Weekly Summary</h1>
            <p className="text-secondary">
              Generate a weekly summary of all your project status updates
            </p>
          </div>

          {/* Filters and Actions */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Week Ending Date (Fridays only)
                </label>
                <input
                  type="date"
                  value={selectedWeek}
                  onChange={handleDateChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Select week ending date"
                />
                <p className="text-xs text-gray-500 mt-1">Please select a Friday</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={generateSummary}
                  disabled={!selectedWeek || loading}
                  className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? 'Generating...' : 'Create Summary'}
                </button>
                {summaryGenerated && projectStatuses.length > 0 && (
                  <button
                    onClick={copySummaryToClipboard}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
                  >
                    Copy to Clipboard
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Summary Feed */}
          {summaryGenerated && (
            <div className="bg-white rounded-lg shadow-md p-8">
              {projectStatuses.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xl text-secondary">
                    No status updates found for the selected week
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Selected week: {formatDate(selectedWeek)}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Check the browser console (F12) for debugging information
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Summary Header */}
                  <div className="border-b pb-4">
                    <h2 className="text-2xl font-bold text-text mb-2">
                      Weekly Project Status Summary
                    </h2>
                    <p className="text-secondary">
                      Week Ending: {formatDate(selectedWeek)}
                    </p>
                    <p className="text-secondary">
                      Delivery Director: {user?.name}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      {projectStatuses.length} project{projectStatuses.length !== 1 ? 's' : ''} updated
                    </p>
                  </div>

                  {/* Project Statuses */}
                  {projectStatuses.map((project, index) => (
                    <div
                      key={project.project_id}
                      className="border-l-4 pl-6 py-4"
                      style={{
                        borderLeftColor:
                          project.overall_status === 'Green'
                            ? '#10b981'
                            : project.overall_status === 'Amber'
                            ? '#f59e0b'
                            : '#ef4444',
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-text flex items-center gap-2">
                            {index + 1}. {project.project_name}
                            <span className="text-2xl">
                              {getStatusIcon(project.overall_status)}
                            </span>
                          </h3>
                          <p className="text-sm text-secondary mt-1">
                            Client: {project.client}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            project.overall_status === 'Green'
                              ? 'bg-green-100 text-green-800'
                              : project.overall_status === 'Amber'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {project.overall_status}
                        </span>
                      </div>

                      <div className="space-y-4 mt-4">
                        <div>
                          <p className="font-semibold text-gray-700 mb-2">All is Well:</p>
                          <p className="text-gray-600 whitespace-pre-wrap">
                            {project.all_is_well}
                          </p>
                        </div>

                        {project.risks && (
                          <div>
                            <p className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
                              ⚠️ Risks:
                            </p>
                            <p className="text-gray-600 whitespace-pre-wrap">
                              {project.risks}
                            </p>
                          </div>
                        )}

                        {project.opportunities && (
                          <div>
                            <p className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
                              💡 Opportunities:
                            </p>
                            <p className="text-gray-600 whitespace-pre-wrap">
                              {project.opportunities}
                            </p>
                          </div>
                        )}

                        {project.action_items && (
                          <div>
                            <p className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
                              📌 Action Items:
                            </p>
                            <p className="text-gray-600 whitespace-pre-wrap">
                              {project.action_items}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
