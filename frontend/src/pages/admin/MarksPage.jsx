import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import API from '../../services/api';

export default function MarksPage() {
  const [page, setPage] = useState(1);
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [termFilter, setTermFilter] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['marks', page, classFilter, subjectFilter, termFilter],
    queryFn: async () => {
      const response = await API.get(`/marks?page=${page}&limit=10${classFilter ? `&classId=${classFilter}` : ''}${subjectFilter ? `&subjectId=${subjectFilter}` : ''}${termFilter ? `&termId=${termFilter}` : ''}`);
      return response.data;
    },
  });

  const { data: classes, isLoading: classesLoading } = useQuery({ 
    queryKey: ['classes-list'], 
    queryFn: async () => {
      const response = await API.get('/classes?limit=50');
      return response.data.data;
    },
  });

  const { data: subjects, isLoading: subjectsLoading } = useQuery({ 
    queryKey: ['subjects'], 
    queryFn: async () => {
      const response = await API.get('/subjects?limit=100');
      return response.data.data;
    },
  });

  const { data: terms } = useQuery({ 
    queryKey: ['terms'], 
    queryFn: async () => {
      const response = await API.get('/terms?limit=50');
      return response.data.data;
    },
  });

  const selectedClass = useMemo(() => classes?.find((c) => c._id === classFilter), [classes, classFilter]);
  const selectedSubject = useMemo(() => subjects?.find((s) => s._id === subjectFilter), [subjects, subjectFilter]);

  const filteredSubjects = useMemo(() => {
    if (!subjects) return [];
    if (!selectedClass) return subjects;
    const classLevel = selectedClass.level;
    return subjects.filter((s) => s.level === classLevel);
  }, [subjects, selectedClass]);

  const filteredClasses = useMemo(() => {
    if (!classes) return [];
    if (!selectedSubject) return classes;
    return classes.filter((c) => c.level === selectedSubject.level);
  }, [classes, selectedSubject]);

  const loading = isLoading || classesLoading || subjectsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        Failed to load marks. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Marks</h1>
      <div className="flex flex-wrap gap-3">
        <select value={classFilter} onChange={(e) => { setClassFilter(e.target.value); if (!e.target.value) setSubjectFilter(''); }} className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="">All Classes</option>
          {classes?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select value={subjectFilter} onChange={(e) => { setSubjectFilter(e.target.value); if (!e.target.value) setClassFilter(''); }} className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="">All Subjects</option>
          {filteredSubjects?.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.level})</option>)}
        </select>
        <select value={termFilter} onChange={(e) => setTermFilter(e.target.value)} className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="">All Terms</option>
          {terms?.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="text-left p-3">Student</th>
                <th className="text-left p-3">Subject</th>
                <th className="text-left p-3">Class</th>
                <th className="text-left p-3">Term</th>
                <th className="text-left p-3">Midterm</th>
                <th className="text-left p-3">End-Term</th>
                <th className="text-left p-3">Average</th>
                <th className="text-left p-3">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data?.data?.length > 0 ? (
                data.data.map((m) => (
                  <tr key={m._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-3 text-gray-900 dark:text-white">{m.studentId?.firstName} {m.studentId?.lastName}</td>
                    <td className="p-3 text-gray-700 dark:text-gray-300">{m.subjectId?.name}</td>
                    <td className="p-3 text-gray-700 dark:text-gray-300">{m.classId?.name}</td>
                    <td className="p-3 text-gray-700 dark:text-gray-300">{m.termId?.name}</td>
                    <td className={`p-3 ${m.midtermMarks != null ? (m.midtermMarks >= 40 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium') : 'text-gray-700 dark:text-gray-300'}`}>{m.midtermMarks ?? '-'}</td>
                    <td className={`p-3 ${m.endTermMarks != null ? (m.endTermMarks >= 40 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium') : 'text-gray-700 dark:text-gray-300'}`}>{m.endTermMarks ?? '-'}</td>
                    <td className={`p-3 font-medium ${m.subjectAverage >= 40 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{m.subjectAverage?.toFixed(1) || '-'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 ring-1 ring-green-400 dark:bg-green-900/40 dark:text-green-300 dark:ring-green-600">{m.grade || '-'}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No marks found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {data?.pagination && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="dark:text-gray-300">Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">Prev</button>
            <button disabled={page >= data.pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
