'use client';

import { useState } from 'react';

interface UserModalProps {
  isOpen: boolean;
  onSubmit: (name: string) => void;
  loading?: boolean;
}

export default function UserModal({ isOpen, onSubmit, loading = false }: UserModalProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-gray-700 rounded-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold text-white mb-4">
          Welcome to Feeds Demo
        </h2>
        <p className="text-gray-300 mb-6">
          Please enter your name to get started. This will create your user profile.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              autoFocus
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Profile...' : 'Get Started'}
          </button>
        </form>
      </div>
    </div>
  );
} 