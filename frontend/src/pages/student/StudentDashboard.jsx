import { useQuery } from '@tanstack/react-query';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function StudentDashboard() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['student-profile', user?._id],
    queryFn: () => API.get(`/students?userId=${user._id}&limit=1`).then((r) => r.data.data[0]),
    enabled: !!user?._id,
  });

  const { data: report } = useQuery({
    queryKey: ['student-report-dash', profile?._id],
    queryFn: () => API.get(`/reports/student/${profile._id}`).then((r) => r.data.data),
    enabled: !!profile?._id,
  });

  const { data: marks } = useQuery({
    queryKey: ['student-marks-dash', profile?._id],
    queryFn: () => API.get(`/marks/student/${profile._id}`).then((r) => r.data.data),
    enabled: !!profile?._id,
  });

  const chartData = marks?.map((m) => ({
    subject: m.subjectId?.name || 'N/A',
    Midterm: m.midtermMarks || 0,
    'End-Term': m.endTermMarks || 0,
  })) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5 md:col-span-2">
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Personal Information</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p><strong>Name:</strong> {profile?.firstName} {profile?.lastName}</p>
            <p><strong>Code:</strong> {profile?.studentCode}</p>
            <p><strong>Class:</strong> {profile?.classId?.name || '-'}</p>
            <p><strong>Section:</strong> {profile?.sectionId?.name || '-'}</p>
            <p><strong>Gender:</strong> {profile?.gender}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Performance</h2>
          {report?.report ? (
            <div>
              <p className="text-3xl font-bold text-blue-600">{report.report.overallAverage?.toFixed(1)}%</p>
              <p className="text-sm text-gray-500">Overall Average</p>
              <p>Grade: <strong>{report.report.grade}</strong></p>
              <p>Rank: <strong>#{report.report.classRank}</strong> in class</p>
              <p className={`font-bold ${report.report.remarks === 'Pass' ? 'text-green-600' : 'text-red-600'}`}>
                {report.report.remarks}
              </p>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No report available yet</p>
          )}
        </div>
      </div>
      {chartData.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Subject Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="Midterm" fill="#2563EB" />
              <Bar dataKey="End-Term" fill="#14B8A6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
