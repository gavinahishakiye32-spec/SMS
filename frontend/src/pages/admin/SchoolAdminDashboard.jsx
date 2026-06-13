import { useQuery } from '@tanstack/react-query';
import API from '../../services/api';


export default function SchoolAdminDashboard() {
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">School Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
            <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center text-white text-lg font-bold mb-3`}>
              {s.value.toString()[0]}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-300">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">School Performance</h2>
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-600 dark:text-gray-300">Pass Rate: <strong className="text-green-600">{analytics?.passRate || 0}%</strong></span>
          <span className="text-gray-600 dark:text-gray-300">Fail Rate: <strong className="text-red-600">{analytics?.failRate || 0}%</strong></span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${analytics?.passRate || 0}%` }} />
        </div>
      </div>
    </div>
  );
}
