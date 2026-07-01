import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import API from '../../services/api';
import { useActiveYear } from '../../services/useActiveYear';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#16A34A', '#2563EB', '#14B8A6', '#D97706', '#F97316', '#DC2626', '#6B7280'];

export default function AnalyticsPage() {
  const { activeYear, defaultAcademicYearId, allAcademicYears } = useActiveYear();
  const [classId, setClassId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const yearSynced = useRef(false);

  useEffect(() => {
    if (defaultAcademicYearId && !yearSynced.current) {
      yearSynced.current = true;
      setAcademicYearId(defaultAcademicYearId);
    }
  }, [defaultAcademicYearId]);

  const yearParam = academicYearId ? `&academicYearId=${academicYearId}` : '';

  const { data: schoolData } = useQuery({
    queryKey: ['analytics-school-page', academicYearId],
    queryFn: () => API.get(`/analytics/school?${yearParam}`).then((r) => r.data.data),
    enabled: !!academicYearId,
  });

  const { data: classData } = useQuery({
    queryKey: ['analytics-class', classId, academicYearId],
    queryFn: () => API.get(`/analytics/class/${classId}?${yearParam}`).then((r) => r.data.data),
    enabled: !!classId && !!academicYearId,
  });

  const { data: classes } = useQuery({
    queryKey: ['classes-list', academicYearId],
    queryFn: () => API.get(`/classes?limit=50&academicYearId=${academicYearId}`).then((r) => r.data.data),
    enabled: !!academicYearId,
  });

  const { data: topStudents } = useQuery({
    queryKey: ['top-students', academicYearId],
    queryFn: () => API.get(`/analytics/top-students?limit=5&${yearParam}`).then((r) => r.data.data),
    enabled: !!academicYearId,
  });

  const gradeData = schoolData?.gradeDistribution
    ? Object.entries(schoolData.gradeDistribution).map(([name, value]) => ({ name, value }))
    : [];

  const classGradeData = classData?.gradeDistribution
    ? Object.entries(classData.gradeDistribution).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Academic Year:</label>
        <select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)}
          className="px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="">All Years</option>
          {allAcademicYears?.map((y) => (
            <option key={y._id} value={y._id}>{y.year}{y.isActive ? ' (Active)' : ''}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">School Overview</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-300">Students</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{schoolData?.totalStudents || 0}</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-300">Teachers</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{schoolData?.totalTeachers || 0}</p>
            </div>
            <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-300">School Avg</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{schoolData?.averagePerformance?.toFixed(1) || '0'}</p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-300">Pass Rate</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{schoolData?.passRate || 0}%</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-300">Best Student</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{schoolData?.bestStudent?.firstName || '-'} {schoolData?.bestStudent?.lastName || ''}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Avg: {schoolData?.bestStudentAverage?.toFixed(1) || 0}%</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-300">Best Class</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{schoolData?.bestClass || '-'}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Avg: {schoolData?.bestClassAvg?.toFixed(1) || 0}</p>
              <p className="text-xs text-green-600 dark:text-green-400 font-semibold">Pass Rate: {schoolData?.bestClassPassRate || 0}%</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={gradeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {gradeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Top 5 Students</h2>
          {topStudents?.map((s, i) => (
            <div key={s._id} className="flex justify-between items-center py-2 border-b last:border-0">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">{i + 1}</span>
                <span className="text-sm text-gray-900 dark:text-white">{s.studentId?.firstName} {s.studentId?.lastName}</span>
              </div>
              <span className="text-sm font-bold text-green-600">{s.overallAverage?.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4 sm:p-5">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Class Performance</h2>
        <select value={classId} onChange={(e) => setClassId(e.target.value)}
          className="mb-4 w-full sm:w-48 px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="">Select Class</option>
          {classes ? classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>) : <option disabled>Loading...</option>}
        </select>
        {classData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-gray-700 dark:text-gray-300">
              <p>Class Average: <strong className="text-gray-900 dark:text-white">{classData.classAverage?.toFixed(1)}</strong></p>
              <p>Pass Rate: <strong className="text-green-600 dark:text-green-400">{classData.passRate}%</strong></p>
              <p>Fail Rate: <strong className="text-red-600 dark:text-red-400">{classData.failRate}%</strong></p>
              <div className="mt-4">
                <p className="font-semibold mb-2 text-gray-900 dark:text-white">Rankings</p>
                {classData.rankings?.slice(0, 10).map((r) => (
                  <div key={r.rank} className="flex justify-between text-sm py-1 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-700 dark:text-gray-300">#{r.rank} {r.student?.firstName} {r.student?.lastName}</span>
                    <span className="text-gray-700 dark:text-gray-300">{r.overallAverage?.toFixed(1)}% - {r.grade}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="font-semibold mb-2 text-gray-900 dark:text-white">Grade Distribution</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={classGradeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563EB" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
