import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function TeachersPage() {
  const { addToast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', gender: 'Male', NIN: '', phoneNumber: '', email: '', level: '', subjectIds: [] });
  const queryClient = useQueryClient();

  const [levelFilter, setLevelFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['teachers', page, search, levelFilter],
    queryFn: () => API.get(`/teachers?page=${page}&limit=10&search=${encodeURIComponent(search)}${levelFilter ? `&level=${levelFilter}` : ''}`).then((r) => r.data),
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects-all'],
    queryFn: () => API.get('/subjects?limit=100').then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => API.delete(`/teachers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['subjects-all'] });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId }) => API.post('/auth/reset-password', { userId, newPassword: 'teacher123' }),
    onSuccess: (data, variables) => {
      addToast(`Password reset to 'teacher123' for ${variables.name}`, 'success');
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
    onError: (err) => addToast(err.response?.data?.message || 'Error resetting password', 'error'),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await API.put(`/teachers/${editing}`, form);
        addToast('Teacher updated successfully', 'success');
      } else {
        const res = await API.post('/teachers', form);
        const password = res.data.data?.defaultPassword;
        addToast(`Teacher created! Login: ${form.email} / Password: ${password || 'teacher123'}`, 'success');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ firstName: '', lastName: '', gender: 'Male', NIN: '', phoneNumber: '', email: '', level: '', subjectIds: [] });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['subjects-all'] });
    } catch (err) {
      addToast(err.response?.data?.message || 'Error saving teacher', 'error');
    }
  };

  const toggleSubject = (id) => {
    setForm((prev) => ({
      ...prev,
      subjectIds: prev.subjectIds.includes(id) ? prev.subjectIds.filter((s) => s !== id) : [...prev.subjectIds, id],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teachers</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); }} className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap text-center">+ Add Teacher</button>
      </div>
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <input placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full sm:flex-1 px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
        <select value={levelFilter} onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}
          className="w-full sm:w-auto px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="">All Levels</option>
          <option value="O-Level">O-Level</option>
          <option value="A-Level">A-Level</option>
        </select>
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-6 w-full max-w-lg max-h-[90vh] sm:max-h-[80vh] overflow-y-auto mx-2 sm:mx-0" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{editing ? 'Edit Teacher' : 'Add Teacher'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input placeholder="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" required />
                <input placeholder="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" required />
              </div>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <option>Male</option><option>Female</option>
              </select>
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="">Select Level</option>
                <option value="O-Level">O-Level</option>
                <option value="A-Level">A-Level</option>
              </select>
              <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" required />
              <input placeholder="NIN" value={form.NIN} onChange={(e) => setForm({ ...form, NIN: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              <input placeholder="Phone" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              <div>
                <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Assign Subjects</p>
                <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto">
                  {subjects?.map((s) => (
                    <label key={s._id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-2 py-1 rounded cursor-pointer">
                      <input type="checkbox" checked={form.subjectIds.includes(s._id)} onChange={() => toggleSubject(s._id)} />
                      <span>{s.name} <span className="text-xs text-gray-400">({s.level})</span></span>
                      {s.classIds?.length > 0 && <span className="text-xs text-gray-400 ml-auto">[{s.classIds.map((c) => c.name).join(', ')}]</span>}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">{editing ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">Cancel</button>
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
                <th scope="col" className="text-left p-3">Name</th>
                <th scope="col" className="text-left p-3">Level</th>
                <th scope="col" className="text-left p-3">Gender</th>
                <th scope="col" className="text-left p-3">NIN</th>
                <th scope="col" className="text-left p-3">Email</th>
                <th scope="col" className="text-left p-3">Phone</th>
                <th scope="col" className="text-left p-3">Subjects</th>
                <th scope="col" className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr><td colSpan={8} className="p-4 text-center text-gray-500 dark:text-gray-400">Loading...</td></tr>
              ) : data?.data?.length === 0 ? (
                <tr><td colSpan={8} className="p-4 text-center text-gray-500 dark:text-gray-400">No teachers found</td></tr>
              ) : data?.data?.map((t) => (
                <tr key={t._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="p-3 font-medium text-gray-900 dark:text-white">{t.firstName} {t.lastName}</td>
                  <td className="p-3"><span className={`text-xs font-semibold px-2 py-1 rounded ${t.level === 'O-Level' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : t.level === 'A-Level' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'}`}>{t.level || '-'}</span></td>
                  <td className="p-3 text-gray-700 dark:text-gray-300">{t.gender}</td>
                  <td className="p-3 text-gray-700 dark:text-gray-300">{t.NIN || '-'}</td>
                  <td className="p-3 text-gray-700 dark:text-gray-300">{t.email}</td>
                  <td className="p-3 text-gray-700 dark:text-gray-300">{t.phoneNumber || '-'}</td>
                  <td className="p-3 text-gray-700 dark:text-gray-300">
                    {(t.subjectIds || []).map((s) => `${s.name} (${(s.classIds || []).map((c) => c.name).join(', ') || 'no classes'})`).join(', ') || '-'}
                  </td>
                  <td className="p-3 flex flex-wrap gap-2">
                    <button onClick={() => { setForm({ firstName: t.firstName, lastName: t.lastName, gender: t.gender, NIN: t.NIN || '', phoneNumber: t.phoneNumber || '', email: t.email, level: t.level || '', subjectIds: t.subjectIds?.map((s) => s._id) || [] }); setEditing(t._id); setShowForm(true); }} className="text-blue-600 hover:underline text-xs">Edit</button>
                    <button onClick={() => { if (t.userId?._id) resetPasswordMutation.mutate({ userId: t.userId._id, name: `${t.firstName} ${t.lastName}` }); else addToast('No linked user account', 'error'); }} className="text-orange-600 hover:underline text-xs">Reset Pwd</button>
                    <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(t._id); }} className="text-red-600 hover:underline text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {data?.pagination && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <span>Page {data.pagination.page} of {data.pagination.totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border rounded-lg disabled:opacity-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Prev</button>
            <button disabled={page >= data.pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded-lg disabled:opacity-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
