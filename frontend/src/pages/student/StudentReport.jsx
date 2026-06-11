import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function StudentReport() {
  const { user } = useAuth();
  const [termId, setTermId] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['student-profile-report', user?._id],
    queryFn: () => API.get(`/students?userId=${user._id}&limit=1`).then((r) => r.data.data[0]),
    enabled: !!user?._id,
  });

  const { data: terms } = useQuery({
    queryKey: ['terms'],
    queryFn: () => API.get('/terms').then((r) => r.data.data),
  });

  const { data: settings } = useQuery({
    queryKey: ['school-settings'],
    queryFn: () => API.get('/settings').then((r) => r.data.data),
  });

  const { data: report } = useQuery({
    queryKey: ['student-report-full', profile?._id, termId],
    queryFn: () => API.get(`/reports/student/${profile._id}${termId ? `?termId=${termId}` : ''}`).then((r) => r.data.data),
    enabled: !!profile?._id,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Report Card</h1>
      <div className="flex flex-wrap gap-3">
        <select value={termId} onChange={(e) => setTermId(e.target.value)}
          className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="">Latest Report</option>
          {terms?.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
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
          <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Midterm Performance</h3>
          <table className="w-full text-sm mb-4 border">
            <thead><tr className="bg-gray-50 dark:bg-gray-800"><th className="border p-2 text-left text-gray-700 dark:text-gray-300">Subject</th><th className="border p-2 text-gray-700 dark:text-gray-300">Marks</th><th className="border p-2 text-gray-700 dark:text-gray-300">Grade</th></tr></thead>
            <tbody>
              {report.marks?.map((m) => {
                const g = m.midtermMarks != null ? (m.midtermMarks >= 90 ? 'Excellent' : m.midtermMarks >= 80 ? 'V.Good' : m.midtermMarks >= 70 ? 'Good' : m.midtermMarks >= 60 ? 'F.Good' : m.midtermMarks >= 50 ? 'Tried' : m.midtermMarks >= 40 ? 'Improve' : 'Failed') : '-';
                return <tr key={m._id}><td className="border p-2 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700">{m.subjectId?.name}</td><td className={`border p-2 text-center border-gray-200 dark:border-gray-700 ${m.midtermMarks != null ? (m.midtermMarks >= 40 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium') : 'text-gray-700 dark:text-gray-300'}`}>{m.midtermMarks ?? '-'}</td><td className="border p-2 text-center text-green-600 dark:text-green-400 font-bold border-gray-200 dark:border-gray-700">{g}</td></tr>;
              })}
            </tbody>
          </table>
          <p className="text-sm text-gray-700 dark:text-gray-300">Total: {report.report.midtermTotal} | Average: {report.report.midtermAverage?.toFixed(2)}</p>
          <h3 className="font-bold text-lg mb-2 mt-4 text-gray-900 dark:text-white">End-Term Performance</h3>
          <table className="w-full text-sm mb-4 border">
            <thead><tr className="bg-gray-50 dark:bg-gray-800"><th className="border p-2 text-left text-gray-700 dark:text-gray-300">Subject</th><th className="border p-2 text-gray-700 dark:text-gray-300">Marks</th><th className="border p-2 text-gray-700 dark:text-gray-300">Grade</th></tr></thead>
            <tbody>
              {report.marks?.map((m) => {
                const g = m.endTermMarks != null ? (m.endTermMarks >= 90 ? 'Excellent' : m.endTermMarks >= 80 ? 'V.Good' : m.endTermMarks >= 70 ? 'Good' : m.endTermMarks >= 60 ? 'F.Good' : m.endTermMarks >= 50 ? 'Tried' : m.endTermMarks >= 40 ? 'Improve' : 'Failed') : '-';
                return <tr key={m._id}><td className="border p-2 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700">{m.subjectId?.name}</td><td className={`border p-2 text-center border-gray-200 dark:border-gray-700 ${m.endTermMarks != null ? (m.endTermMarks >= 40 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium') : 'text-gray-700 dark:text-gray-300'}`}>{m.endTermMarks ?? '-'}</td><td className="border p-2 text-center text-green-600 dark:text-green-400 font-bold border-gray-200 dark:border-gray-700">{g}</td></tr>;
              })}
            </tbody>
          </table>
          <p className="text-sm text-gray-700 dark:text-gray-300">Total: {report.report.endTermTotal} | Average: {report.report.endTermAverage?.toFixed(2)}</p>
          <h3 className="font-bold text-lg mb-2 mt-4 text-gray-900 dark:text-white">Overall Performance</h3>
          <table className="w-full text-sm mb-4 border">
            <thead><tr className="bg-gray-50 dark:bg-gray-800"><th className="border p-2 text-left text-gray-700 dark:text-gray-300">Subject</th><th className="border p-2 text-gray-700 dark:text-gray-300">Mid</th><th className="border p-2 text-gray-700 dark:text-gray-300">End</th><th className="border p-2 text-gray-700 dark:text-gray-300">Avg</th><th className="border p-2 text-gray-700 dark:text-gray-300">Grade</th></tr></thead>
            <tbody>
              {report.marks?.map((m) => (
                <tr key={m._id}>
                  <td className="border p-2 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700">{m.subjectId?.name}</td>
                  <td className={`border p-2 text-center border-gray-200 dark:border-gray-700 ${m.midtermMarks != null ? (m.midtermMarks >= 40 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium') : 'text-gray-700 dark:text-gray-300'}`}>{m.midtermMarks ?? '-'}</td>
                  <td className={`border p-2 text-center border-gray-200 dark:border-gray-700 ${m.endTermMarks != null ? (m.endTermMarks >= 40 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium') : 'text-gray-700 dark:text-gray-300'}`}>{m.endTermMarks ?? '-'}</td>
                  <td className={`border p-2 text-center border-gray-200 dark:border-gray-700 ${m.subjectAverage >= 40 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium'}`}>{m.subjectAverage?.toFixed(1) || '-'}</td>
                  <td className="border p-2 text-center text-green-600 dark:text-green-400 font-bold border-gray-200 dark:border-gray-700">{m.grade || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <p><strong className="text-gray-900 dark:text-white">Combined Total:</strong> {report.report.combinedTotal?.toFixed(2)}</p>
              <p><strong className="text-gray-900 dark:text-white">Overall Average:</strong> {report.report.overallAverage?.toFixed(2)}</p>
              <p><strong className="text-gray-900 dark:text-white">Grade:</strong> <span className="text-green-600 dark:text-green-400 font-bold">{report.report.grade}</span></p>
              <p><strong className="text-gray-900 dark:text-white">Remarks:</strong> <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                report.report.remarks === 'Pass' ? 'bg-green-100 text-green-700 ring-1 ring-green-400 dark:bg-green-900/40 dark:text-green-300 dark:ring-green-600' : 'bg-red-100 text-red-700 ring-1 ring-red-400 dark:bg-red-900/40 dark:text-red-300 dark:ring-red-600'
              }`}>{report.report.remarks}</span></p>
            </div>
            <div>
              <p><strong className="text-gray-900 dark:text-white">Class Rank:</strong> {report.report.classRank}</p>
              <p><strong className="text-gray-900 dark:text-white">School Rank:</strong> {report.report.schoolRank}</p>
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

          <div className="flex justify-end mt-4 print:hidden">
            <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Print Report Card
            </button>
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
