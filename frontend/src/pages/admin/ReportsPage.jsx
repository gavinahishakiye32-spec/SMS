import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import API from '../../services/api';
import { useActiveYear } from '../../services/useActiveYear';

export default function ReportsPage() {
  const { activeYear } = useActiveYear();
  const [studentId, setStudentId] = useState('');
  const [classId, setClassId] = useState('');
  const [studentTermId, setStudentTermId] = useState('');
  const [classTermId, setClassTermId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchClassId, setSearchClassId] = useState('');
  const [searchTermId, setSearchTermId] = useState('');
  const [searchAcademicYearId, setSearchAcademicYearId] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const yearSynced = useRef(false);

  useEffect(() => {
    if (activeYear && !yearSynced.current) {
      yearSynced.current = true;
      setSearchAcademicYearId(activeYear._id);
    }
  }, [activeYear]);

  const { data: classes } = useQuery({ queryKey: ['classes-list'], queryFn: () => API.get('/classes?limit=50').then((r) => r.data.data) });
  const { data: terms } = useQuery({ queryKey: ['terms'], queryFn: () => API.get('/terms').then((r) => r.data.data) });
  const { data: academicYears } = useQuery({ queryKey: ['academic-years'], queryFn: () => API.get('/academic-years').then((r) => r.data.data) });
  const { data: settings } = useQuery({ queryKey: ['school-settings'], queryFn: () => API.get('/settings').then((r) => r.data.data) });

  const searchStudent = async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      let sid = studentId;
      if (!/^[0-9a-fA-F]{24}$/.test(studentId)) {
        const studentsRes = await API.get(`/students?search=${encodeURIComponent(studentId)}&limit=1`);
        const found = studentsRes.data?.data?.[0];
        if (!found) throw new Error('Student not found');
        sid = found._id;
      }
      const { data } = await API.get(`/reports/student/${sid}${studentTermId ? `?termId=${studentTermId}` : ''}`);
      setReport(data.data);
      setSearchResults(null);
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
      if (searchAcademicYearId) params.set('academicYearId', searchAcademicYearId);
      const { data } = await API.get(`/reports/search?${params}`);
      setSearchResults(data.data);
      setReport(null);
    } catch { setSearchResults([]); }
    setLoading(false);
  };

  const loadStudentReport = async (sid, term) => {
    setLoading(true);
    try {
      const termParam = term || '';
      const { data } = await API.get(`/reports/student/${sid}${termParam ? `?termId=${termParam}` : ''}`);
      setReport(data.data);
    } catch { setReport(null); }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="no-print">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4 sm:p-5">
          <h2 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">Search Reports</h2>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 mb-2">
            <input placeholder="Search by name, student ID, or code..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:flex-1 px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            <select value={searchClassId} onChange={(e) => setSearchClassId(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
              <option value="">All Classes</option>
              {classes ? classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>) : <option disabled>Loading...</option>}
            </select>
            <select value={searchTermId} onChange={(e) => setSearchTermId(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
              <option value="">Latest Term</option>
              {terms ? terms.map((t) => <option key={t._id} value={t._id}>{t.name}</option>) : <option disabled>Loading...</option>}
            </select>
            <select value={searchAcademicYearId} onChange={(e) => setSearchAcademicYearId(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
              <option value="">All Years</option>
              {academicYears ? academicYears.map((y) => <option key={y._id} value={y._id}>{y.year}</option>) : <option disabled>Loading...</option>}
            </select>
            <button onClick={handleSearch} className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg">Search</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4 sm:p-5">
            <h2 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">Quick Student Lookup</h2>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 mb-2">
              <input placeholder="Student ID or Code" value={studentId} onChange={(e) => setStudentId(e.target.value)}
                className="w-full sm:flex-1 px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              <select value={studentTermId} onChange={(e) => setStudentTermId(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="">Latest</option>
                {terms ? terms.map((t) => <option key={t._id} value={t._id}>{t.name}</option>) : <option disabled>Loading...</option>}
              </select>
            </div>
            <button onClick={searchStudent} className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg">Lookup</button>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4 sm:p-5">
            <h2 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">Class Report</h2>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 mb-2">
              <select value={classId} onChange={(e) => setClassId(e.target.value)}
                className="w-full sm:flex-1 px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="">Select Class</option>
                {classes ? classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>) : <option disabled>Loading...</option>}
              </select>
              <select value={classTermId} onChange={(e) => setClassTermId(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="">Latest Term</option>
                {terms ? terms.map((t) => <option key={t._id} value={t._id}>{t.name}</option>) : <option disabled>Loading...</option>}
              </select>
            </div>
            <button onClick={searchClass} className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg">View Rankings</button>
          </div>
        </div>

        {loading && <p className="text-center text-gray-500 dark:text-gray-400">Loading...</p>}

        {searchResults && !loading && (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
            <h2 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">Search Results ({searchResults.length})</h2>
            {searchResults.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No results found</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {searchResults.map((item) => (
                  <div key={item.student._id} className="border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => {
                      if (item.reports.length > 0) {
                        loadStudentReport(item.student?._id, item.reports[0].termId?._id);
                      } else {
                        loadStudentReport(item.student?._id, searchTermId);
                      }
                    }}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.student?.firstName} {item.student?.lastName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.student?.studentCode} | {item.student?.classId?.name} {item.student?.sectionId?.name || ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{item.reports.length} report(s)</span>
                        {item.reports.length > 0 && (
                          <>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{item.reports[0].academicYearId?.year} | {item.reports[0].termId?.name}</p>
                            <p className="text-sm font-medium text-blue-600">
                              Avg: {item.reports[0].overallAverage?.toFixed(1)} | {item.reports[0].grade}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {report && report.report && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 print:p-0" id="report-card">
          <div className="text-center mb-6">
            <div id="school-logo" className="flex flex-col items-center mb-2">
              {settings?.logo ? (
                <img src={settings.logo} alt="School Logo" className="h-16 w-16 object-contain mb-1" />
              ) : (
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xl font-bold text-gray-400 print-hide">
                  SMS
                </div>
              )}
              <h2 className="text-xl font-bold mt-1">{settings?.schoolName || 'School Management System'}</h2>
            </div>
            <p className="text-gray-500 dark:text-gray-400">Academic Year: {report.report.academicYearId?.year} | {report.report.termId?.name}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <p><strong className="text-gray-900 dark:text-white">Student:</strong> {report.student?.firstName} {report.student?.lastName}</p>
              <p><strong className="text-gray-900 dark:text-white">Code:</strong> {report.student?.studentCode}</p>
              <p><strong className="text-gray-900 dark:text-white">Class:</strong> {report.student?.classId?.name} {report.student?.sectionId?.name || ''}</p>
            </div>
          </div>
          <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Academic Performance</h3>
          <div className="overflow-x-auto"><table className="w-full text-sm mb-4 border">
            <thead><tr className="bg-gray-50 dark:bg-gray-800"><th className="border p-2 text-left text-gray-700 dark:text-gray-300">Subject</th><th className="border p-2 text-gray-700 dark:text-gray-300">Mid-Term/100</th><th className="border p-2 text-gray-700 dark:text-gray-300">End-Term/100</th><th className="border p-2 text-gray-700 dark:text-gray-300">Average</th><th className="border p-2 text-gray-700 dark:text-gray-300">Grade</th></tr></thead>
            <tbody>
              {report.marks?.map((m) => (
                <tr key={m._id}>
                  <td className="border p-2 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700">{m.subjectId?.name}</td>
                  <td className={`border p-2 text-center border-gray-200 dark:border-gray-700 ${m.midtermMarks != null ? (m.midtermMarks >= 40 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium') : 'text-gray-700 dark:text-gray-300'}`}>{m.midtermMarks ?? '-'}</td>
                  <td className={`border p-2 text-center border-gray-200 dark:border-gray-700 ${m.endTermMarks != null ? (m.endTermMarks >= 40 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium') : 'text-gray-700 dark:text-gray-300'}`}>{m.endTermMarks ?? '-'}</td>
                  <td className={`border p-2 text-center border-gray-200 dark:border-gray-700 ${m.subjectAverage >= 40 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium'}`}>{m.subjectAverage?.toFixed(0) || '-'}</td>
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
              <p>{report.report?.headTeacherSignature || 'Head Teacher Signature'}</p>
            </div>
          </div>

          <div className="flex justify-end mt-4 no-print">
            <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 cursor-pointer">
              <Printer size={18} /> Print Report Card
            </button>
          </div>
        </div>
      )}

      {report && report.classReport && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5 no-print">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Class Rankings</h2>
            {report.classReport[0]?.academicYearId?.year && (
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {report.classReport[0].academicYearId.year} | {report.classReport[0]?.termId?.name || ''}
              </span>
            )}
          </div>
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              <tr><th scope="col" className="p-2 text-left">Rank</th><th scope="col" className="p-2 text-left">Student</th><th scope="col" className="p-2">Average</th><th scope="col" className="p-2">Grade</th><th scope="col" className="p-2">Remarks</th></tr>
            </thead>
            <tbody>
              {report.classReport.map((r, i) => (
                <tr key={r._id} className="border-t border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">{r.studentId?.firstName} {r.studentId?.lastName}</td>
                  <td className="p-2 text-center">{r.overallAverage?.toFixed(0)}</td>
                  <td className="p-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${r.grade === 'A' ? 'bg-green-100 text-green-700' : r.grade === 'B' ? 'bg-blue-100 text-blue-700' : r.grade === 'C' ? 'bg-yellow-100 text-yellow-700' : r.grade === 'D' ? 'bg-orange-100 text-orange-700' : r.grade === 'E' ? 'bg-red-100 text-red-700' : r.grade === 'F' ? 'bg-red-200 text-red-800' : 'bg-gray-100 text-gray-500'}`}>{r.grade}</span>
                  </td>
                  <td className="p-2 text-center">
                    {r.remarks === 'Pass' ? (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold text-xs">PASSED</span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-xs">FAILED</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}
    </div>
  );
}
