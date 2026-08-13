'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md glass-strong rounded-2xl p-8 relative z-10 animate-fade-in shadow-card border border-border-medium">
        <div className="flex flex-col items-center mb-8">
          <Logo className="mb-6 scale-125" />
          <h1 className="text-2xl font-semibold text-text-primary mb-2">Welcome back</h1>
          <p className="text-text-secondary text-sm">Sign in to your Quorum workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="p-3 rounded-lg bg-status-error/10 border border-status-error/20 text-status-error text-sm text-center">
              {error}
            </div>
          )}

          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Button type="submit" className="w-full mt-2" loading={loading}>
            Sign in
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-text-secondary">
          Don't have an account?{' '}
          <Link href="/register" className="text-accent hover:text-accent-light font-medium transition-colors">
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}
