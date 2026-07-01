import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../context/ToastContext';
import API from '../../services/api';
import { useActiveYear } from '../../services/useActiveYear';

export default function ClassesPage() {
  const { activeYear } = useActiveYear();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: 'S1', level: 'O-Level', academicYearId: '' });
  const [filterLevel, setFilterLevel] = useState('');
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const yearSynced = useRef(false);

  useEffect(() => {
    if (activeYear && !yearSynced.current) {
      yearSynced.current = true;
      setForm((prev) => ({ ...prev, academicYearId: activeYear._id }));
    }
  }, [activeYear]);

  const { data } = useQuery({
    queryKey: ['classes-list', filterLevel],
    queryFn: () => API.get(`/classes?limit=50${filterLevel ? `&level=${filterLevel}` : ''}`).then((r) => r.data.data),
  });

  const { data: years } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => API.get('/academic-years').then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => API.delete(`/classes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes-list'] });
      queryClient.invalidateQueries({ queryKey: ['classes-all'] });
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await API.put(`/classes/${editing}`, form);
        addToast('Class updated successfully', 'success');
      } else {
        await API.post('/classes', form);
        addToast('Class created successfully', 'success');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: 'S1', level: 'O-Level', academicYearId: '' });
      queryClient.invalidateQueries({ queryKey: ['classes-list'] });
      queryClient.invalidateQueries({ queryKey: ['classes-all'] });
    } catch (err) { addToast(err.response?.data?.message || 'Error', 'error'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Classes</h1>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
            <option value="">All Levels</option>
            <option value="O-Level">O-Level</option>
            <option value="A-Level">A-Level</option>
          </select>
          <button onClick={() => { setShowForm(true); setEditing(null); }} className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg text-center">+ Add Class</button>
        </div>
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4" onClick={() => { setShowForm(false); setEditing(null); }}>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-6 w-full max-w-md mx-2 sm:mx-0" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{editing ? 'Edit Class' : 'Add Class'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <select value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="S1">S1</option><option value="S2">S2</option><option value="S3">S3</option>
                <option value="S4">S4</option><option value="S5">S5</option><option value="S6">S6</option>
              </select>
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="O-Level">O-Level</option><option value="A-Level">A-Level</option>
              </select>
              <select value={form.academicYearId} onChange={(e) => setForm({ ...form, academicYearId: e.target.value })}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="">Select Year</option>
                {years ? years.map((y) => <option key={y._id} value={y._id}>{y.year}{y.isActive ? ' (Active)' : ''}</option>) : <option disabled>Loading...</option>}
              </select>
              <div className="flex gap-3">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">{editing ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg dark:hover:bg-gray-600">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((c) => (
          <div key={c._id} className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{c.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-300">{c.level}</p>
                <p className="text-xs text-gray-400 dark:text-gray-400">{c.academicYearId?.year || 'No year'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setForm({ name: c.name, level: c.level, academicYearId: c.academicYearId?._id || '' }); setEditing(c._id); setShowForm(true); }} className="text-blue-600 text-xs hover:underline">Edit</button>
                <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(c._id); }} className="text-red-500 text-xs hover:underline">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
