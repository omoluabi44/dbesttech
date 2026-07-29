'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api/client';

interface Student {
  id: number;
  user_email?: string; // We'd need this from serializer but for now we have basic profile data
  level_display: string;
  category_display: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/accounts/admin-dashboard/students/');
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Students</h1>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--surface-light)] border-b border-[var(--surface-dark)]">
                <th className="p-4 font-medium text-gray-400">ID</th>
                <th className="p-4 font-medium text-gray-400">Level</th>
                <th className="p-4 font-medium text-gray-400">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--surface-dark)]">
              {loading ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    Loading students...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    No students registered to this school yet.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-[var(--surface-light)] transition-colors">
                    <td className="p-4 text-white font-medium">#{student.id}</td>
                    <td className="p-4 text-gray-300">{student.level_display}</td>
                    <td className="p-4 text-gray-400">
                      <span className="bg-primary-500/20 text-primary-400 px-3 py-1 rounded-full text-sm">
                        {student.category_display}
                      </span>
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
