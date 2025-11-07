'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Project } from '@/types';
import Navbar from '@/components/Navbar';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
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

export default function ManageProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [deliveryDirectors, setDeliveryDirectors] = useState<User[]>([]);
  const [businessUnitHeads, setBusinessUnitHeads] = useState<BusinessUnitHead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'operations' | 'value'>('home');
  const [operations, setOperations] = useState<OperationsData[]>([]);
  const [operationsLoading, setOperationsLoading] = useState(false);
  const [values, setValues] = useState<ProjectValue[]>([]);
  const [valueContent, setValueContent] = useState('');
  const [valuesLoading, setValuesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    description: '',
    assignedPdm: '',
    projectManager: '',
    businessUnitHead: '',
    startDate: '',
    status: 'Active' as 'Active' | 'On Hold' | 'Completed',
  });

  useEffect(() => {
    fetchProjects();
    fetchDeliveryDirectors();
    fetchBusinessUnitHeads();
  }, []);

  useEffect(() => {
    if (editingProject && activeTab === 'operations') {
      fetchOperations(editingProject.id);
    }
  }, [editingProject, activeTab]);

  useEffect(() => {
    if (editingProject && activeTab === 'value') {
      fetchValues(editingProject.id);
    }
  }, [editingProject, activeTab]);

  const fetchProjects = async () => {
    try {
      const response = await api.get<Project[]>('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryDirectors = async () => {
    try {
      const response = await api.get<User[]>('/auth/users?role=PDM');
      setDeliveryDirectors(response.data);
    } catch (error) {
      console.error('Failed to fetch Delivery Directors:', error);
    }
  };

  const fetchBusinessUnitHeads = async () => {
    try {
      const response = await api.get<BusinessUnitHead[]>('/business-unit-heads');
      setBusinessUnitHeads(response.data);
    } catch (error) {
      console.error('Failed to fetch business unit heads:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await api.put(`/projects/${editingProject.id}`, formData);
      } else {
        await api.post('/projects', formData);
      }
      fetchProjects();
      resetForm();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save project');
    }
  };

  const handleEdit = (project: any) => {
    setEditingProject(project);
    const startDate = project.start_date || project.startDate;
    setFormData({
      name: project.name,
      client: project.client,
      description: project.description || '',
      assignedPdm: project.assigned_pdm || '',
      projectManager: project.project_manager || '',
      businessUnitHead: project.business_unit_head || '',
      startDate: new Date(startDate).toISOString().split('T')[0],
      status: project.status,
    });
    setShowForm(true);
    setActiveTab('home');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.delete(`/projects/${id}`);
      fetchProjects();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete project');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      client: '',
      description: '',
      assignedPdm: '',
      projectManager: '',
      businessUnitHead: '',
      startDate: '',
      status: 'Active',
    });
    setEditingProject(null);
    setShowForm(false);
    setActiveTab('home');
    setOperations([]);
    setValues([]);
    setValueContent('');
  };

  const handleAddProject = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      client: '',
      description: '',
      assignedPdm: '',
      projectManager: '',
      businessUnitHead: '',
      startDate: '',
      status: 'Active',
    });
    setShowForm(true);
    setActiveTab('home');
  };

  const fetchOperations = async (projectId: string) => {
    try {
      setOperationsLoading(true);
      const response = await api.get(`/projects/${projectId}/operations`);
      setOperations(response.data);
    } catch (err: any) {
      console.error('Failed to fetch operations:', err);
    } finally {
      setOperationsLoading(false);
    }
  };

  const fetchValues = async (projectId: string) => {
    try {
      setValuesLoading(true);
      const response = await api.get(`/projects/${projectId}/values`);
      setValues(response.data);
    } catch (err: any) {
      console.error('Failed to fetch values:', err);
    } finally {
      setValuesLoading(false);
    }
  };

  const handleAddValue = async () => {
    if (!editingProject) return;
    try {
      setSaving(true);
      await api.post(`/projects/${editingProject.id}/values`, {
        content: valueContent
      });
      alert('Value added successfully!');
      setValueContent(''); // Clear editor
      fetchValues(editingProject.id); // Refresh feed
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add value');
    } finally {
      setSaving(false);
    }
  };

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'On Hold':
        return 'bg-amber-100 text-amber-800';
      case 'Completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Manage Projects</h1>
          <button
            onClick={() => showForm ? resetForm() : handleAddProject()}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            {showForm ? 'Cancel' : 'Add Project'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingProject ? `Project: ${formData.name}` : 'Add New Project'}
            </h2>

            {editingProject && (
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
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Home Tab Content */}
              {(!editingProject || activeTab === 'home') && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
              <div>
                <label className="block text-sm font-medium mb-1">Client *</label>
                <input
                  type="text"
                  value={formData.client}
                  onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Brief project description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Delivery Director *
                </label>
                <select
                  value={formData.assignedPdm}
                  onChange={(e) => setFormData({ ...formData, assignedPdm: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Select a Delivery Director</option>
                  {deliveryDirectors.map((dd) => (
                    <option key={dd.id} value={dd.id}>
                      {dd.name} ({dd.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Project Manager
                </label>
                <input
                  type="email"
                  value={formData.projectManager}
                  onChange={(e) => setFormData({ ...formData, projectManager: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="projectmanager@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Business Unit Head
                </label>
                <select
                  value={formData.businessUnitHead}
                  onChange={(e) => setFormData({ ...formData, businessUnitHead: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select Business Unit Head...</option>
                  {businessUnitHeads.map((buh) => (
                    <option key={buh.id} value={buh.email}>
                      {buh.name} ({buh.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Date *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="Active">Active</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
                </>
              )}

              {/* Operations Tab Content */}
              {editingProject && activeTab === 'operations' && (
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
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted By</th>
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
                              <td className="px-4 py-3 whitespace-nowrap text-sm">{op.submitted_by_name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Value Tab Content */}
              {editingProject && activeTab === 'value' && (
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

              {/* Form Actions - Always visible */}
              {(!editingProject || activeTab === 'home') && (
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    {editingProject ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {!showForm && (
          <>
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Project Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Delivery Director
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Start Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {projects.map((project) => (
                      <tr key={project.id}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                          {project.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{project.client}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(project as any).pdm_name || 'Not assigned'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date((project as any).start_date || project.startDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                              project.status
                            )}`}
                          >
                            {project.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                          <button
                            onClick={() => handleEdit(project)}
                            className="text-primary hover:text-blue-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(project.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {projects.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No projects found. Add your first project!
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
