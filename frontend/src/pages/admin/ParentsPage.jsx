import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../context/ToastContext';
import API from '../../services/api';

export default function ParentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ fullName: '', NIN: '', phoneNumber: '', email: '', address: '', studentIds: [] });
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data } = useQuery({
    queryKey: ['parents', page, search],
    queryFn: () => API.get(`/parents?page=${page}&limit=10&search=${search}`).then((r) => r.data),
  });

  const { data: students } = useQuery({
    queryKey: ['students-all'],
    queryFn: () => API.get('/students?limit=200').then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => API.delete(`/parents/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parents'] }),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await API.put(`/parents/${editing}`, form);
        addToast('Parent updated successfully', 'success');
      } else {
        await API.post('/parents', form);
        addToast('Parent created successfully', 'success');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ fullName: '', NIN: '', phoneNumber: '', email: '', address: '', studentIds: [] });
      queryClient.invalidateQueries({ queryKey: ['parents'] });
    } catch (err) {
      addToast(err.response?.data?.message || 'Error saving parent', 'error');
    }
  };

  const handleEdit = (parent) => {
    setForm({
      fullName: parent.fullName || '',
      NIN: parent.NIN || '',
      phoneNumber: parent.phoneNumber || '',
      email: parent.email || '',
      address: parent.address || '',
      studentIds: parent.studentIds?.map((s) => s._id) || [],
    });
    setEditing(parent._id);
    setShowForm(true);
  };

  const toggleStudent = (id) => {
    setForm((prev) => ({
      ...prev,
      studentIds: prev.studentIds.includes(id)
        ? prev.studentIds.filter((s) => s !== id)
        : [...prev.studentIds, id],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Parents</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ fullName: '', NIN: '', phoneNumber: '', email: '', address: '', studentIds: [] }); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg">+ Add Parent</button>
      </div>
      <input placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="w-full md:w-96 px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowForm(false); setEditing(null); }}>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{editing ? 'Edit Parent' : 'Add Parent'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input placeholder="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" required />
              <input placeholder="NIN" value={form.NIN} onChange={(e) => setForm({ ...form, NIN: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              <input placeholder="Phone" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              <div>
                <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Link Students</p>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {students?.map((s) => (
                    <label key={s._id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <input type="checkbox" checked={form.studentIds.includes(s._id)} onChange={() => toggleStudent(s._id)} />
                      {s.firstName} {s.lastName} ({s.studentCode})
                    </label>
                  ))}
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
                <th className="text-left p-3">NIN</th>
                <th className="text-left p-3">Phone</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Students</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data?.data?.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="p-3 font-medium text-gray-900 dark:text-white">{p.fullName}</td>
                  <td className="p-3 text-gray-700 dark:text-gray-300">{p.NIN || '-'}</td>
                  <td className="p-3 text-gray-700 dark:text-gray-300">{p.phoneNumber || '-'}</td>
                  <td className="p-3 text-gray-700 dark:text-gray-300">{p.email || '-'}</td>
                  <td className="p-3 text-gray-700 dark:text-gray-300">{p.studentIds?.length || 0}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => handleEdit(p)} className="text-blue-600 hover:underline text-xs">Edit</button>
                    <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(p._id); }} className="text-red-600 hover:underline text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
