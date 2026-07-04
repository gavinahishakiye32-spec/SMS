import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../context/ToastContext';
import API from '../../services/api';
import { Pencil, Trash2, User, Hash, Phone, Mail, MapPin, GraduationCap } from 'lucide-react';

const emptyP = { fullName: '', NIN: '', phoneNumber: '', email: '', address: '' };

export default function ParentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editIds, setEditIds] = useState({ mother: null, father: null });
  const [form, setForm] = useState({ mother: { ...emptyP }, father: { ...emptyP }, studentIds: [] });
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data } = useQuery({
    queryKey: ['parents', page, search],
    queryFn: () => API.get(`/parents?page=${page}&limit=10&search=${encodeURIComponent(search)}`).then((r) => r.data),
  });

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['students-all'],
    queryFn: () => API.get('/students?limit=200').then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => API.delete(`/parents/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parents'] }),
  });

  const families = useMemo(() => {
    const list = data?.data || [];
    const used = new Set();
    return list.reduce((acc, p) => {
      if (used.has(p._id)) return acc;
      const pIds = (p.studentIds || []).map((s) => s._id?.toString() || s.toString());
      let partner = list.find((o) =>
        o._id !== p._id && !used.has(o._id) &&
        (o.studentIds || []).some((s) => pIds.includes(s._id?.toString() || s.toString()))
      );
      if (!partner && p.parentType) {
        const oppositeType = p.parentType === 'Mother' ? 'Father' : 'Mother';
        partner = list.find((o) =>
          o._id !== p._id && !used.has(o._id) && o.parentType === oppositeType
        );
      }
      let mother, father;
      if (partner) {
        mother = p.parentType === 'Mother' ? p : (partner.parentType === 'Mother' ? partner : null);
        father = p.parentType === 'Father' ? p : (partner.parentType === 'Father' ? partner : null);
        if (!mother && !father) { mother = p; father = partner; }
        used.add(partner._id);
      } else {
        mother = (p.parentType === 'Mother' || !p.parentType) ? p : null;
        father = p.parentType === 'Father' ? p : null;
      }
      used.add(p._id);
      const allStudents = [...new Map(
        [...(mother?.studentIds || []), ...(father?.studentIds || [])]
          .map((s) => [s._id?.toString() || s.toString(), s])
      ).values()];
      acc.push({ mother, father, students: allStudents });
      return acc;
    }, []);
  }, [data?.data]);

  const openEdit = (parent) => {
    const parentData = data?.data || [];
    const editedStudentIds = (parent.studentIds || []).map((s) => s._id?.toString() || s.toString());
    const otherType = parent.parentType === 'Mother' ? 'Father' : 'Mother';
    const other = parentData.find((p) => {
      if (p.parentType !== otherType) return false;
      const pStudentIds = (p.studentIds || []).map((s) => s._id?.toString() || s.toString());
      return pStudentIds.some((id) => editedStudentIds.includes(id));
    });
    const mother = parent.parentType === 'Mother' ? parent : other;
    const father = parent.parentType === 'Father' ? parent : other;
    setEditIds({ mother: mother?._id || null, father: father?._id || null });
    setForm({ mother: { fullName: mother?.fullName || '', NIN: mother?.NIN || '', phoneNumber: mother?.phoneNumber || '', email: mother?.email || '', address: mother?.address || '' }, father: { fullName: father?.fullName || '', NIN: father?.NIN || '', phoneNumber: father?.phoneNumber || '', email: father?.email || '', address: father?.address || '' }, studentIds: editedStudentIds });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const promises = [];
      if (form.mother.fullName) {
        const body = { ...form.mother, parentType: 'Mother', studentIds: form.studentIds };
        promises.push(editIds.mother ? API.put(`/parents/${editIds.mother}`, body) : API.post('/parents', body));
      }
      if (form.father.fullName) {
        const body = { ...form.father, parentType: 'Father', studentIds: form.studentIds };
        promises.push(editIds.father ? API.put(`/parents/${editIds.father}`, body) : API.post('/parents', body));
      }
      await Promise.all(promises);
      addToast('Parents saved successfully', 'success');
      setShowForm(false);
      setEditIds({ mother: null, father: null });
      setForm({ mother: { ...emptyP }, father: { ...emptyP }, studentIds: [] });
      queryClient.invalidateQueries({ queryKey: ['parents'] });
    } catch (err) {
      addToast(err.response?.data?.message || 'Error saving parents', 'error');
    }
  };

  const toggleStudent = (id) => {
    setForm((prev) => ({
      ...prev,
      studentIds: prev.studentIds.includes(id)
        ? prev.studentIds.filter((s) => s !== id)
        : [...prev.studentIds, id],
    }));
  };

  const setField = (parent, field, value) => {
    setForm((prev) => ({ ...prev, [parent]: { ...prev[parent], [field]: value } }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Parents</h1>
        <button onClick={() => { setShowForm(true); setEditIds({ mother: null, father: null }); setForm({ mother: { ...emptyP }, father: { ...emptyP }, studentIds: [] }); }} className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-center">+ Add Parents</button>
      </div>
      <input placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="w-full sm:w-96 px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4" onClick={() => { setShowForm(false); setEditIds({ mother: null, father: null }); }}>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto mx-2 sm:mx-0" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{editIds.mother || editIds.father ? 'Edit Parents' : 'Add Parents'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <div className="border border-pink-200 dark:border-pink-900/40 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-pink-700 dark:text-pink-300 mb-3">Mother</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input placeholder="Full Name" value={form.mother.fullName} onChange={(e) => setField('mother', 'fullName', e.target.value)}
                      className="px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                    <input placeholder="NIN" value={form.mother.NIN} onChange={(e) => setField('mother', 'NIN', e.target.value)}
                      className="px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                    <input placeholder="Phone" value={form.mother.phoneNumber} onChange={(e) => setField('mother', 'phoneNumber', e.target.value)}
                      className="px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                    <input placeholder="Email" type="email" value={form.mother.email} onChange={(e) => setField('mother', 'email', e.target.value)}
                      className="px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                    <input placeholder="Address" value={form.mother.address} onChange={(e) => setField('mother', 'address', e.target.value)}
                      className="px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm sm:col-span-2" />
                  </div>
                </div>
                <div className="border border-blue-200 dark:border-blue-900/40 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-3">Father</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input placeholder="Full Name" value={form.father.fullName} onChange={(e) => setField('father', 'fullName', e.target.value)}
                      className="px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                    <input placeholder="NIN" value={form.father.NIN} onChange={(e) => setField('father', 'NIN', e.target.value)}
                      className="px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                    <input placeholder="Phone" value={form.father.phoneNumber} onChange={(e) => setField('father', 'phoneNumber', e.target.value)}
                      className="px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                    <input placeholder="Email" type="email" value={form.father.email} onChange={(e) => setField('father', 'email', e.target.value)}
                      className="px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                    <input placeholder="Address" value={form.father.address} onChange={(e) => setField('father', 'address', e.target.value)}
                      className="px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm sm:col-span-2" />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Link Students</p>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border dark:border-gray-600 rounded-lg p-2">
                  {studentsLoading ? (
                    <p className="text-sm text-gray-400 col-span-2 p-2">Loading students...</p>
                  ) : !students?.length ? (
                    <p className="text-sm text-gray-400 col-span-2 p-2">No students available. Create students first.</p>
                  ) : (
                    students.map((s) => (
                      <label key={s._id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-1">
                        <input type="checkbox" checked={form.studentIds.includes(s._id)} onChange={() => toggleStudent(s._id)} />
                        <span className="truncate">{s.firstName} {s.lastName} ({s.studentCode})</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">{editIds.mother || editIds.father ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditIds({ mother: null, father: null }); }} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg dark:hover:bg-gray-600">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {!families.length ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 py-16 text-center">
          <User size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No parents found.</p>
          <button onClick={() => { setShowForm(true); setEditIds({ mother: null, father: null }); setForm({ mother: { ...emptyP }, father: { ...emptyP }, studentIds: [] }); }}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">+ Add Parent</button>
        </div>
      ) : (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-pink-50/80 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-pink-950/30">
                <th colSpan={5} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-300 border-r border-blue-200/60 dark:border-blue-800/40"> Father</th>
                <th colSpan={5} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-pink-700 dark:text-pink-300 border-r border-pink-200/60 dark:border-pink-800/40"> Mother</th>
                <th colSpan={2} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400"> Details</th>
              </tr>
              <tr className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap border-r border-gray-200 dark:border-gray-700">Name</th>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap border-r border-gray-200 dark:border-gray-700 min-w-[90px]">NIN</th>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap border-r border-gray-200 dark:border-gray-700">Phone</th>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap border-r border-gray-200 dark:border-gray-700 min-w-[160px]">Email</th>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap border-r border-gray-200 dark:border-gray-700">Address</th>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap border-r border-gray-200 dark:border-gray-700">Name</th>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap border-r border-gray-200 dark:border-gray-700 min-w-[90px]">NIN</th>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap border-r border-gray-200 dark:border-gray-700">Phone</th>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap border-r border-gray-200 dark:border-gray-700 min-w-[160px]">Email</th>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap border-r border-gray-200 dark:border-gray-700">Address</th>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap border-r border-gray-200 dark:border-gray-700 min-w-[120px]">Student</th>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {families.map((fam, i) => {
                const parent = fam.father || fam.mother;
                const f = fam.father;
                const m = fam.mother;
                return (
                <tr key={parent?._id || i}
                    className={`transition-colors duration-150 ${i % 2 === 1 ? 'bg-gray-50/40 dark:bg-gray-800/20' : ''} hover:bg-blue-50/30 dark:hover:bg-blue-900/10`}>
                  <td className={`px-4 py-3 text-sm ${f?.fullName ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-400 dark:text-gray-600'}`}>
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-blue-500 dark:text-blue-400 shrink-0" />
                      <span>{f?.fullName || '—'}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-sm ${f?.NIN ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}`}>
                    <div className="flex items-center gap-1.5">
                      <Hash size={13} className="text-gray-400 dark:text-gray-500 shrink-0" />
                      <span>{f?.NIN || '—'}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-sm ${f?.phoneNumber ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}`}>
                    <div className="flex items-center gap-1.5">
                      <Phone size={13} className="text-gray-400 dark:text-gray-500 shrink-0" />
                      <span>{f?.phoneNumber || '—'}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-sm ${f?.email ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}`}>
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail size={13} className="text-gray-400 dark:text-gray-500 shrink-0" />
                      <span className="truncate">{f?.email || '—'}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-sm ${f?.address ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'} border-r border-gray-100 dark:border-gray-700/50`}>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-gray-400 dark:text-gray-500 shrink-0" />
                      <span>{f?.address || '—'}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-sm ${m?.fullName ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-400 dark:text-gray-600'}`}>
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-pink-500 dark:text-pink-400 shrink-0" />
                      <span>{m?.fullName || '—'}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-sm ${m?.NIN ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}`}>
                    <div className="flex items-center gap-1.5">
                      <Hash size={13} className="text-gray-400 dark:text-gray-500 shrink-0" />
                      <span>{m?.NIN || '—'}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-sm ${m?.phoneNumber ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}`}>
                    <div className="flex items-center gap-1.5">
                      <Phone size={13} className="text-gray-400 dark:text-gray-500 shrink-0" />
                      <span>{m?.phoneNumber || '—'}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-sm ${m?.email ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}`}>
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail size={13} className="text-gray-400 dark:text-gray-500 shrink-0" />
                      <span className="truncate">{m?.email || '—'}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-sm ${m?.address ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'} border-r border-gray-100 dark:border-gray-700/50`}>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-gray-400 dark:text-gray-500 shrink-0" />
                      <span>{m?.address || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm border-r border-gray-100 dark:border-gray-700/50">
                    {fam.students.length ? (
                      <div className="flex flex-wrap gap-1">
                        {fam.students.map((s) => (
                          <span key={s._id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                            <GraduationCap size={11} />
                            {s.firstName} {s.lastName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(parent)}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
                        title="Edit family">
                        <Pencil size={15} />
                      </button>
                      {f && (
                        <button onClick={() => { if (confirm('Delete father?')) deleteMutation.mutate(f._id); }}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
                          title="Delete father">
                          <Trash2 size={15} />
                        </button>
                      )}
                      {m && (
                        <button onClick={() => { if (confirm('Delete mother?')) deleteMutation.mutate(m._id); }}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
                          title="Delete mother">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}
