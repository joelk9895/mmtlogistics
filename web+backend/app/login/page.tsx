'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        // Redirect based on role
        if (data.user.role === 'ADMIN') router.push('/admin');
        else if (data.user.role === 'DRIVER') router.push('/driver');
        else if (data.user.role === 'CUSTOMER') router.push('/customer');
        else router.push('/');
      } else {
        const data = await res.json();
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-md p-8 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[var(--accent)] rounded-xl mx-auto flex items-center justify-center text-white text-xl font-bold mb-4">
            M
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Welcome back</h1>
          <p className="text-sm text-[var(--muted)] mt-2">Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/40 outline-none focus:border-[var(--accent)] transition-colors"
              placeholder="admin@mmt.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/40 outline-none focus:border-[var(--accent)] transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-[var(--destructive)] font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--foreground)] text-[var(--background)] font-medium text-sm px-4 py-2 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 mt-4"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
