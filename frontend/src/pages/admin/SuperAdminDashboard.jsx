import { useQuery } from '@tanstack/react-query';
import API from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function SuperAdminDashboard() {
  const { data: analytics } = useQuery({
    queryKey: ['analytics-school'],
    queryFn: () => API.get('/analytics/school').then((r) => r.data.data),
  });

  const stats = [
    { label: 'Total Students', value: analytics?.totalStudents || 0, color: 'bg-blue-500' },
    { label: 'Total Teachers', value: analytics?.totalTeachers || 0, color: 'bg-green-500' },
    { label: 'Total Classes', value: analytics?.totalClasses || 0, color: 'bg-teal-500' },
    { label: 'School Average', value: analytics?.averagePerformance?.toFixed(1) || '0.0', color: 'bg-purple-500' },
  ];

  const gradeData = analytics?.gradeDistribution
    ? Object.entries(analytics.gradeDistribution).map(([name, value]) => ({ name, value }))
    : [];

  const COLORS = ['#16A34A', '#2563EB', '#D97706', '#DC2626', '#9333EA', '#6B7280'];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Super Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
            <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center text-white text-lg font-bold mb-3`}>
              {s.value.toString()[0]}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Grade Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={gradeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {gradeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Performance Overview</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Pass Rate</span>
              <span className="text-green-600 font-bold">{analytics?.passRate || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${analytics?.passRate || 0}%` }} />
            </div>
            <div className="flex justify-between items-center mt-3">
              <span className="text-gray-600 dark:text-gray-400">Fail Rate</span>
              <span className="text-red-600 font-bold">{analytics?.failRate || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${analytics?.failRate || 0}%` }} />
            </div>
            {analytics?.bestStudent && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-gray-500">Best Student</p>
                <p className="font-semibold text-gray-900 dark:text-white">{analytics.bestStudent.firstName} {analytics.bestStudent.lastName}</p>
              </div>
            )}
            {analytics?.bestClass && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-500">Best Class</p>
                <p className="font-semibold text-gray-900 dark:text-white">{analytics.bestClass}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
