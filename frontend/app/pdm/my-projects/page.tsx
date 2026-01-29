'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiScoped } from '@/lib/api';
import { usePDM } from '@/lib/pdmContext';
import Navbar from '@/components/Navbar';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface Project {
  id: string;
  name: string;
  client: string;
  status: string;
  start_date: string;
  description?: string;
  project_manager?: string;
  business_unit_head?: string;
}

interface OperationsData {
  id: string;
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
  submitted_by_name?: string;
  created_at: string;
}

interface ProjectValue {
  id: string;
  project_id: string;
  content: string;
  submitted_by_name: string;
  created_at: string;
}

interface BusinessUnitHead {
  id: string;
  name: string;
  email: string;
}

export default function MyProjectsPage() {
  const router = useRouter();
  const { selectedPDM } = usePDM();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'operations' | 'value'>('home');
  const [businessUnitHeads, setBusinessUnitHeads] = useState<BusinessUnitHead[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    client: '',
    description: '',
    start_date: '',
    status: 'Active',
    project_manager: '',
    business_unit_head: '',
  });

  // Operations state
  const [operations, setOperations] = useState<OperationsData[]>([]);
  const [operationsLoading, setOperationsLoading] = useState(false);
  const [operationsForm, setOperationsForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    teamSize: '',
    revenue: '',
    cost: '',
    gmPercentage: '',
    utilizationPercentage: '',
    shadows: '',
    rampUp: '',
    rampDown: '',
    openPositions: '',
  });

  // Value state
  const [values, setValues] = useState<ProjectValue[]>([]);
  const [valueContent, setValueContent] = useState('');
  const [valuesLoading, setValuesLoading] = useState(false);

  useEffect(() => {
    if (!selectedPDM) {
      router.push('/');
      return;
    }
    fetchProjects();
    fetchBusinessUnitHeads();
  }, [router]);

  // When project is selected, fetch its details
  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectDetails(selectedProjectId);
      fetchOperations(selectedProjectId);
    }
  }, [selectedProjectId]);

  // Fetch operations when month/year changes
  useEffect(() => {
    if (activeTab === 'operations' && selectedProjectId && operationsForm.month && operationsForm.year) {
      fetchOperationsByMonth(selectedProjectId, operationsForm.month, operationsForm.year);
    }
  }, [operationsForm.month, operationsForm.year, activeTab, selectedProjectId]);

  // Fetch values when Value tab is active
  useEffect(() => {
    if (activeTab === 'value' && selectedProjectId) {
      fetchValues(selectedProjectId);
    }
  }, [activeTab, selectedProjectId]);

  // Auto-calculate GM% when Revenue or Cost changes
  useEffect(() => {
    const revenue = parseFloat(operationsForm.revenue) || 0;
    const cost = parseFloat(operationsForm.cost) || 0;
    if (revenue > 0) {
      const gm = ((revenue - cost) / revenue) * 100;
      setOperationsForm(prev => ({
        ...prev,
        gmPercentage: gm.toFixed(2)
      }));
    }
  }, [operationsForm.revenue, operationsForm.cost]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await apiScoped.get<Project[]>('/projects?status=Active');
      setProjects(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessUnitHeads = async () => {
    try {
      const response = await apiScoped.get<BusinessUnitHead[]>('/business-unit-heads');
      setBusinessUnitHeads(response.data);
    } catch (err: any) {
      console.error('Failed to fetch business unit heads:', err);
    }
  };

  const fetchProjectDetails = async (projectId: string) => {
    try {
      const response = await apiScoped.get(`/projects/${projectId}`);
      const projectData = response.data;

      // Populate form data
      setFormData({
        name: projectData.name,
        client: projectData.client,
        description: projectData.description || '',
        start_date: projectData.start_date,
        status: projectData.status,
        project_manager: projectData.project_manager || '',
        business_unit_head: projectData.business_unit_head || '',
      });

      // Reset to home tab when switching projects
      setActiveTab('home');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch project details');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    try {
      setSaving(true);
      await apiScoped.put(`/projects/${selectedProjectId}`, {
        name: formData.name,
        client: formData.client,
        description: formData.description,
        startDate: formData.start_date,
        status: formData.status,
        projectManager: formData.project_manager,
        businessUnitHead: formData.business_unit_head,
      });

      alert('Project updated successfully!');
      fetchProjects(); // Refresh the dropdown
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  // Fetch all operations for the project
  const fetchOperations = async (projectId: string) => {
    try {
      setOperationsLoading(true);
      const response = await apiScoped.get(`/projects/${projectId}/operations`);
      setOperations(response.data);
    } catch (err: any) {
      console.error('Failed to fetch operations:', err);
      setOperations([]);
    } finally {
      setOperationsLoading(false);
    }
  };

  // Fetch specific month's operations data
  const fetchOperationsByMonth = async (projectId: string, month: number, year: number) => {
    try {
      const response = await apiScoped.get(`/projects/${projectId}/operations/${month}/${year}`);
      const data = response.data;
      // Pre-fill form with existing data
      setOperationsForm({
        month: data.month,
        year: data.year,
        teamSize: data.team_size?.toString() || '',
        revenue: data.revenue?.toString() || '',
        cost: data.cost?.toString() || '',
        gmPercentage: data.gm_percentage?.toString() || '',
        utilizationPercentage: data.utilization_percentage?.toString() || '',
        shadows: data.shadows?.toString() || '',
        rampUp: data.ramp_up?.toString() || '',
        rampDown: data.ramp_down?.toString() || '',
        openPositions: data.open_positions?.toString() || '',
      });
    } catch (err: any) {
      // If no data exists for this month, reset form to defaults (keeping month/year)
      if (err.response?.status === 404) {
        setOperationsForm(prev => ({
          ...prev,
          teamSize: '',
          revenue: '',
          cost: '',
          gmPercentage: '',
          utilizationPercentage: '',
          shadows: '',
          rampUp: '',
          rampDown: '',
          openPositions: '',
        }));
      }
    }
  };

  // Fetch values for the project
  const fetchValues = async (projectId: string) => {
    try {
      setValuesLoading(true);
      const response = await apiScoped.get(`/projects/${projectId}/values`);
      setValues(response.data);
    } catch (err: any) {
      console.error('Failed to fetch values:', err);
    } finally {
      setValuesLoading(false);
    }
  };

  // Submit new value
  const handleAddValue = async () => {
    if (!selectedProjectId) return;
    try {
      setSaving(true);
      await apiScoped.post(`/projects/${selectedProjectId}/values`, {
        content: valueContent
      });
      alert('Value added successfully!');
      setValueContent(''); // Clear editor
      fetchValues(selectedProjectId); // Refresh feed
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add value');
    } finally {
      setSaving(false);
    }
  };

  // Submit operations data
  const handleOperationsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    try {
      setSaving(true);
      await apiScoped.post(`/projects/${selectedProjectId}/operations`, {
        month: operationsForm.month,
        year: operationsForm.year,
        teamSize: parseInt(operationsForm.teamSize) || 0,
        revenue: parseFloat(operationsForm.revenue) || 0,
        cost: parseFloat(operationsForm.cost) || 0,
        gmPercentage: parseFloat(operationsForm.gmPercentage) || 0,
        utilizationPercentage: parseFloat(operationsForm.utilizationPercentage) || 0,
        shadows: parseInt(operationsForm.shadows) || 0,
        rampUp: parseInt(operationsForm.rampUp) || 0,
        rampDown: parseInt(operationsForm.rampDown) || 0,
        openPositions: parseInt(operationsForm.openPositions) || 0,
      });
      alert('Operations data saved successfully!');
      fetchOperations(selectedProjectId); // Refresh the table
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save operations data');
    } finally {
      setSaving(false);
    }
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

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <>
      <Navbar mode="delivery" />
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-6">My Projects</h1>

          {/* Project Selector */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <label className="block text-sm font-medium mb-2">
              Select Project *
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Choose a project...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} - {project.client}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Edit Form - Only shown when project is selected */}
          {selectedProjectId && selectedProject && (
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* Project Title */}
              <h2 className="text-2xl font-bold text-text mb-6">Project: {selectedProject.name}</h2>

              {/* Tabs Navigation */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-8">
                  <button
                    type="button"
                    onClick={() => setActiveTab('home')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'home'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Home
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('operations')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'operations'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Operations
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('value')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'value'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Value
                  </button>
                </nav>
              </div>

              {/* Home Tab Content */}
              {activeTab === 'home' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client *
                    </label>
                    <input
                      type="text"
                      value={formData.client}
                      onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Brief project description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Manager
                    </label>
                    <input
                      type="email"
                      value={formData.project_manager}
                      onChange={(e) => setFormData({ ...formData, project_manager: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="projectmanager@example.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email address of the Project Manager</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Unit Head
                    </label>
                    <select
                      value={formData.business_unit_head}
                      onChange={(e) => setFormData({ ...formData, business_unit_head: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select Business Unit Head...</option>
                      {businessUnitHeads.map((buh) => (
                        <option key={buh.id} value={buh.email}>
                          {buh.name} ({buh.email})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Select the Business Unit Head for this project</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="Active">Active</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}

              {/* Operations Tab Content */}
              {activeTab === 'operations' && (
                <div className="space-y-6">
                  {/* Operations Form */}
                  <form onSubmit={handleOperationsSubmit} className="space-y-4 border-b pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Operations Data</h3>

                    {/* Month-Year Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Month *
                        </label>
                        <select
                          value={operationsForm.month}
                          onChange={(e) => setOperationsForm({ ...operationsForm, month: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                          required
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Year *
                        </label>
                        <input
                          type="number"
                          value={operationsForm.year}
                          onChange={(e) => setOperationsForm({ ...operationsForm, year: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                          min="2000"
                          max="2100"
                          required
                        />
                      </div>
                    </div>

                    {/* Operations Metrics - 2 Column Layout */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                      {/* Column 1 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Revenue ($)
                        </label>
                        <input
                          type="text"
                          value={operationsForm.revenue}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              setOperationsForm({ ...operationsForm, revenue: value });
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="0.00"
                        />
                      </div>

                      {/* Column 2 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Team Size
                        </label>
                        <input
                          type="text"
                          value={operationsForm.teamSize}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d+$/.test(value)) {
                              setOperationsForm({ ...operationsForm, teamSize: value });
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="0"
                        />
                      </div>

                      {/* Column 1 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cost ($)
                        </label>
                        <input
                          type="text"
                          value={operationsForm.cost}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              setOperationsForm({ ...operationsForm, cost: value });
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="0.00"
                        />
                      </div>

                      {/* Column 2 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          # of Shadows
                        </label>
                        <input
                          type="text"
                          value={operationsForm.shadows}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d+$/.test(value)) {
                              setOperationsForm({ ...operationsForm, shadows: value });
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="0"
                        />
                      </div>

                      {/* Column 1 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          GM % (computed)
                        </label>
                        <input
                          type="text"
                          value={operationsForm.gmPercentage}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              setOperationsForm({ ...operationsForm, gmPercentage: value });
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50"
                          placeholder="0.00"
                        />
                      </div>

                      {/* Column 2 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Utilization %
                        </label>
                        <input
                          type="text"
                          value={operationsForm.utilizationPercentage}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              setOperationsForm({ ...operationsForm, utilizationPercentage: value });
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="0.00"
                        />
                      </div>

                      {/* Column 1 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ramp Up
                        </label>
                        <input
                          type="text"
                          value={operationsForm.rampUp}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d+$/.test(value)) {
                              setOperationsForm({ ...operationsForm, rampUp: value });
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="0"
                        />
                      </div>

                      {/* Column 2 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ramp Down
                        </label>
                        <input
                          type="text"
                          value={operationsForm.rampDown}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d+$/.test(value)) {
                              setOperationsForm({ ...operationsForm, rampDown: value });
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="0"
                        />
                      </div>

                      {/* Column 1 - Open Positions */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Open Positions (Month End)
                        </label>
                        <input
                          type="text"
                          value={operationsForm.openPositions}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d+$/.test(value)) {
                              setOperationsForm({ ...operationsForm, openPositions: value });
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Submit'}
                    </button>
                  </form>

                  {/* Operations History Table */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Operations History</h3>
                    {operationsLoading ? (
                      <div className="text-center py-8 text-gray-500">Loading...</div>
                    ) : operations.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">No operations data yet</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 border">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
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
                            {operations.map((op) => (
                              <tr key={op.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{getMonthName(op.month)} {op.year}</td>
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
                </div>
              )}

              {/* Value Tab Content */}
              {activeTab === 'value' && (
                <div className="space-y-6">
                  {/* Label */}
                  <p className="text-sm text-gray-700 mb-4">
                    Add any value created by the team during the month / quarter; value board review reports; value board review action items
                  </p>

                  {/* WYSIWYG Editor */}
                  <div className="bg-white">
                    <ReactQuill
                      theme="snow"
                      value={valueContent}
                      onChange={setValueContent}
                      placeholder="Enter value details..."
                      className="h-64 mb-12"
                    />
                  </div>

                  {/* Add Value Button */}
                  <button
                    type="button"
                    onClick={handleAddValue}
                    disabled={!valueContent.trim() || saving}
                    className="px-6 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Adding...' : 'Add Value'}
                  </button>

                  {/* Values Feed */}
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Previous Values</h3>
                    {valuesLoading ? (
                      <div className="text-center py-8 text-gray-500">Loading...</div>
                    ) : values.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">No values added yet</div>
                    ) : (
                      <div className="space-y-4">
                        {values.map((value) => (
                          <div key={value.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm text-gray-600">
                                Added by {value.submitted_by_name} on {new Date(value.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div
                              className="prose max-w-none"
                              dangerouslySetInnerHTML={{ __html: value.content }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty state when no project selected */}
          {!selectedProjectId && !loading && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-xl text-gray-500">
                Select a project from the dropdown above to view and edit project details
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
