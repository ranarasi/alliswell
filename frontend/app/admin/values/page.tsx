'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';

interface ProjectValue {
  id: string;
  project_id: string;
  project_name: string;
  client: string;
  content: string;
  submitted_by_name: string;
  created_at: string;
}

export default function AdminValuesPage() {
  const [values, setValues] = useState<ProjectValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filteredValues, setFilteredValues] = useState<ProjectValue[]>([]);

  useEffect(() => {
    fetchValues();
  }, []);

  useEffect(() => {
    filterValues();
  }, [values, fromDate, toDate]);

  const fetchValues = async () => {
    try {
      setLoading(true);
      const response = await api.get<ProjectValue[]>('/values');
      setValues(response.data);
    } catch (error) {
      console.error('Failed to fetch values:', error);
      alert('Failed to fetch values');
    } finally {
      setLoading(false);
    }
  };

  const filterValues = () => {
    let filtered = [...values];

    if (fromDate) {
      const from = new Date(fromDate);
      filtered = filtered.filter(v => new Date(v.created_at) >= from);
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999); // Include entire day
      filtered = filtered.filter(v => new Date(v.created_at) <= to);
    }

    setFilteredValues(filtered);
  };

  const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
  };

  const handleExport = () => {
    // Create formatted content for export
    let exportContent = '# VALUE REPOSITORY\n\n';
    exportContent += `Report Generated: ${new Date().toLocaleString()}\n`;
    if (fromDate || toDate) {
      exportContent += `Date Range: ${fromDate || 'All'} to ${toDate || 'All'}\n`;
    }
    exportContent += `Total Entries: ${filteredValues.length}\n\n`;
    exportContent += '---\n\n';

    filteredValues.forEach((value, index) => {
      exportContent += `## ${index + 1}. ${value.client} - ${value.project_name}\n\n`;
      exportContent += `**Date:** ${new Date(value.created_at).toLocaleDateString()}\n\n`;
      exportContent += `**Submitted By:** ${value.submitted_by_name}\n\n`;

      // Remove HTML tags for plain text export
      const plainTextContent = value.content
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"');

      exportContent += `**Content:**\n${plainTextContent}\n\n`;
      exportContent += '---\n\n';
    });

    // Create blob and download
    const blob = new Blob([exportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `value-repository-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar mode="admin" />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Value Repository</h1>
          <p className="text-gray-600">View all value entries across projects with date range filtering</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
              <button
                onClick={handleExport}
                disabled={filteredValues.length === 0}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Total Values</p>
              <p className="text-2xl font-bold text-gray-900">{filteredValues.length}</p>
            </div>
            {(fromDate || toDate) && (
              <div className="text-sm text-gray-600">
                Filtered by date range
              </div>
            )}
          </div>
        </div>

        {/* Values List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-2 text-gray-600">Loading values...</p>
          </div>
        ) : filteredValues.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No values found for the selected date range</p>
            {(fromDate || toDate) && (
              <button
                onClick={handleClearFilters}
                className="mt-4 text-primary hover:underline"
              >
                Clear filters to see all values
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredValues.map((value, index) => (
              <div key={value.id} className="bg-white rounded-lg shadow-md p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4 pb-4 border-b">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {index + 1}. {value.client}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">Project: {value.project_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {new Date(value.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Submitted by: {value.submitted_by_name}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div
                  className="text-gray-700 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: value.content }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
