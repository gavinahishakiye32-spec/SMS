import { useQuery } from '@tanstack/react-query';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function TeacherSubjects() {
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

  const subjectList = Array.isArray(subjects) ? subjects : [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Subjects</h1>
      {subjectList.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No subjects assigned yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjectList.map((s) => (
            <div key={s._id} className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{s.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{s.level}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {s.classIds?.map((c) => (
                  <span key={c._id} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">{c.name}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
