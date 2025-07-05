'use client';

import { useState } from 'react';

interface ComposerProps {
  onPost: (text: string) => Promise<void>;
}

export function Composer({ onPost }: ComposerProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    await onPost(text.trim());
    setText('');
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="border rounded p-4 shadow-sm mb-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What's happening?"
        rows={3}
        className="w-full p-2 border rounded resize-none"
      />
      <div className="mt-2 text-right">
        <button
          type="submit"
          disabled={!text.trim() || loading}
          className="bg-blue-600 text-white px-4 py-1 rounded disabled:opacity-50"
        >
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  );
}
