import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useActiveYear } from '../../services/useActiveYear';

export default function StudentPerformance() {
  const { user } = useAuth();
  const { activeYear } = useActiveYear();
  const [termId, setTermId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const yearSynced = useRef(false);

  useEffect(() => {
    if (activeYear && !yearSynced.current) {
      yearSynced.current = true;
      setAcademicYearId(activeYear._id);
    }
  }, [activeYear]);

  const { data: settings } = useQuery({
    queryKey: ['school-settings'],
    queryFn: () => API.get('/settings').then((r) => r.data.data),
  });

  const { data: terms } = useQuery({
    queryKey: ['terms'],
    queryFn: () => API.get('/terms').then((r) => r.data.data),
  });

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => API.get('/academic-years').then((r) => r.data.data),
  });

  const filteredTerms = useMemo(() => {
    if (!terms) return [];
    if (!academicYearId) return terms;
    return terms.filter((t) => {
      const ty = t.academicYearId?._id || t.academicYearId;
      return ty === academicYearId;
    });
  }, [terms, academicYearId]);

  const { data: profile } = useQuery({
    queryKey: ['student-profile-perf', user?._id],
    queryFn: () => API.get(`/students?userId=${user._id}&limit=1`).then((r) => r.data.data[0]),
    enabled: !!user?._id,
  });

  const buildParams = (extra) => {
    const params = new URLSearchParams(extra);
    if (termId) params.set('termId', termId);
    if (academicYearId) params.set('academicYearId', academicYearId);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  };

  const { data: marks } = useQuery({
    queryKey: ['student-marks-perf', profile?._id, termId, academicYearId],
    queryFn: () => API.get(`/marks/student/${profile._id}${buildParams()}`).then((r) => r.data.data),
    enabled: !!profile?._id,
  });

  const { data: ranking } = useQuery({
    queryKey: ['student-ranking', profile?._id, termId, academicYearId],
    queryFn: () => API.get(`/students/${profile._id}/ranking${buildParams()}`).then((r) => r.data.data),
    enabled: !!profile?._id,
  });

  return (
    <div data-print-hidden className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Performance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {termId
              ? terms?.find((t) => t._id === termId)?.name || 'Selected Term'
              : 'Latest Term'}
          </p>
        </div>
        <select value={academicYearId} onChange={(e) => { setAcademicYearId(e.target.value); setTermId(''); }}
          className="w-full sm:w-auto px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
          <option value="">All Years</option>
          {academicYears?.map((y) => <option key={y._id} value={y._id}>{y.year}</option>)}
        </select>
        <select value={termId} onChange={(e) => setTermId(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
          <option value="">Latest Term</option>
          {filteredTerms?.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
      </div>
      <div id="report-card">
        <div className="text-center mb-6">
          <div id="school-logo" className="flex flex-col items-center mb-2">
            {settings?.logo ? (
              <img src={settings.logo} alt="School Logo" className="h-16 w-16 object-contain mb-1" />
            ) : (
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xl font-bold text-gray-400">SMS</div>
            )}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{settings?.schoolName || 'School Management System'}</h2>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">My Performance</h1>
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
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow overflow-hidden">
        <h2 className="text-lg font-semibold p-5 pb-0 text-gray-900 dark:text-white">Subject Performance</h2>
        <div className="overflow-x-auto p-5">
          {marks && marks.length > 0 ? (
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th scope="col" className="border p-2 text-left text-gray-700 dark:text-gray-300">Subject</th>
                  <th scope="col" className="border p-2 text-gray-700 dark:text-gray-300">Mid-Term/100</th>
                  <th scope="col" className="border p-2 text-gray-700 dark:text-gray-300">End-Term/100</th>
                  <th scope="col" className="border p-2 text-gray-700 dark:text-gray-300">Average</th>
                  <th scope="col" className="border p-2 text-gray-700 dark:text-gray-300">Grade</th>
                </tr>
              </thead>
              <tbody>
                {marks.map((m) => (
                  <tr key={m._id}>
                    <td className="border p-2 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700">{m.subjectId?.name}</td>
                    <td className={`border p-2 text-center border-gray-200 dark:border-gray-700 ${m.midtermMarks != null ? (m.midtermMarks >= 40 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium') : 'text-gray-700 dark:text-gray-300'}`}>{m.midtermMarks ?? '-'}</td>
                    <td className={`border p-2 text-center border-gray-200 dark:border-gray-700 ${m.endTermMarks != null ? (m.endTermMarks >= 40 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium') : 'text-gray-700 dark:text-gray-300'}`}>{m.endTermMarks ?? '-'}</td>
                    <td className={`border p-2 text-center border-gray-200 dark:border-gray-700 ${m.subjectAverage != null && m.subjectAverage >= 40 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium'}`}>{m.subjectAverage != null ? m.subjectAverage.toFixed(0) : '-'}</td>
                    <td className="border p-2 text-center font-bold border-gray-200 dark:border-gray-700">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${m.grade === 'A' ? 'bg-green-100 text-green-700' : m.grade === 'B' ? 'bg-blue-100 text-blue-700' : m.grade === 'C' ? 'bg-yellow-100 text-yellow-700' : m.grade === 'D' ? 'bg-orange-100 text-orange-700' : m.grade === 'E' ? 'bg-red-100 text-red-700' : m.grade === 'F' ? 'bg-red-200 text-red-800' : 'bg-gray-100 text-gray-500'}`}>
                        {m.grade || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No marks available yet.</p>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
