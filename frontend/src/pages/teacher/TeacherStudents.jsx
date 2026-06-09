import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function TeacherStudents() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const { data: teacher } = useQuery({
    queryKey: ['teacher-profile', user?.email],
    queryFn: () => API.get(`/teachers?search=${user.email}&limit=1`).then((r) => r.data.data[0]),
    enabled: !!user?.email,
  });

  const { data: subjects } = useQuery({
    queryKey: ['teacher-subjects', teacher?._id],
    queryFn: () => API.get(`/teachers/${teacher._id}/subjects`).then((r) => r.data.data),
    enabled: !!teacher?._id,
  });

  const { data } = useQuery({
    queryKey: ['teacher-students', search],
    queryFn: () => API.get(`/students?limit=50&search=${search}`).then((r) => r.data),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Students</h1>
      {subjects?.length > 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing students in your assigned classes for: {subjects.map((s) => s.name).join(', ')}
        </p>
      )}
      <input placeholder="Search by name or code..." value={search} onChange={(e) => setSearch(e.target.value)}
        className="w-full md:w-96 px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="p-3 text-left">Code</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Gender</th>
                <th className="p-3 text-left">Class</th>
                <th className="p-3 text-left">Section</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data?.data?.length === 0 && (
                <tr><td colSpan="5" className="p-6 text-center text-gray-400">No students found in your assigned classes.</td></tr>
              )}
              {data?.data?.map((s) => (
                <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="p-3 font-medium text-gray-900 dark:text-white">{s.studentCode}</td>
                  <td className="p-3 text-gray-700 dark:text-gray-300">{s.firstName} {s.lastName}</td>
                  <td className="p-3 text-gray-700 dark:text-gray-300">{s.gender}</td>
                  <td className="p-3 text-gray-700 dark:text-gray-300">{s.classId?.name || '-'}</td>
                  <td className="p-3 text-gray-700 dark:text-gray-300">{s.sectionId?.name || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
