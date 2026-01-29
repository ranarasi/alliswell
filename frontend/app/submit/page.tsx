'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiScoped } from '@/lib/api';
import { Project, StatusColor } from '@/types';
import Navbar from '@/components/Navbar';

export default function SubmitStatusPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [weekEndingDate, setWeekEndingDate] = useState('');
  const [overallStatus, setOverallStatus] = useState<StatusColor>('Green');
  const [allIsWell, setAllIsWell] = useState('');
  const [risks, setRisks] = useState('');
  const [opportunities, setOpportunities] = useState('');
  const [valueProjects, setValueProjects] = useState('');
  const [actionItems, setActionItems] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    fetchProjects();
    // Set default week ending date to next Friday
    const nextFriday = getNextFriday();
    setWeekEndingDate(nextFriday);
  }, []);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!selectedProject || !allIsWell) return;

    const timer = setTimeout(() => {
      saveDraft();
    }, 30000);

    return () => clearTimeout(timer);
  }, [selectedProject, weekEndingDate, overallStatus, allIsWell, risks, opportunities, valueProjects, actionItems]);

  const getNextFriday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 7 - dayOfWeek + 5;
    const friday = new Date(today);
    friday.setDate(today.getDate() + daysUntilFriday);
    return friday.toISOString().split('T')[0];
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    const dayOfWeek = selectedDate.getDay();

    // Check if selected date is a Friday (5 = Friday)
    if (dayOfWeek !== 5) {
      alert('Please select a Friday as the week ending date');
      return;
    }

    setWeekEndingDate(e.target.value);
  };

  const fetchProjects = async () => {
    try {
      const response = await apiScoped.get<Project[]>('/projects?status=Active');
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const copyFromLastWeek = async () => {
    if (!selectedProject) {
      alert('Please select a project first');
      return;
    }

    try {
      const response = await apiScoped.get(`/status/previous/${selectedProject}`);
      const previous = response.data;
      setOverallStatus(previous.overall_status);
      setAllIsWell(previous.all_is_well);
      setRisks(previous.risks || '');
      setOpportunities(previous.opportunities || '');
      setValueProjects(previous.value_projects || '');
      setActionItems(previous.action_items || '');
    } catch (error: any) {
      alert(error.response?.data?.message || 'No previous status found');
    }
  };

  const saveDraft = async () => {
    if (!selectedProject || !weekEndingDate || !allIsWell) return;

    setAutoSaving(true);
    try {
      await apiScoped.post('/status', {
        projectId: selectedProject,
        weekEndingDate,
        overallStatus,
        allIsWell,
        risks,
        opportunities,
        valueProjects,
        actionItems,
        isDraft: true,
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setAutoSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiScoped.post('/status', {
        projectId: selectedProject,
        weekEndingDate,
        overallStatus,
        allIsWell,
        risks,
        opportunities,
        valueProjects,
        actionItems,
        isDraft: false,
      });

      alert('Status submitted successfully!');
      // Redirect back to My Projects page
      router.push('/pdm');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to submit status');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedProject('');
    setWeekEndingDate(getNextFriday());
    setOverallStatus('Green');
    setAllIsWell('');
    setRisks('');
    setOpportunities('');
    setValueProjects('');
    setActionItems('');
    setLastSaved(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar mode="delivery" />
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Submit Weekly Status</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Project *
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Choose a project...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} - {project.client}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Week Ending Date * (Fridays only)
            </label>
            <input
              type="date"
              value={weekEndingDate}
              onChange={handleDateChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Please select a Friday</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Overall Status *
            </label>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              {(['Green', 'Amber', 'Red'] as StatusColor[]).map((status) => (
                <label key={status} className="flex items-center">
                  <input
                    type="radio"
                    value={status}
                    checked={overallStatus === status}
                    onChange={(e) => setOverallStatus(e.target.value as StatusColor)}
                    className="mr-2"
                  />
                  <span
                    className={`px-3 py-1 rounded-md text-sm sm:text-base ${
                      status === 'Green'
                        ? 'bg-green text-white'
                        : status === 'Amber'
                        ? 'bg-amber text-white'
                        : 'bg-red text-white'
                    }`}
                  >
                    {status}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={copyFromLastWeek}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors text-sm"
            >
              📋 Copy from last week
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              All is Well * (max 1000 chars)
            </label>
            <textarea
              value={allIsWell}
              onChange={(e) => setAllIsWell(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              rows={6}
              maxLength={1000}
              required
            />
            <div className="text-sm text-gray-500 mt-1">
              {allIsWell.length} / 1000 characters
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Risks (Optional, max 300 chars)
            </label>
            <textarea
              value={risks}
              onChange={(e) => setRisks(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              maxLength={300}
            />
            <div className="text-sm text-gray-500 mt-1">
              {risks.length} / 300 characters
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Opportunities (Optional, max 300 chars)
            </label>
            <textarea
              value={opportunities}
              onChange={(e) => setOpportunities(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              maxLength={300}
            />
            <div className="text-sm text-gray-500 mt-1">
              {opportunities.length} / 300 characters
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Value Projects (incl. GenAI) (Optional, max 300 chars)
            </label>
            <textarea
              value={valueProjects}
              onChange={(e) => setValueProjects(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              maxLength={300}
            />
            <div className="text-sm text-gray-500 mt-1">
              {valueProjects.length} / 300 characters
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Action Items (Optional, max 300 chars)
            </label>
            <textarea
              value={actionItems}
              onChange={(e) => setActionItems(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              maxLength={300}
            />
            <div className="text-sm text-gray-500 mt-1">
              {actionItems.length} / 300 characters
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t">
            <div className="text-sm text-gray-500">
              {autoSaving && 'Auto-saving...'}
              {lastSaved && !autoSaving && (
                <>Auto-saved {Math.floor((Date.now() - lastSaved.getTime()) / 1000 / 60)} minutes ago</>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => saveDraft()}
                className="flex-1 sm:flex-none px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-sm sm:text-base"
              >
                Save Draft
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 sm:flex-none px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm sm:text-base"
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
