import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';

const TABS = [
  { key: '', label: 'All', roles: ['superadmin'] },
  { key: 'schooladmin', label: 'School Admins', roles: ['superadmin'] },
  { key: 'teacher', label: 'Teachers', roles: ['superadmin', 'schooladmin'] },
];

export default function UsersPage() {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleTab, setRoleTab] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'teacher' });
  const queryClient = useQueryClient();

  const roleParam = roleTab ? `&role=${roleTab}` : '';
  const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
  const { data } = useQuery({
    queryKey: ['users', page, roleTab, search],
    queryFn: () => API.get(`/users?page=${page}&limit=10${roleParam}${searchParam}`).then((r) => r.data),
  });

  const visibleTabs = TABS.filter((t) => t.roles.includes(user?.role));

  const createMutation = useMutation({
    mutationFn: () => API.post('/users', form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowForm(false);
      setForm({ name: '', email: '', password: '', role: 'teacher' });
      addToast('User created successfully', 'success');
    },
    onError: (err) => addToast(err.response?.data?.message || 'Error creating user', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: () => API.put(`/users/${editing}`, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', email: '', password: '', role: 'teacher' });
      addToast('User updated successfully', 'success');
    },
    onError: (err) => addToast(err.response?.data?.message || 'Error updating user', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => API.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      addToast('User deleted', 'success');
    },
    onError: (err) => addToast(err.response?.data?.message || 'Error deleting user', 'error'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const handleEdit = (u) => {
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
    setEditing(u._id);
    setShowForm(true);
  };

  const users = data?.data;
  const roleColors = {
    superadmin: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    schooladmin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
    teacher: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    student: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {visibleTabs.map((tab) => (
            <button key={tab.key} onClick={() => { setRoleTab(tab.key); setPage(1); setSearch(''); }}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                roleTab === tab.key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', email: '', password: '', role: roleTab || 'teacher' }); }}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Create {roleTab ? TABS.find((t) => t.key === roleTab)?.label.slice(0, -1) || 'User' : 'User'}
        </button>
      </div>

      <input type="text" placeholder="Search by name or email..." value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="w-full sm:w-72 px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-6 w-full max-w-md mx-2 sm:mx-0" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{editing ? 'Edit User' : 'Create User'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" required />
              <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" required />
              {!editing && (
                <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" required />
              )}
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="schooladmin">School Admin</option>
                <option value="teacher">Teacher</option>
              </select>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editing ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg dark:hover:bg-gray-600">
                  Cancel
                </button>
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
                <th scope="col" className="text-left p-3">Email</th>
                <th scope="col" className="text-left p-3">Role</th>
                <th scope="col" className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users?.length === 0 ? (
                <tr><td colSpan="4" className="p-4 text-center text-gray-500 dark:text-gray-400">No users found</td></tr>
              ) : users?.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="p-3 font-medium text-gray-900 dark:text-white">{u.name}</td>
                  <td className="p-3 text-gray-700 dark:text-gray-300">{u.email}</td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${roleColors[u.role] || 'bg-gray-100 text-gray-700'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      {user?.role === 'superadmin' && u.role !== 'superadmin' && (
                        <button onClick={() => handleEdit(u)} className="text-blue-600 hover:underline text-xs">Edit</button>
                      )}
                      {user?.role === 'superadmin' && u.role === 'superadmin' && u._id !== user._id && (
                        <span className="text-xs text-gray-400">Protected</span>
                      )}
                      {user?.role === 'superadmin' && u.role !== 'superadmin' && (
                        <button onClick={() => { if (confirm('Delete this user?')) deleteMutation.mutate(u._id); }} className="text-red-600 hover:underline text-xs">Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data?.pagination && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <span>Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border dark:border-gray-600 rounded-lg disabled:opacity-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Prev</button>
            <button disabled={page >= data.pagination.totalPages} onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border dark:border-gray-600 rounded-lg disabled:opacity-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
