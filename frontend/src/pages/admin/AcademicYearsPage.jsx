import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../context/ToastContext';
import API from '../../services/api';

export default function AcademicYearsPage() {
  const [year, setYear] = useState('');
  const [editing, setEditing] = useState(null);
  const [editYear, setEditYear] = useState('');
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => API.get('/academic-years').then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: () => API.post('/academic-years', { year }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['academic-years'] }); setYear(''); addToast('Academic year created', 'success'); },
    onError: (err) => addToast(err.response?.data?.message || 'Error', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => API.put(`/academic-years/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['academic-years'] }); setEditing(null); setEditYear(''); addToast('Academic year updated', 'success'); },
    onError: (err) => addToast(err.response?.data?.message || 'Error', 'error'),
  });

  const activateMutation = useMutation({
    mutationFn: (id) => API.put(`/academic-years/${id}/activate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['academic-years'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => API.delete(`/academic-years/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['academic-years'] }); addToast('Academic year deleted', 'success'); },
    onError: (err) => addToast(err.response?.data?.message || 'Error deleting academic year', 'error'),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Academic Years</h1>
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <input placeholder="Year (e.g., 2026)" value={year} onChange={(e) => setYear(e.target.value)}
          className="w-full sm:w-40 px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
        <button onClick={createMutation.mutate} className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg">Add Year</button>
      </div>
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4" onClick={() => { setEditing(null); setEditYear(''); }}>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-6 w-full max-w-md mx-2 sm:mx-0" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Edit Academic Year</h2>
            <div className="space-y-3">
              <input placeholder="Year (e.g., 2026)" value={editYear} onChange={(e) => setEditYear(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              <div className="flex gap-3">
                <button onClick={() => updateMutation.mutate({ id: editing, data: { year: editYear } })} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Update</button>
                <button onClick={() => { setEditing(null); setEditYear(''); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data?.map((y) => (
          <div key={y._id} className={`bg-white dark:bg-gray-900 rounded-xl shadow p-5 ${y.isActive ? 'ring-2 ring-green-500' : ''}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{y.year}</h3>
                <p className={`text-sm ${y.isActive ? 'text-green-600 font-semibold' : 'text-gray-400 dark:text-gray-400'}`}>
                  {y.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditing(y._id); setEditYear(y.year); }} className="text-blue-600 text-xs hover:underline">Edit</button>
                {!y.isActive && (
                  <button onClick={() => activateMutation.mutate(y._id)} className="text-green-600 text-xs hover:underline">Activate</button>
                )}
                <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(y._id); }} className="text-red-600 text-xs hover:underline">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
