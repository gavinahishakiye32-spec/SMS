import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function SuggestionsPage() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(null);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['suggestions'],
    queryFn: () => API.get('/suggestions?limit=20').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => API.post('/suggestions', { title, body }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['suggestions'] }); setShowForm(false); setTitle(''); setBody(''); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => API.delete(`/suggestions/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suggestions'] }),
  });

  const likeMutation = useMutation({
    mutationFn: (id) => API.post(`/suggestions/${id}/like`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suggestions'] }),
  });

  const commentMutation = useMutation({
    mutationFn: (id) => API.post(`/suggestions/${id}/comment`, { text: commentText }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['suggestions'] }); setCommentText(''); setCommenting(null); },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Suggestions Board</h1>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">+ New Suggestion</button>
      </div>
      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
          <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">New Suggestion</h2>
          <div className="space-y-3">
            <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            <textarea placeholder="Body" value={body} onChange={(e) => setBody(e.target.value)} rows={4}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            <div className="flex gap-3">
              <button onClick={createMutation.mutate} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Submit</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-4">
        {data?.data?.map((s) => (
          <div key={s._id} className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900 dark:text-white">{s.title}</h3>
                  <span className="text-xs text-gray-400">{s.authorId?.name} ({s.authorRole})</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{s.body}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <button onClick={() => likeMutation.mutate(s._id)} className="flex items-center gap-1 hover:text-blue-600">
                    {s.likes?.length || 0} Likes
                  </button>
                  <button onClick={() => setCommenting(commenting === s._id ? null : s._id)} className="hover:text-blue-600">
                    Comments ({s.comments?.length || 0})
                  </button>
                  {(s.authorId?._id === user?._id || user?.role === 'superadmin') && (
                    <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(s._id); }} className="text-red-500 hover:underline">Delete</button>
                  )}
                </div>
              </div>
            </div>
            {commenting === s._id && (
              <div className="mt-4 border-t pt-4">
                <div className="space-y-2 mb-3">
                  {s.comments?.map((c, i) => (
                    <div key={i} className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      <strong>{c.userName}:</strong> {c.text}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={commentText} onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..." className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                  <button onClick={() => commentMutation.mutate(s._id)} className="px-3 py-2 bg-blue-600 text-white rounded-lg">Post</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
