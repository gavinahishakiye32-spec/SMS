import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function SchoolSettingsPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [schoolName, setSchoolName] = useState('');
  const [logoFile, setLogoFile] = useState(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['school-settings'],
    queryFn: () => API.get('/settings').then((r) => r.data.data),
  });

  const updateMutation = useMutation({
    mutationFn: (formData) => API.put('/settings', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-settings'] });
      addToast('Settings saved!', 'success');
    },
    onError: (err) => addToast(err.response?.data?.message || 'Error saving settings', 'error'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('schoolName', schoolName || settings?.schoolName);
    if (logoFile) formData.append('logo', logoFile);
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">School Settings</h1>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">School Name</label>
            <input value={schoolName ?? settings?.schoolName ?? ''} onChange={(e) => setSchoolName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Enter school name" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">School Logo</label>
            {settings?.logo && (
              <img src={settings.logo} alt="School Logo" className="h-20 w-20 object-contain mb-2 rounded-lg border" />
            )}
            <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])}
              className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400" />
          </div>
          <button type="submit" disabled={updateMutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
