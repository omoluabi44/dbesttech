'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api/client';
import { Plus } from 'lucide-react';

interface School {
  id: number;
  name: string;
  address: string;
  contact_email: string;
}

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const res = await api.get('/accounts/schools/');
      setSchools(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Schools</h1>
        <button className="flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-5 h-5" />
          <span>Add School</span>
        </button>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--surface-light)] border-b border-[var(--surface-dark)]">
                <th className="p-4 font-medium text-gray-400">Name</th>
                <th className="p-4 font-medium text-gray-400">Contact Email</th>
                <th className="p-4 font-medium text-gray-400">Address</th>
                <th className="p-4 font-medium text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--surface-dark)]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    Loading schools...
                  </td>
                </tr>
              ) : schools.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No schools found.
                  </td>
                </tr>
              ) : (
                schools.map((school) => (
                  <tr key={school.id} className="hover:bg-[var(--surface-light)] transition-colors">
                    <td className="p-4 text-white font-medium">{school.name}</td>
                    <td className="p-4 text-gray-400">{school.contact_email || '-'}</td>
                    <td className="p-4 text-gray-400 max-w-xs truncate">{school.address || '-'}</td>
                    <td className="p-4 text-right">
                      <button className="text-secondary-400 hover:text-secondary-300 text-sm font-medium">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
