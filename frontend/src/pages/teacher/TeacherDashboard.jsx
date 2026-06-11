import { useQuery } from '@tanstack/react-query';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function TeacherDashboard() {
  const { user } = useAuth();

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

  if (!teacher) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teacher Dashboard</h1>
      <p className="text-gray-500 dark:text-gray-300">Welcome, {user?.name}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">My Subjects</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{subjects?.length || 0}</p>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Assigned Subjects</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjects?.map((s) => (
            <div key={s._id} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="font-semibold text-gray-900 dark:text-white">{s.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{s.level}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {s.classIds?.map((c) => (
                  <span key={c._id} className="text-xs bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">{c.name}</span>
                ))}
              </div>
            </div>
          ))}
          {(!subjects || subjects.length === 0) && (
            <p className="text-gray-500 dark:text-gray-400">No subjects assigned yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
