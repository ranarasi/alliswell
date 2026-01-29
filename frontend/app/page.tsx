'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from "@/components/Logo";
import { api } from '@/lib/api';
import { usePDM } from '@/lib/pdmContext';

interface PDM {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function Home() {
  const router = useRouter();
  const { setSelectedPDM } = usePDM();
  const [pdms, setPdms] = useState<PDM[]>([]);
  const [selectedPdmId, setSelectedPdmId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPDMs();
  }, []);

  const fetchPDMs = async () => {
    try {
      const response = await api.get<PDM[]>('/auth/users?role=PDM');
      setPdms(response.data);
    } catch (error) {
      console.error('Failed to fetch PDMs:', error);
    }
  };

  const handleSelectPDM = () => {
    if (!selectedPdmId) {
      alert('Please select a Delivery Director');
      return;
    }

    const pdm = pdms.find(p => p.id === selectedPdmId);
    if (pdm) {
      setSelectedPDM(pdm);
      router.push('/pdm');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <div className="flex justify-center mb-6">
          <Logo size={80} />
        </div>
        <h1 className="text-3xl font-bold text-center mb-2">AllIsWell</h1>
        <p className="text-lg text-secondary text-center mb-8">Project Status Tracker</p>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Select Delivery Director
          </label>
          <select
            value={selectedPdmId}
            onChange={(e) => setSelectedPdmId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Choose a Delivery Director...</option>
            {pdms.map((pdm) => (
              <option key={pdm.id} value={pdm.id}>
                {pdm.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSelectPDM}
          disabled={!selectedPdmId || loading}
          className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={() => router.push('/admin/projects')}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Go to Admin
          </button>
        </div>
      </div>
    </div>
  );
}
