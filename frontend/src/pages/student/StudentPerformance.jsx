import { useQuery } from '@tanstack/react-query';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function StudentPerformance() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['student-profile-perf', user?._id],
    queryFn: () => API.get(`/students?userId=${user._id}&limit=1`).then((r) => r.data.data[0]),
    enabled: !!user?._id,
  });

  const { data: marks } = useQuery({
    queryKey: ['student-marks-perf', profile?._id],
    queryFn: () => API.get(`/marks/student/${profile._id}`).then((r) => r.data.data),
    enabled: !!profile?._id,
  });

  const { data: ranking } = useQuery({
    queryKey: ['student-ranking', profile?._id],
    queryFn: () => API.get(`/students/${profile._id}/ranking`).then((r) => r.data.data),
    enabled: !!profile?._id,
  });

  const chartData = marks?.map((m) => ({
    subject: m.subjectId?.name || 'N/A',
    Midterm: m.midtermMarks || 0,
    'End-Term': m.endTermMarks || 0,
    Average: m.subjectAverage || 0,
  })) || [];

  const lineData = marks?.map((m) => ({
    subject: m.subjectId?.name || 'N/A',
    average: m.subjectAverage || 0,
    grade: m.grade || '-',
  })) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Performance</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
          <p className="text-sm text-gray-500 dark:text-gray-300">Class Rank</p>
          <p className="text-2xl font-bold text-blue-600">#{ranking?.rank || '-'} / {ranking?.total || '-'}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
          <p className="text-sm text-gray-500 dark:text-gray-300">Subjects</p>
          <p className="text-2xl font-bold text-teal-600">{marks?.length || 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
          <p className="text-sm text-gray-500 dark:text-gray-300">Student Code</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile?.studentCode}</p>
        </div>
      </div>
      {chartData.length > 0 && (
        <>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Subject Comparison</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="Midterm" fill="#2563EB" />
                <Bar dataKey="End-Term" fill="#14B8A6" />
                <Bar dataKey="Average" fill="#D97706" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Subject Averages</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="average" stroke="#2563EB" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
