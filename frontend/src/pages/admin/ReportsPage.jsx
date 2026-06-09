import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import API from '../../services/api';

export default function ReportsPage() {
  const [studentId, setStudentId] = useState('');
  const [classId, setClassId] = useState('');
  const [studentTermId, setStudentTermId] = useState('');
  const [classTermId, setClassTermId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchClassId, setSearchClassId] = useState('');
  const [searchTermId, setSearchTermId] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [teacherRemark, setTeacherRemark] = useState('');
  const [headTeacherSignature, setHeadTeacherSignature] = useState('');
  const [savingRemark, setSavingRemark] = useState(false);
  const [savingSignature, setSavingSignature] = useState(false);
  const [remarkSaved, setRemarkSaved] = useState(false);
  const [signatureSaved, setSignatureSaved] = useState(false);

  const { data: classes } = useQuery({ queryKey: ['classes-list'], queryFn: () => API.get('/classes?limit=50').then((r) => r.data.data) });
  const { data: terms } = useQuery({ queryKey: ['terms'], queryFn: () => API.get('/terms').then((r) => r.data.data) });

  const searchStudent = async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const { data } = await API.get(`/reports/student/${studentId}${studentTermId ? `?termId=${studentTermId}` : ''}`);
      setReport(data.data);
      setSearchResults(null);
      setSelectedReportId(null);
    } catch { setReport(null); }
    setLoading(false);
  };

  const searchClass = async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const { data } = await API.get(`/reports/class/${classId}${classTermId ? `?termId=${classTermId}` : ''}`);
      setReport({ classReport: data.data });
      setSearchResults(null);
      setSelectedReportId(null);
    } catch { setReport(null); }
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery && !searchClassId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (searchClassId) params.set('classId', searchClassId);
      if (searchTermId) params.set('termId', searchTermId);
      const { data } = await API.get(`/reports/search?${params}`);
      setSearchResults(data.data);
      setReport(null);
      setSelectedReportId(null);
    } catch { setSearchResults([]); }
    setLoading(false);
  };

  const loadStudentReport = async (sid, term) => {
    setLoading(true);
    try {
      const termParam = term || searchTermId || '';
      const { data } = await API.get(`/reports/student/${sid}${termParam ? `?termId=${termParam}` : ''}`);
      setReport(data.data);
      if (data.data?.report) {
        setTeacherRemark(data.data.report.teacherRemark || '');
        setHeadTeacherSignature(data.data.report.headTeacherSignature || '');
      }
      setRemarkSaved(false);
      setSignatureSaved(false);
    } catch { setReport(null); }
    setLoading(false);
  };

  const handleRemarkSave = async () => {
    if (!report?.report?._id) return;
    setSavingRemark(true);
    try {
      await API.put(`/reports/${report.report._id}/remark`, { teacherRemark });
      setRemarkSaved(true);
      setTimeout(() => setRemarkSaved(false), 2000);
    } catch { alert('Failed to save remark'); }
    setSavingRemark(false);
  };

  const handleSignatureSave = async () => {
    if (!report?.report?._id) return;
    setSavingSignature(true);
    try {
      await API.put(`/reports/${report.report._id}/remark`, { headTeacherSignature });
      setSignatureSaved(true);
      setTimeout(() => setSignatureSaved(false), 2000);
    } catch { alert('Failed to save signature'); }
    setSavingSignature(false);
  };

  const printReport = () => window.print();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
        <h2 className="text-lg font-bold mb-3">Search Reports</h2>
        <div className="flex flex-wrap gap-2 mb-2">
          <input placeholder="Search by name, student ID, or code..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
          <select value={searchClassId} onChange={(e) => setSearchClassId(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
            <option value="">All Classes</option>
            {classes?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select value={searchTermId} onChange={(e) => setSearchTermId(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
            <option value="">Latest Term</option>
            {terms?.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
          <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Search</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
          <h2 className="text-lg font-bold mb-3">Quick Student Lookup</h2>
          <div className="flex flex-wrap gap-2 mb-2">
            <input placeholder="Student ID" value={studentId} onChange={(e) => setStudentId(e.target.value)}
              className="flex-1 min-w-[120px] px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            <select value={studentTermId} onChange={(e) => setStudentTermId(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
              <option value="">Latest</option>
              {terms?.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
          <button onClick={searchStudent} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Lookup</button>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
          <h2 className="text-lg font-bold mb-3">Class Report</h2>
          <div className="flex flex-wrap gap-2 mb-2">
            <select value={classId} onChange={(e) => setClassId(e.target.value)}
              className="flex-1 min-w-[120px] px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
              <option value="">Select Class</option>
              {classes?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <button onClick={searchClass} className="px-4 py-2 bg-blue-600 text-white rounded-lg">View Rankings</button>
        </div>
      </div>

      {loading && <p className="text-center text-gray-500">Loading...</p>}

      {searchResults && !loading && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
          <h2 className="text-lg font-bold mb-3">Search Results ({searchResults.length})</h2>
          {searchResults.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No results found</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {searchResults.map((item) => (
                <div key={item.student._id} className="border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => {
                    if (item.reports.length > 0) {
                      loadStudentReport(item.student._id, item.reports[0].termId?._id);
                    } else {
                      loadStudentReport(item.student._id, searchTermId);
                    }
                  }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.student.firstName} {item.student.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.student.studentCode} | {item.student.classId?.name} {item.student.sectionId?.name || ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">{item.reports.length} report(s)</span>
                      {item.reports.length > 0 && (
                        <p className="text-sm font-medium text-blue-600">
                          Avg: {item.reports[0].overallAverage?.toFixed(1)} | {item.reports[0].grade}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {report && report.report && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 print:p-0" id="report-card">
          <div className="text-center mb-6">
            <div id="school-logo" className="flex flex-col items-center mb-2">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xl font-bold text-gray-400 print-hide">
                SMS
              </div>
              <h2 className="text-xl font-bold mt-1">School Management System</h2>
            </div>
            <p className="text-gray-500">Academic Year: {report.report.academicYearId?.year} | {report.report.termId?.name}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <p><strong>Student:</strong> {report.student?.firstName} {report.student?.lastName}</p>
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
          <p className="text-sm">Midterm Total: {report.report.midtermTotal} | Average: {report.report.midtermAverage?.toFixed(2)}</p>
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
          <p className="text-sm">End-Term Total: {report.report.endTermTotal} | Average: {report.report.endTermAverage?.toFixed(2)}</p>
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

          <div className="mt-6 pt-4 border-t space-y-3 print:hidden">
            <h3 className="font-bold text-gray-900 dark:text-white">Teacher Remark</h3>
            <div className="flex gap-2">
              <textarea value={teacherRemark} onChange={(e) => setTeacherRemark(e.target.value)}
                placeholder="Write encouragement remarks for the student..."
                className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" rows={3} />
            </div>
            <button onClick={handleRemarkSave} disabled={savingRemark}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50">
              {savingRemark ? 'Saving...' : 'Save Remark'}
            </button>
            {remarkSaved && <span className="text-green-600 text-sm ml-2">Saved!</span>}

            <h3 className="font-bold text-gray-900 dark:text-white mt-4">Head Teacher Signature</h3>
            <div className="flex gap-2">
              <input value={headTeacherSignature} onChange={(e) => setHeadTeacherSignature(e.target.value)}
                placeholder="Type head teacher name for signature..."
                className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
            </div>
            <button onClick={handleSignatureSave} disabled={savingSignature}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50">
              {savingSignature ? 'Saving...' : 'Save Signature'}
            </button>
            {signatureSaved && <span className="text-green-600 text-sm ml-2">Saved!</span>}
          </div>

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
            <a href={`/api/reports/student/${report.student?._id}/pdf${studentTermId ? `?termId=${studentTermId}` : ''}`}
              target="_blank" className="px-4 py-2 bg-green-600 text-white rounded-lg inline-block">Export PDF</a>
          </div>
        </div>
      )}

      {report && report.classReport && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
          <h2 className="text-lg font-bold mb-4">Class Rankings</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr><th className="p-2 text-left">Rank</th><th className="p-2 text-left">Student</th><th className="p-2">Average</th><th className="p-2">Grade</th><th className="p-2">Remarks</th></tr>
            </thead>
            <tbody>
              {report.classReport.map((r, i) => (
                <tr key={r._id} className="border-t">
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">{r.studentId?.firstName} {r.studentId?.lastName}</td>
                  <td className="p-2 text-center">{r.overallAverage?.toFixed(1)}</td>
                  <td className="p-2 text-center">{r.grade}</td>
                  <td className="p-2 text-center">
                    <span className={r.remarks === 'Pass' ? 'text-green-600' : 'text-red-600'}>{r.remarks}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
