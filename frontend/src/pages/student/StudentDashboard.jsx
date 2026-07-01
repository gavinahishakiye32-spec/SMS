import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useActiveYear } from '../../services/useActiveYear';
import { BookOpen } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { activeYear, activeTerm } = useActiveYear();
  const [termId, setTermId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');

  useEffect(() => {
    if (activeYear && !academicYearId) {
      setAcademicYearId(activeYear._id);
    }
  }, [activeYear]);

  useEffect(() => {
    if (activeTerm && !termId) {
      setTermId(activeTerm._id);
    }
  }, [activeTerm]);

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
    queryKey: ['student-profile', user?._id],
    queryFn: () => API.get(`/students?userId=${user._id}&limit=1`).then((r) => r.data.data[0]),
    enabled: !!user?._id,
  });

  const buildParams = () => {
    const params = new URLSearchParams();
    if (termId) params.set('termId', termId);
    if (academicYearId) params.set('academicYearId', academicYearId);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  };

  const { data: reportData } = useQuery({
    queryKey: ['student-report-dash', profile?._id, termId, academicYearId],
    queryFn: () => API.get(`/reports/student/${profile._id}${buildParams()}`).then((r) => r.data.data),
    enabled: !!profile?._id,
  });

  const report = reportData?.report;
  const marks = reportData?.marks || [];
  const student = reportData?.student || profile;

  return (
    <div data-print-hidden className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Dashboard</h1>
        <div className="flex gap-2 no-print">
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
      </div>

      {/* Personal Information */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white border-b pb-2">Personal Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Name</p>
            <p className="font-medium text-gray-900 dark:text-white">{profile?.firstName} {profile?.lastName}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Student Code</p>
            <p className="font-medium text-gray-900 dark:text-white">{profile?.studentCode}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Class</p>
            <p className="font-medium text-gray-900 dark:text-white">{profile?.classId?.name || '-'}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Section</p>
            <p className="font-medium text-gray-900 dark:text-white">{profile?.sectionId?.name || '-'}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Gender</p>
            <p className="font-medium text-gray-900 dark:text-white">{profile?.gender || '-'}</p>
          </div>
          {student?.classId?.level && (
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Level</p>
              <p className="font-medium text-gray-900 dark:text-white">{student.classId.level}</p>
            </div>
          )}
        </div>
      </div>

      {/* Academic Performance */}
      {marks.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6">
          <div className="flex items-center justify-between border-b pb-2 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              <span className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Academic Performance
              </span>
            </h2>
            {report?.academicYearId?.year && (
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {report.academicYearId.year} | {report.termId?.name || 'Latest'}
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white">Subject</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-900 dark:text-white">Mid-Term /100</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-900 dark:text-white">End-Term /100</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-900 dark:text-white">Average</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-900 dark:text-white">Grade</th>
                </tr>
              </thead>
              <tbody>
                {marks.map((m) => (
                  <tr key={m._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-2 font-medium text-gray-900 dark:text-white">{m.subjectId?.name || 'N/A'}</td>
                    <td className="text-center py-3 px-2 text-gray-700 dark:text-gray-300">{m.midtermMarks != null ? m.midtermMarks : '-'}</td>
                    <td className="text-center py-3 px-2 text-gray-700 dark:text-gray-300">{m.endTermMarks != null ? m.endTermMarks : '-'}</td>
                    <td className="text-center py-3 px-2 font-semibold text-gray-900 dark:text-white">{m.subjectAverage != null ? m.subjectAverage.toFixed(0) : '-'}</td>
                    <td className="text-center py-3 px-2">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                        m.grade === 'A' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
                        m.grade === 'B' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
                        m.grade === 'C' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' :
                        m.grade === 'D' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                      }`}>{m.grade || '-'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 text-center">
          <p className="text-gray-400 dark:text-gray-500 text-sm">No academic records available yet</p>
        </div>
      )}

      {/* Overall Performance */}
      {report && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6">
          <div className="flex items-center justify-between border-b pb-2 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Overall Performance</h2>
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              {report.academicYearId?.year} | {report.termId?.name || 'Latest'}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {((report.midtermTotal || 0) + (report.endTermTotal || 0)).toFixed(0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">Total Marks</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
              <p className={`text-2xl font-bold ${
                report.overallAverage >= 80 ? 'text-green-600' :
                report.overallAverage >= 60 ? 'text-blue-600' :
                report.overallAverage >= 40 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {report.overallAverage?.toFixed(0) || '0'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">Average</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{report.grade || '-'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">Grade</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
              <p className={`text-2xl font-bold ${report.remarks === 'Pass' ? 'text-green-600' : 'text-red-600'}`}>
                {report.remarks || '-'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">Remarks</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">Position in Class</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                #{report.classRank || '?'} {report.totalStudentsInClass != null ? `out of ${report.totalStudentsInClass}` : ''}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">Position in School</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                #{report.schoolRank || '?'} {report.totalStudentsInSchool != null ? `out of ${report.totalStudentsInSchool}` : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Remark */}
      {report?.teacherRemark && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6">
          <h2 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Teacher's Comment</h2>
          <p className="text-gray-600 dark:text-gray-400 italic">&ldquo;{report.teacherRemark}&rdquo;</p>
        </div>
      )}

      {/* Head Teacher Signature */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6">
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 text-right">
          <p className="text-sm text-gray-500 dark:text-gray-400">_________________________</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">Head Teacher Signature</p>
        </div>
      </div>
    </div>
  );
}
