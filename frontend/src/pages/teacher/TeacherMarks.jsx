import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function TeacherMarks() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [level, setLevel] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');
  const [termId, setTermId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [marks, setMarks] = useState({});
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

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
    return level ? subjects.filter((s) => s.subjectId?.level === level) : subjects;
  }, [subjects, level]);

  const selectedSubject = filteredSubjects?.find((s) => s.subjectId?._id === subjectId);
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

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => API.get('/academic-years').then((r) => r.data.data),
  });

  const activeYear = academicYears?.find((y) => y.isActive);

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['students-for-marks', classId, academicYearId],
    queryFn: () => {
      let url = `/students?classId=${classId}&limit=100`;
      if (academicYearId) url += `&academicYearId=${academicYearId}`;
      return API.get(url).then((r) => r.data.data);
    },
    enabled: !!classId,
  });

  const { data: existingMarks, isLoading: existingLoading } = useQuery({
    queryKey: ['existing-marks', classId, subjectId, termId, academicYearId],
    queryFn: () => {
      let url = `/marks?classId=${classId}&subjectId=${subjectId}&termId=${termId}&limit=100`;
      if (academicYearId) url += `&academicYearId=${academicYearId}`;
      return API.get(url).then((r) => r.data.data);
    },
    enabled: !!classId && !!subjectId && !!termId,
  });

  const filteredTerms = useMemo(() => {
    if (!terms) return [];
    if (!academicYearId) return terms;
    return terms.filter((t) => {
      const ty = t.academicYearId?._id || t.academicYearId;
      return ty === academicYearId;
    });
  }, [terms, academicYearId]);

  const selectedTerm = filteredTerms?.find((t) => t._id === termId);

  useEffect(() => {
    initialized.current = false;
  }, [classId, subjectId, termId]);

  useEffect(() => {
    if (existingMarks && !initialized.current) {
      const initial = {};
      for (const m of existingMarks) {
        const sid = m.studentId?._id || m.studentId;
        if (sid) {
          initial[sid.toString()] = {
            midterm: m.midtermMarks ?? null,
            endterm: m.endTermMarks ?? null,
          };
        }
      }
      setMarks(initial);
      initialized.current = true;
    }
  }, [existingMarks]);

  const handleMarkChange = (studentId, field, value) => {
    setMarks((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value === '' ? null : parseFloat(value) },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const year = academicYearId || selectedTerm?.academicYearId?._id || selectedTerm?.academicYearId || activeYear?._id;
      if (!year) {
        addToast('Could not determine academic year. Please check term settings.', 'error');
        setSaving(false);
        return;
      }
      const promises = [];
      for (const studentId of Object.keys(marks)) {
        const m = marks[studentId];
        if (m.midterm === null && m.endterm === null) continue;
        const existing = existingMarks?.find(
          (e) => (e.studentId?._id || e.studentId)?.toString() === studentId
        );
        const body = {
          studentId,
          subjectId,
          classId,
          termId,
          academicYearId: year,
        };
        if (m.midterm !== null) body.midtermMarks = m.midterm;
        if (m.endterm !== null) body.endTermMarks = m.endterm;
        if (existing) {
          promises.push(API.put(`/marks/${existing._id}`, body));
        } else {
          promises.push(API.post('/marks', body));
        }
      }
      if (promises.length === 0) {
        addToast('No marks to save.', 'info');
        setSaving(false);
        return;
      }
      const results = await Promise.allSettled(promises);
      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length === 0) {
        addToast('Marks saved successfully', 'success');
      } else if (failures.length === results.length) {
        addToast(failures[0].reason?.response?.data?.message || 'Error saving marks', 'error');
      } else {
        addToast(`Saved ${results.length - failures.length}/${results.length} marks. ${failures.length} failed.`, 'warning');
      }
      queryClient.invalidateQueries({ queryKey: ['existing-marks', classId, subjectId, termId, academicYearId] });
    } catch (err) {
      addToast(err.response?.data?.message || 'Error saving marks', 'error');
    } finally {
      setSaving(false);
    }
  };

  const hasMarks = Object.values(marks).some((m) => m.midterm !== null || m.endterm !== null);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Marks Entry</h1>
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <select value={level} onChange={(e) => { setLevel(e.target.value); setSubjectId(''); setClassId(''); }}
          className="w-full sm:w-auto px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="">All Levels</option>
          <option value="O-Level">O-Level</option>
          <option value="A-Level">A-Level</option>
        </select>
        <select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setClassId(''); }}
          className="w-full sm:w-auto px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="">Select Subject</option>
          {subjectsLoading ? <option disabled>Loading...</option> : filteredSubjects?.map((s) => (
            <option key={s.subjectId?._id || s._id} value={s.subjectId?._id || s._id}>
              {s.subjectId?.name || s.name}{s.classIds?.length ? ` (${s.classIds.map((c) => c.name || c).join(', ')})` : ''}
            </option>
          ))}
        </select>
        <select value={classId} onChange={(e) => setClassId(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="">Select Class</option>
          {classesLoading ? <option disabled>Loading...</option> : filteredClasses?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select value={academicYearId} onChange={(e) => { setAcademicYearId(e.target.value); setTermId(''); }}
          className="w-full sm:w-auto px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="">All Years</option>
          {academicYears ? academicYears.map((y) => <option key={y._id} value={y._id}>{y.year}</option>) : <option disabled>Loading...</option>}
        </select>
        <select value={termId} onChange={(e) => setTermId(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="">Select Term</option>
          {terms ? filteredTerms.map((t) => <option key={t._id} value={t._id}>{t.name}</option>) : <option disabled>Loading...</option>}
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
                          className="w-full px-2 py-1 border dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                      </td>
                      <td className="p-3">
                        <input type="number" min="0" max="100" step="0.5"
                          value={m.endterm ?? ''}
                          onChange={(e) => handleMarkChange(s._id, 'endterm', e.target.value)}
                          className="w-full px-2 py-1 border dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {hasMarks && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save All Marks'}
              </button>
            </div>
          )}
        </div>
      ) : subjectId && termId ? (
        <p className="text-center text-gray-400 dark:text-gray-500 py-8">Select a class to view students.</p>
      ) : null}
    </div>
  );
}
