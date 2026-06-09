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

  const { data: report } = useQuery({
    queryKey: ['student-report-full', profile?._id, termId],
    queryFn: () => API.get(`/reports/student/${profile._id}${termId ? `?termId=${termId}` : ''}`).then((r) => r.data.data),
    enabled: !!profile?._id,
  });

  const printReport = () => window.print();

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
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xl font-bold text-gray-400">
                SMS
              </div>
              <h2 className="text-xl font-bold mt-1">School Management System</h2>
            </div>
            <p className="text-gray-500">Academic Year: {report.report.academicYearId?.year} | {report.report.termId?.name}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <p><strong>Name:</strong> {report.student?.firstName} {report.student?.lastName}</p>
              <p><strong>Code:</strong> {report.student?.studentCode}</p>
              <p><strong>Class:</strong> {report.student?.classId?.name} {report.student?.sectionId?.name || ''}</p>
            </div>
            <div>
              <p><strong>NIN:</strong> {report.student?.NIN || 'N/A'}</p>
            </div>
          </div>
          <h3 className="font-bold text-lg mb-2">Midterm Performance</h3>
          <table className="w-full text-sm mb-4 border">
            <thead><tr className="bg-gray-50"><th className="border p-2 text-left">Subject</th><th className="border p-2">Marks</th><th className="border p-2">Grade</th></tr></thead>
            <tbody>
              {report.marks?.map((m) => {
                const g = m.midtermMarks != null ? (m.midtermMarks >= 80 ? 'A' : m.midtermMarks >= 70 ? 'B' : m.midtermMarks >= 60 ? 'C' : m.midtermMarks >= 50 ? 'D' : m.midtermMarks >= 40 ? 'E' : 'F') : '-';
                return <tr key={m._id}><td className="border p-2">{m.subjectId?.name}</td><td className="border p-2 text-center">{m.midtermMarks ?? '-'}</td><td className="border p-2 text-center">{g}</td></tr>;
              })}
            </tbody>
          </table>
          <p className="text-sm">Total: {report.report.midtermTotal} | Average: {report.report.midtermAverage?.toFixed(2)}</p>
          <h3 className="font-bold text-lg mb-2 mt-4">End-Term Performance</h3>
          <table className="w-full text-sm mb-4 border">
            <thead><tr className="bg-gray-50"><th className="border p-2 text-left">Subject</th><th className="border p-2">Marks</th><th className="border p-2">Grade</th></tr></thead>
            <tbody>
              {report.marks?.map((m) => {
                const g = m.endTermMarks != null ? (m.endTermMarks >= 80 ? 'A' : m.endTermMarks >= 70 ? 'B' : m.endTermMarks >= 60 ? 'C' : m.endTermMarks >= 50 ? 'D' : m.endTermMarks >= 40 ? 'E' : 'F') : '-';
                return <tr key={m._id}><td className="border p-2">{m.subjectId?.name}</td><td className="border p-2 text-center">{m.endTermMarks ?? '-'}</td><td className="border p-2 text-center">{g}</td></tr>;
              })}
            </tbody>
          </table>
          <p className="text-sm">Total: {report.report.endTermTotal} | Average: {report.report.endTermAverage?.toFixed(2)}</p>
          <h3 className="font-bold text-lg mb-2 mt-4">Overall Performance</h3>
          <table className="w-full text-sm mb-4 border">
            <thead><tr className="bg-gray-50"><th className="border p-2 text-left">Subject</th><th className="border p-2">Mid</th><th className="border p-2">End</th><th className="border p-2">Avg</th><th className="border p-2">Grade</th></tr></thead>
            <tbody>
              {report.marks?.map((m) => (
                <tr key={m._id}>
                  <td className="border p-2">{m.subjectId?.name}</td>
                  <td className="border p-2 text-center">{m.midtermMarks ?? '-'}</td>
                  <td className="border p-2 text-center">{m.endTermMarks ?? '-'}</td>
                  <td className="border p-2 text-center">{m.subjectAverage?.toFixed(1) || '-'}</td>
                  <td className="border p-2 text-center">{m.grade || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Combined Total:</strong> {report.report.combinedTotal?.toFixed(2)}</p>
              <p><strong>Overall Average:</strong> {report.report.overallAverage?.toFixed(2)}</p>
              <p><strong>Grade:</strong> {report.report.grade}</p>
              <p><strong>Remarks:</strong> <span className={report.report.remarks === 'Pass' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{report.report.remarks}</span></p>
            </div>
            <div>
              <p><strong>Class Rank:</strong> {report.report.classRank}</p>
              <p><strong>School Rank:</strong> {report.report.schoolRank}</p>
            </div>
          </div>
          {report.report.teacherRemark && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
              <p className="font-bold text-gray-700 dark:text-gray-300">Teacher's Encouragement:</p>
              <p className="italic text-gray-600 dark:text-gray-400 mt-1">"{report.report.teacherRemark}"</p>
            </div>
          )}
          <div className="mt-8 pt-4 border-t grid grid-cols-2 gap-8 text-sm">
            <div>
              <p>_________________________</p>
              <p>{report.report.headTeacherSignature || 'Head Teacher Signature'}</p>
            </div>
            <div>
              <p>_________________________</p>
              <p>Class Teacher Signature</p>
            </div>
          </div>
          <div className="flex gap-3 mt-6 print:hidden">
            <button onClick={printReport} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Print</button>
            <a href={`/api/reports/student/${profile?._id}/pdf${termId ? `?termId=${termId}` : ''}`}
              target="_blank" className="px-4 py-2 bg-green-600 text-white rounded-lg inline-block">Export PDF</a>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-10 text-center text-gray-500">
          No report available yet. Please check back after your teacher has entered your marks.
        </div>
      )}
    </div>
  );
}
