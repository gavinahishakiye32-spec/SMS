import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useActiveYear } from '../../services/useActiveYear';

export default function StudentReport() {
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

  const { data: profile } = useQuery({
    queryKey: ['student-profile-report', user?._id],
    queryFn: () => API.get(`/students?userId=${user._id}&limit=1`).then((r) => r.data.data[0]),
    enabled: !!user?._id,
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

  const { data: settings } = useQuery({
    queryKey: ['school-settings'],
    queryFn: () => API.get('/settings').then((r) => r.data.data),
  });

  const { data: report } = useQuery({
    queryKey: ['student-report-full', profile?._id, termId, academicYearId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (termId) params.set('termId', termId);
      if (academicYearId) params.set('academicYearId', academicYearId);
      const qs = params.toString();
      return API.get(`/reports/student/${profile._id}${qs ? `?${qs}` : ''}`).then((r) => r.data.data);
    },
    enabled: !!profile?._id,
  });

  return (
    <div data-print-hidden className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Report Card</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {termId
              ? terms?.find((t) => t._id === termId)?.name || 'Selected Term'
              : 'Latest Report'}
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 no-print">
        <select value={academicYearId} onChange={(e) => { setAcademicYearId(e.target.value); setTermId(''); }}
          className="w-full sm:w-auto px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="">All Years</option>
          {academicYears?.map((y) => <option key={y._id} value={y._id}>{y.year}</option>)}
        </select>
        <select value={termId} onChange={(e) => setTermId(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="">Latest Report</option>
          {filteredTerms?.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
      </div>
      {report?.report ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6" id="report-card">
          <div className="text-center mb-6">
            <div id="school-logo" className="flex flex-col items-center mb-2">
              {settings?.logo ? (
                <img src={settings.logo} alt="School Logo" className="h-16 w-16 object-contain mb-1" />
              ) : (
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xl font-bold text-gray-400">
                  SMS
                </div>
              )}
              <h2 className="text-xl font-bold mt-1 text-gray-900 dark:text-white">{settings?.schoolName || 'School Management System'}</h2>
            </div>
            <p className="text-gray-500 dark:text-gray-400">Academic Year: {report.report.academicYearId?.year} | {report.report.termId?.name}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <p><strong className="text-gray-900 dark:text-white">Name:</strong> {report.student?.firstName} {report.student?.lastName}</p>
              <p><strong className="text-gray-900 dark:text-white">Code:</strong> {report.student?.studentCode}</p>
              <p><strong className="text-gray-900 dark:text-white">Class:</strong> {report.student?.classId?.name} {report.student?.sectionId?.name || ''}</p>
            </div>
          </div>
          <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Academic Performance</h3>
          <div className="overflow-x-auto"><table className="w-full text-sm mb-4 border">
            <thead><tr className="bg-gray-50 dark:bg-gray-800"><th scope="col" className="border p-2 text-left text-gray-700 dark:text-gray-300">Subject</th><th scope="col" className="border p-2 text-gray-700 dark:text-gray-300">Mid-Term/100</th><th scope="col" className="border p-2 text-gray-700 dark:text-gray-300">End-Term/100</th><th scope="col" className="border p-2 text-gray-700 dark:text-gray-300">Average</th><th scope="col" className="border p-2 text-gray-700 dark:text-gray-300">Grade</th></tr></thead>
            <tbody>
              {report.marks?.map((m) => (
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
          </table></div>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <p><strong className="text-gray-900 dark:text-white">Total Marks:</strong> <span className="text-lg font-bold text-blue-600">{((report.report.midtermTotal || 0) + (report.report.endTermTotal || 0)).toFixed(0)}</span></p>
              <p><strong className="text-gray-900 dark:text-white">Average:</strong> <span className="text-lg font-bold text-blue-600">{report.report.overallAverage?.toFixed(0) || '0'}</span></p>
              <p><strong className="text-gray-900 dark:text-white">Result:</strong> <span className="text-green-600 dark:text-green-400 font-bold text-lg">{report.report.grade}</span></p>
              <p><strong className="text-gray-900 dark:text-white">Remarks:</strong>{' '}
                {report.report.remarks === 'Pass' ? (
                  <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold text-sm">PASSED</span>
                ) : (
                  <span className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold text-sm">FAILED</span>
                )}
              </p>
            </div>
            <div className="text-right">
              <p><strong className="text-gray-900 dark:text-white">Position in Class:</strong>{' '}
                <span className="text-lg font-bold text-purple-600">
                  {report.report.classRank}{report.report.totalStudentsInClass != null ? ` out of ${report.report.totalStudentsInClass}` : ''}
                </span>
              </p>
              <p><strong className="text-gray-900 dark:text-white">Position in School:</strong> <span className="text-lg font-bold text-purple-600">{report.report.schoolRank}{report.report.totalStudentsInSchool != null ? ` out of ${report.report.totalStudentsInSchool}` : ''}</span></p>
            </div>
          </div>
          {report.report.teacherRemark && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
              <p className="font-bold text-gray-700 dark:text-gray-300">Teacher's Encouragement:</p>
              <p className="italic text-gray-600 dark:text-gray-400 mt-1">"{report.report.teacherRemark}"</p>
            </div>
          )}
          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <p>_________________________</p>
              <p>{report.report.headTeacherSignature || 'Head Teacher Signature'}</p>
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-10 text-center text-gray-500 dark:text-gray-400">
          No report available yet. Please check back after your teacher has entered your marks.
        </div>
      )}
    </div>
  );
}
