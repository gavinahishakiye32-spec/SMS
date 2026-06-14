import { useState, useEffect, useMemo, useCallback } from 'react';
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
  const [editingSuggestion, setEditingSuggestion] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['suggestions'],
    queryFn: () => API.get('/suggestions?limit=20').then((r) => r.data),
  });

  const suggestions = useMemo(() => data?.data || [], [data]);

  const isUnread = useCallback((s) => !s.readBy?.includes(user?._id), [user]);

  const markReadMutation = useMutation({
    mutationFn: (id) => API.post(`/suggestions/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['suggestions-unread'] });
    },
  });

  useEffect(() => {
    const unread = suggestions.filter((s) => isUnread(s));
    if (unread.length) {
      unread.forEach((s) => markReadMutation.mutate(s._id));
    }
  }, [suggestions, isUnread, markReadMutation]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['suggestions'] });
    queryClient.invalidateQueries({ queryKey: ['suggestions-unread'] });
  };

  const createMutation = useMutation({
    mutationFn: () => API.post('/suggestions', { title, body }),
    onSuccess: () => { invalidateAll(); setShowForm(false); setTitle(''); setBody(''); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, title, body }) => API.put(`/suggestions/${id}`, { title, body }),
    onSuccess: () => { invalidateAll(); setEditingSuggestion(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => API.delete(`/suggestions/${id}`),
    onSuccess: () => invalidateAll(),
  });

  const likeMutation = useMutation({
    mutationFn: (id) => API.post(`/suggestions/${id}/like`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suggestions'] }),
  });

  const commentMutation = useMutation({
    mutationFn: (id) => API.post(`/suggestions/${id}/comment`, { text: commentText }),
    onSuccess: () => { invalidateAll(); setCommentText(''); setCommenting(null); },
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ id, commentId, text }) => API.put(`/suggestions/${id}/comment/${commentId}`, { text }),
    onSuccess: () => { invalidateAll(); setEditingComment(null); },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: ({ id, commentId }) => API.delete(`/suggestions/${id}/comment/${commentId}`),
    onSuccess: () => invalidateAll(),
  });

  const isOwn = (s) => s.authorId?._id === user?._id;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Suggestions Board</h1>
        <button onClick={() => setShowForm(true)} className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-center">+ New Suggestion</button>
      </div>
      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
          <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">New Suggestion</h2>
          <div className="space-y-3">
            <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            <textarea placeholder="Body" value={body} onChange={(e) => setBody(e.target.value)} rows={4}
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            <div className="flex gap-3">
              <button onClick={createMutation.mutate} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Submit</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg dark:hover:bg-gray-600">Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-4">
        {data?.data?.map((s) => (
          <div key={s._id} className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
            {editingSuggestion === s._id ? (
              <div className="space-y-3">
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={4}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                <div className="flex gap-3">
                  <button onClick={() => updateMutation.mutate({ id: s._id, title: editTitle, body: editBody })} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button>
                  <button onClick={() => setEditingSuggestion(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg dark:hover:bg-gray-600">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {isUnread(s) && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" title="Unread" />}
                    <h3 className="font-bold text-gray-900 dark:text-white">{s.title}</h3>
                    <span className="text-xs text-gray-400">{s.authorId?.name} ({s.authorRole})</span>
                    <span className="text-xs text-gray-400 ml-auto">{new Date(s.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{s.body}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <button onClick={() => likeMutation.mutate(s._id)} className="flex items-center gap-1 hover:text-blue-600">
                      {s.likes?.length || 0} Likes
                    </button>
                    <button onClick={() => setCommenting(commenting === s._id ? null : s._id)} className="hover:text-blue-600">
                      Comments ({s.comments?.length || 0})
                    </button>
                    {isOwn(s) && (
                      <>
                        <button onClick={() => { setEditingSuggestion(s._id); setEditTitle(s.title); setEditBody(s.body); }} className="text-blue-500 hover:underline">Edit</button>
                        <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(s._id); }} className="text-red-500 hover:underline">Delete</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            {commenting === s._id && (
              <div className="mt-4 border-t pt-4">
                <div className="space-y-2 mb-3">
                  {s.comments?.map((c) => (
                    <div key={c._id} className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded flex justify-between items-start gap-2">
                      <div className="flex-1">
                        {editingComment === c._id ? (
                          <div className="flex gap-2">
                            <input value={editCommentText} onChange={(e) => setEditCommentText(e.target.value)}
                              className="flex-1 px-2 py-1 border dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                            <button onClick={() => updateCommentMutation.mutate({ id: s._id, commentId: c._id, text: editCommentText })} className="px-2 py-1 bg-blue-600 text-white rounded text-xs">Save</button>
                            <button onClick={() => setEditingComment(null)} className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs dark:hover:bg-gray-600">Cancel</button>
                          </div>
                        ) : (
                          <><strong>{c.userName}:</strong> {c.text}</>
                        )}
                      </div>
                      {c.userId?._id === user?._id && editingComment !== c._id && (
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => { setEditingComment(c._id); setEditCommentText(c.text); }} className="text-blue-500 hover:underline text-xs">Edit</button>
                          <button onClick={() => { if (confirm('Delete comment?')) deleteCommentMutation.mutate({ id: s._id, commentId: c._id }); }} className="text-red-500 hover:underline text-xs">Delete</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={commentText} onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..." className="flex-1 px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
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
