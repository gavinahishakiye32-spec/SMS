import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function StudentsPage() {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    firstName: '', lastName: '', gender: 'Male', dateOfBirth: '', NIN: '',
    address: '', phoneNumber: '', email: '', classId: '', sectionId: '',
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['students', page, search, level, classFilter, sectionFilter, genderFilter, academicYearFilter],
    queryFn: () => API.get(`/students?page=${page}&limit=10&search=${encodeURIComponent(search)}&level=${level}${classFilter ? `&classId=${classFilter}` : ''}${sectionFilter ? `&sectionId=${sectionFilter}` : ''}${genderFilter ? `&gender=${genderFilter}` : ''}${academicYearFilter ? `&academicYearId=${academicYearFilter}` : ''}`).then((r) => r.data),
  });

  const { data: classes } = useQuery({
    queryKey: ['classes-list'],
    queryFn: () => API.get('/classes?limit=50').then((r) => r.data.data),
  });

  const { data: sections } = useQuery({
    queryKey: ['sections'],
    queryFn: () => API.get('/sections').then((r) => r.data.data),
  });

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => API.get('/academic-years').then((r) => r.data.data),
  });

  const filteredSections = useMemo(() => {
    if (!sections) return [];
    if (!classFilter) return sections;
    return sections.filter((s) => (s.classId?._id || s.classId) === classFilter);
  }, [sections, classFilter]);

  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId }) => API.post('/auth/reset-password', { userId, newPassword: 'student123' }),
    onSuccess: (data, variables) => {
      addToast(`Password reset to 'student123' for ${variables.name}`, 'success');
    },
    onError: (err) => addToast(err.response?.data?.message || 'Error resetting password', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => API.delete(`/students/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await API.put(`/students/${editing}`, form);
        addToast('Student updated successfully', 'success');
      } else {
        const res = await API.post('/students', form);
        const password = res.data.data?.defaultPassword;
        const loginEmail = res.data.data?.email || `${res.data.data?.studentCode?.toLowerCase()}@sms.edu`;
        addToast(`Student created! Login: ${loginEmail} / Password: ${password || 'student123'}`, 'success');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ firstName: '', lastName: '', gender: 'Male', dateOfBirth: '', NIN: '', address: '', phoneNumber: '', email: '', classId: '', sectionId: '' });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    } catch (err) {
      addToast(err.response?.data?.message || 'Error saving student', 'error');
    }
  };

  const handleEdit = (student) => {
    setForm({
      firstName: student.firstName, lastName: student.lastName, gender: student.gender,
      dateOfBirth: student.dateOfBirth?.split('T')[0] || '', NIN: student.NIN || '',
      address: student.address || '', phoneNumber: student.phoneNumber || '',
      email: student.userId?.email || '',
      classId: student.classId?._id || '',
      sectionId: student.sectionId?._id || '',
    });
    setEditing(student._id);
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Students</h1>
        {user?.role !== 'teacher' && (
          <button onClick={() => { setShowForm(true); setEditing(null); }} className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap text-center">+ Add Student</button>
        )}
      </div>
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <input
          type="text" placeholder="Search by name or code..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full sm:w-72 px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
        <select value={level} onChange={(e) => { setLevel(e.target.value); setClassFilter(''); setSectionFilter(''); setPage(1); }}
          className="w-full sm:w-auto px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="">All Levels</option>
          <option value="O-Level">O-Level</option>
          <option value="A-Level">A-Level</option>
        </select>
        <select value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setSectionFilter(''); setPage(1); }}
          className="w-full sm:w-auto px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="">All Classes</option>
          {classes ? classes.filter((c) => !level || c.level === level).map((c) => <option key={c._id} value={c._id}>{c.name}</option>) : <option disabled>Loading...</option>}
        </select>
        <select value={sectionFilter} onChange={(e) => { setSectionFilter(e.target.value); setPage(1); }}
          className="w-full sm:w-auto px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="">All Sections</option>
          {filteredSections.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <select value={genderFilter} onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
          className="w-full sm:w-auto px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="">All Genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        <select value={academicYearFilter} onChange={(e) => { setAcademicYearFilter(e.target.value); setPage(1); }}
          className="w-full sm:w-auto px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="">All Years</option>
          {academicYears ? academicYears.map((y) => <option key={y._id} value={y._id}>{y.year}</option>) : <option disabled>Loading...</option>}
        </select>
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-6 w-full max-w-lg max-h-[90vh] sm:max-h-[80vh] overflow-y-auto mx-2 sm:mx-0" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{editing ? 'Edit Student' : 'Add Student'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input placeholder="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" required />
                <input placeholder="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" required />
              </div>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <option>Male</option><option>Female</option>
              </select>
              <label className="block">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Date of Birth</span>
                <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              </label>
              <input placeholder="NIN" value={form.NIN} onChange={(e) => setForm({ ...form, NIN: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              <input placeholder="Phone Number" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              <input placeholder="Login Email (leave blank for auto-generated)" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="">Select Class</option>
                {classes ? classes.map((c) => <option key={c._id} value={c._id}>{c.name} ({c.level})</option>) : <option disabled>Loading...</option>}
              </select>
              <select value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="">Select Section</option>
                {sections ? sections.filter((s) => !form.classId || (s.classId?._id || s.classId) === form.classId).map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                )) : <option disabled>Loading...</option>}
              </select>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editing ? 'Update' : 'Create'}
                </button>
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
                {user?.role !== 'teacher' && <th className="text-left p-3">Code</th>}
                <th className="text-left p-3">Name</th>
                {user?.role !== 'teacher' && <th className="text-left p-3">Gender</th>}
                {user?.role !== 'teacher' && <th className="text-left p-3">Login Email</th>}
                {user?.role !== 'teacher' && <th className="text-left p-3">Date of Birth</th>}
                {user?.role !== 'teacher' && <th className="text-left p-3">NIN</th>}
                <th className="text-left p-3">Class</th>
                <th className="text-left p-3">Section</th>
                {user?.role !== 'teacher' && <th className="text-left p-3">Phone</th>}
                {user?.role !== 'teacher' && <th className="text-left p-3">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr><td colSpan={user?.role !== 'teacher' ? 10 : 3} className="p-4 text-center text-gray-500 dark:text-gray-400">Loading...</td></tr>
              ) : data?.data?.length === 0 ? (
                <tr><td colSpan={user?.role !== 'teacher' ? 10 : 3} className="p-4 text-center text-gray-500 dark:text-gray-400">No students found</td></tr>
              ) : data?.data?.map((s) => (
                <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  {user?.role !== 'teacher' && <td className="p-3 font-medium text-gray-900 dark:text-white">{s.studentCode}</td>}
                  <td className="p-3 text-gray-700 dark:text-gray-300">{s.firstName} {s.lastName}</td>
                  {user?.role !== 'teacher' && <td className="p-3 text-gray-700 dark:text-gray-300">{s.gender}</td>}
                  {user?.role !== 'teacher' && <td className="p-3 text-gray-700 dark:text-gray-300">{s.userId?.email || (s.studentCode ? `${s.studentCode.toLowerCase()}@sms.edu` : '-')}</td>}
                  {user?.role !== 'teacher' && <td className="p-3 text-gray-700 dark:text-gray-300">{s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString() : '-'}</td>}
                  {user?.role !== 'teacher' && <td className="p-3 text-gray-700 dark:text-gray-300">{s.NIN || '-'}</td>}
                  <td className="p-3 text-gray-700 dark:text-gray-300">{s.classId?.name || '-'}</td>
                  <td className="p-3 text-gray-700 dark:text-gray-300">{s.sectionId?.name || '-'}</td>
                  {user?.role !== 'teacher' && <td className="p-3 text-gray-700 dark:text-gray-300">{s.phoneNumber || '-'}</td>}
                  {user?.role !== 'teacher' && (
                    <td className="p-3 flex gap-2">
                      <button onClick={() => handleEdit(s)} className="text-blue-600 hover:underline text-xs">Edit</button>
                      <button onClick={() => { if (s.userId) resetPasswordMutation.mutate({ userId: s.userId?._id || s.userId, name: `${s.firstName} ${s.lastName}` }); else addToast('No linked user account', 'error'); }} className="text-orange-600 hover:underline text-xs">Reset Pwd</button>
                      <button onClick={() => { if (confirm('Delete this student?')) deleteMutation.mutate(s._id); }} className="text-red-600 hover:underline text-xs">Delete</button>
                    </td>
                  )}
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
