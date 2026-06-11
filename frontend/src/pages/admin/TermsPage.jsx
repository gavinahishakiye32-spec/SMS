import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../context/ToastContext';
import API from '../../services/api';

export default function TermsPage() {
  const [form, setForm] = useState({ name: 'Term 1', academicYearId: '', startDate: '', endDate: '' });
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: 'Term 1', academicYearId: '', startDate: '', endDate: '' });
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['terms'],
    queryFn: async () => {
      const response = await API.get('/terms?limit=100');
      return response.data.data;
    },
  });

  const { data: years } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const response = await API.get('/academic-years?limit=50');
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: () => API.post('/terms', form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['terms'] }); setForm({ name: 'Term 1', academicYearId: '', startDate: '', endDate: '' }); addToast('Term created', 'success'); },
    onError: (err) => addToast(err.response?.data?.message || 'Error', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: () => API.put(`/terms/${editing}`, editForm),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['terms'] }); setEditing(null); setEditForm({ name: 'Term 1', academicYearId: '', startDate: '', endDate: '' }); addToast('Term updated', 'success'); },
    onError: (err) => addToast(err.response?.data?.message || 'Error', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => API.delete(`/terms/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['terms'] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Terms</h1>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
        <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Add Term</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
            <option>Term 1</option><option>Term 2</option><option>Term 3</option>
          </select>
          <select value={form.academicYearId} onChange={(e) => setForm({ ...form, academicYearId: e.target.value })}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
            <option value="">Select Year</option>
            {years ? years.map((y) => <option key={y._id} value={y._id}>{y.year}</option>) : <option disabled>Loading...</option>}
          </select>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Start</span>
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">End</span>
            <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
          </label>
          <button onClick={createMutation.mutate} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Add Term</button>
        </div>
      </div>
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setEditing(null); setEditForm({ name: 'Term 1', academicYearId: '', startDate: '', endDate: '' }); }}>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Edit Term</h2>
            <div className="space-y-3">
              <select value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <option>Term 1</option><option>Term 2</option><option>Term 3</option>
              </select>
              <select value={editForm.academicYearId} onChange={(e) => setEditForm({ ...editForm, academicYearId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="">Select Year</option>
                {years ? years.map((y) => <option key={y._id} value={y._id}>{y.year}</option>) : <option disabled>Loading...</option>}
              </select>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Start Date</span>
                <input type="date" value={editForm.startDate} onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">End Date</span>
                <input type="date" value={editForm.endDate} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              </label>
              <div className="flex gap-3 pt-2">
                <button onClick={updateMutation.mutate} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Update</button>
                <button onClick={() => { setEditing(null); setEditForm({ name: 'Term 1', academicYearId: '', startDate: '', endDate: '' }); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data?.length > 0 ? (
          data.map((t) => (
            <div key={t._id} className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{t.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-300">{t.academicYearId?.year}</p>
                  {t.startDate && <p className="text-xs text-gray-400">{new Date(t.startDate).toLocaleDateString()} - {t.endDate ? new Date(t.endDate).toLocaleDateString() : ''}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(t._id); setEditForm({ name: t.name, academicYearId: t.academicYearId?._id || '', startDate: t.startDate?.split('T')[0] || '', endDate: t.endDate?.split('T')[0] || '' }); }} className="text-blue-600 text-xs hover:underline">Edit</button>
                  <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(t._id); }} className="text-red-500 text-xs">Delete</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-8 text-gray-500 dark:text-gray-400">
            No terms found. Create your first term above.
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
