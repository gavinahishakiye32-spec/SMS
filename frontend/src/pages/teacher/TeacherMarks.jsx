import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function TeacherMarks() {
  const { user } = useAuth();
  const [level, setLevel] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');
  const [termId, setTermId] = useState('');
  const [marks, setMarks] = useState({});

  const { data: teacher } = useQuery({
    queryKey: ['teacher-profile', user?._id],
    queryFn: () => API.get(`/teachers?userId=${user._id}&limit=1`).then((r) => r.data.data[0]),
    enabled: !!user?._id,
  });

  const { data: subjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ['teacher-subjects', teacher?._id],
    queryFn: () => API.get(`/teachers/${teacher._id}/subjects`).then((r) => r.data.data),
    enabled: !!teacher?._id,
  });

  const filteredSubjects = useMemo(() => {
    if (!subjects) return [];
    return level ? subjects.filter((s) => s.level === level) : subjects;
  }, [subjects, level]);

  const selectedSubject = filteredSubjects?.find((s) => s._id === subjectId);
  const allowedClassIds = selectedSubject?.classIds?.map((c) => c._id || c) || [];

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['classes-list', level],
    queryFn: () => API.get(`/classes?limit=50${level ? `&level=${level}` : ''}`).then((r) => r.data.data),
  });

  const filteredClasses = classes?.filter((c) => !subjectId || allowedClassIds.includes(c._id)) || [];

  const { data: terms } = useQuery({
    queryKey: ['terms'],
    queryFn: () => API.get('/terms').then((r) => r.data.data),
  });

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['students-for-marks', classId],
    queryFn: () => API.get(`/students?classId=${classId}&limit=100`).then((r) => r.data.data),
    enabled: !!classId,
  });

  const { isLoading: existingLoading } = useQuery({
    queryKey: ['existing-marks', classId, subjectId, termId],
    queryFn: () => API.get(`/marks?classId=${classId}&subjectId=${subjectId}&termId=${termId}&limit=100`).then((r) => r.data.data),
    enabled: !!classId && !!subjectId && !!termId,
  });

  const handleMarkChange = (studentId, field, value) => {
    setMarks((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value === '' ? null : parseFloat(value) },
    }));
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Marks Entry</h1>
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <select value={level} onChange={(e) => { setLevel(e.target.value); setSubjectId(''); setClassId(''); }}
          className="w-full sm:w-auto px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="">All Levels</option>
          <option value="O-Level">O-Level</option>
          <option value="A-Level">A-Level</option>
        </select>
        <select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setClassId(''); }}
          className="w-full sm:w-auto px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="">Select Subject</option>
          {subjectsLoading ? <option disabled>Loading...</option> : filteredSubjects?.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}{s.classIds?.length ? ` (${s.classIds.map((c) => c.name || c).join(', ')})` : ''}
            </option>
          ))}
        </select>
        <select value={classId} onChange={(e) => setClassId(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="">Select Class</option>
          {classesLoading ? <option disabled>Loading...</option> : filteredClasses?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select value={termId} onChange={(e) => setTermId(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="">Select Term</option>
          {terms ? terms.map((t) => <option key={t._id} value={t._id}>{t.name}</option>) : <option disabled>Loading...</option>}
        </select>
      </div>
      {students && subjectId && termId ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="p-3 text-left">Student</th>
                  <th className="p-3 w-32">Mid-Term</th>
                  <th className="p-3 w-32">End-Term</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {(studentsLoading || existingLoading) ? (
                  <tr><td colSpan="3" className="p-6 text-center text-gray-400">Loading...</td></tr>
                ) : students.length === 0 ? (
                  <tr><td colSpan="3" className="p-6 text-center text-gray-400">No students in this class.</td></tr>
                ) : students.map((s) => {
                  const m = marks[s._id] || {};
                  return (
                    <tr key={s._id}>
                      <td className="p-3 text-gray-900 dark:text-white">{s.firstName} {s.lastName}</td>
                      <td className="p-3">
                        <input type="number" min="0" max="100" step="0.5"
                          value={m.midterm ?? ''}
                          onChange={(e) => handleMarkChange(s._id, 'midterm', e.target.value)}
                          className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                      </td>
                      <td className="p-3">
                        <input type="number" min="0" max="100" step="0.5"
                          value={m.endterm ?? ''}
                          onChange={(e) => handleMarkChange(s._id, 'endterm', e.target.value)}
                          className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : subjectId && termId ? (
        <p className="text-center text-gray-400 dark:text-gray-500 py-8">Select a class to view students.</p>
      ) : null}
    </div>
  );
}
