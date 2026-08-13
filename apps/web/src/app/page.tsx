'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/Logo';
import Button from '@/components/Button';

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) return null;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Abstract background elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none translate-y-1/3 -translate-x-1/4" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full">
        <Logo />
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button variant="primary">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10 -mt-20">
        <div className="max-w-4xl animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-accent-light text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-accent-light animate-pulse-glow" />
            Introducing Quo, the AI participant
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 mb-6">
            Meetings where<br />nobody has to guess.
          </h1>
          
          <p className="text-xl md:text-2xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            Quorum is the first video platform with a real AI participant in every room. Ask questions, check facts, and get sourced answers live.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                Start for free
              </Button>
            </Link>
          </div>
        </div>

        {/* Mockup UI representation */}
        <div className="mt-20 w-full max-w-5xl aspect-video rounded-2xl glass-strong shadow-2xl border border-border-medium overflow-hidden relative">
          {/* Mac window controls */}
          <div className="absolute top-0 left-0 w-full h-12 bg-surface-900/80 border-b border-border-subtle flex items-center px-4 gap-2 z-20">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          
          {/* Fake grid */}
          <div className="absolute inset-0 pt-12 p-4 grid grid-cols-2 grid-rows-2 gap-4">
            <div className="bg-surface-800 rounded-lg border border-border-subtle" />
            <div className="bg-surface-800 rounded-lg border border-border-subtle flex items-center justify-center">
              <Logo className="scale-150 opacity-50" />
            </div>
            <div className="bg-surface-800 rounded-lg border border-border-subtle" />
            <div className="bg-surface-800 rounded-lg border border-border-subtle" />
          </div>
        </div>
      </main>
    </div>
  );
}
