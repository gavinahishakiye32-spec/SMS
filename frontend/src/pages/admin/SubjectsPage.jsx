import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../context/ToastContext';
import API from '../../services/api';

export default function SubjectsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showAssign, setShowAssign] = useState(null);
  const [form, setForm] = useState({ name: '', level: 'O-Level', classIds: [] });
  const [filterLevel, setFilterLevel] = useState('');
  const [assignTeacherId, setAssignTeacherId] = useState('');
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data } = useQuery({
    queryKey: ['subjects', filterLevel],
    queryFn: () => API.get(`/subjects${filterLevel ? `?level=${filterLevel}` : ''}`).then((r) => r.data),
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers-all'],
    queryFn: () => API.get('/teachers?limit=100').then((r) => r.data.data),
  });

  const editingSubject = editing ? data?.data?.find((s) => s._id === editing) : null;
  const assigningSubject = showAssign ? data?.data?.find((s) => s._id === showAssign) : null;

  const { data: classes } = useQuery({
    queryKey: ['classes-all'],
    queryFn: () => API.get('/classes?limit=50').then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => API.delete(`/subjects/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subjects'] }),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await API.put(`/subjects/${editing}`, form);
        addToast('Subject updated successfully', 'success');
      } else {
        await API.post('/subjects', form);
        addToast('Subject created successfully', 'success');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', level: 'O-Level', classIds: [] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    } catch (err) { addToast(err.response?.data?.message || 'Error', 'error'); }
  };

  const filteredClasses = classes?.filter((c) => c.level === form.level) || [];

  const toggleClass = (id) => {
    setForm((prev) => ({
      ...prev,
      classIds: prev.classIds.includes(id) ? prev.classIds.filter((c) => c !== id) : [...prev.classIds, id],
    }));
  };

  const handleAssign = async (subjectId) => {
    try {
      await API.post(`/subjects/${subjectId}/assign-teacher`, { teacherId: assignTeacherId });
      setShowAssign(null);
      setAssignTeacherId('');
      addToast('Teacher assigned successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    } catch (err) { addToast(err.response?.data?.message || 'Error', 'error'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subjects</h1>
        <div className="flex flex-wrap gap-3">
          <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
            <option value="">All Levels</option>
            <option value="O-Level">O-Level</option>
            <option value="A-Level">A-Level</option>
          </select>
          <button onClick={() => { setShowForm(true); setEditing(null); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg">+ Add Subject</button>
        </div>
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowForm(false); setEditing(null); }}>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{editing ? 'Edit Subject' : 'Add Subject'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input placeholder="Subject Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" required />
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value, classIds: [] })}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="O-Level">O-Level</option><option value="A-Level">A-Level</option>
              </select>
              <div>
                <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Classes</p>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {filteredClasses.map((c) => (
                    <label key={c._id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <input type="checkbox" checked={form.classIds.includes(c._id)} onChange={() => toggleClass(c._id)} />
                      {c.name}
                    </label>
                  ))}
                  {filteredClasses.length === 0 && <span className="text-xs text-gray-400">No classes for this level</span>}
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">{editing ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Level</th>
                <th className="text-left p-3">Classes</th>
                <th className="text-left p-3">Teachers</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data?.data?.map((s) => (
                <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="p-3 font-medium text-gray-900 dark:text-white">{s.name}</td>
                  <td className="p-3 text-gray-700 dark:text-gray-300">{s.level}</td>
                  <td className="p-3 text-gray-700 dark:text-gray-300">{s.classIds?.map((c) => c.name).join(', ') || '-'}</td>
                  <td className="p-3 text-gray-700 dark:text-gray-300">{s.teacherIds?.map((t) => `${t.firstName} ${t.lastName}`).join(', ') || '-'}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => { setForm({ name: s.name, level: s.level, classIds: s.classIds?.map((c) => c._id) || [] }); setEditing(s._id); setShowForm(true); }} className="text-blue-600 hover:underline text-xs">Edit</button>
                    <button onClick={() => setShowAssign(s._id)} className="text-green-600 hover:underline text-xs">Assign</button>
                    <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(s._id); }} className="text-red-600 hover:underline text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showAssign && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAssign(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Assign Teacher {assigningSubject ? `(${assigningSubject.name})` : ''}</h2>
            <select value={assignTeacherId} onChange={(e) => setAssignTeacherId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-4">
              <option value="">Select Teacher</option>
              {teachers?.filter((t) => !assigningSubject || !t.level || t.level === assigningSubject.level).map((t) => <option key={t._id} value={t._id}>{t.firstName} {t.lastName}{t.level ? ` (${t.level})` : ''}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={() => handleAssign(showAssign)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Assign</button>
              <button onClick={() => setShowAssign(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
