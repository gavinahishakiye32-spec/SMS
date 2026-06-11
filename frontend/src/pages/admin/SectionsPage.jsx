import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../context/ToastContext';
import API from '../../services/api';

export default function SectionsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', classId: '' });
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data } = useQuery({
    queryKey: ['sections-list'],
    queryFn: () => API.get('/sections').then((r) => r.data),
  });

  const { data: classes } = useQuery({
    queryKey: ['classes-list'],
    queryFn: () => API.get('/classes?limit=50').then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => API.delete(`/sections/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sections-list'] }),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await API.put(`/sections/${editing}`, form);
        addToast('Section updated successfully', 'success');
      } else {
        await API.post('/sections', form);
        addToast('Section created successfully', 'success');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', classId: '' });
      queryClient.invalidateQueries({ queryKey: ['sections-list'] });
    } catch (err) { addToast(err.response?.data?.message || 'Error', 'error'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sections</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg">+ Add Section</button>
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowForm(false); setEditing(null); }}>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{editing ? 'Edit Section' : 'Add Section'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input placeholder="Section Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" required />
              <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="">Select Class</option>
                {classes ? classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                )) : <option disabled>Loading...</option>}
              </select>
              <div className="flex gap-3">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">{editing ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.data?.map((s) => (
          <div key={s._id} className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{s.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-300">Class: {s.classId?.name || 'N/A'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setForm({ name: s.name, classId: s.classId?._id || '' }); setEditing(s._id); setShowForm(true); }} className="text-blue-600 text-xs hover:underline">Edit</button>
                <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(s._id); }} className="text-red-500 text-xs hover:underline">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
