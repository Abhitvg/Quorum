'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/Logo';
import Button from '@/components/Button';

/* ========== Scroll Reveal Hook ========== */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

/* ========== Animated Counter ========== */
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const duration = 1800;
        const startTime = Date.now();
        const tick = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease-out
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(eased * target));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) return null;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* ========== Ambient Background ========== */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden bg-[#000000]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-mesh rounded-full blur-[150px] opacity-15" />
        <div className="absolute top-0 left-0 w-full h-full dot-grid opacity-50" />
      </div>

      {/* ========== Navigation ========== */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-surface-900/80 backdrop-blur-2xl border-b border-white/5 shadow-elevation-2'
          : 'bg-transparent'
      }`}>
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
          <Logo />
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-text-muted">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ========== Hero Section ========== */}
      <main className="flex-1 flex flex-col items-center pt-36 md:pt-44 pb-24 px-4 relative z-10">
        <div className="max-w-5xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-accent/20 bg-accent/10 text-accent-light text-xs tracking-wider uppercase font-bold mb-8 animate-spring-up-1 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <span className="w-2 h-2 rounded-full bg-accent-light animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            Introducing Quo, the AI participant
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-[7rem] font-bold tracking-tighter mb-8 animate-spring-up-2 leading-[0.9]">
            <span className="text-white drop-shadow-2xl">
              Meetings where
            </span>
            <br />
            <span className="text-mesh">
              nobody has to guess.
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-lg md:text-2xl text-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed animate-spring-up-3 font-medium">
            Quorum is the first video platform with a real AI participant in every room.
            Ask questions, check facts, and get sourced answers — live.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 animate-spring-up-4">
            <Link href="/register">
              <Button size="lg" className="text-lg px-10 h-14 w-full sm:w-auto shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                Start for free
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="secondary" size="lg" className="text-lg px-10 h-14 w-full sm:w-auto glass-strong">
                See how it works
              </Button>
            </Link>
          </div>
        </div>

        {/* ========== Product Mockup ========== */}
        <div className="mt-24 md:mt-28 w-full max-w-6xl animate-spring-up border-glow rounded-3xl" style={{ animationDelay: '0.6s' }}>
          <div className="aspect-[16/10] rounded-3xl glass-premium shadow-[0_20px_80px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden relative">
            {/* Mac window controls */}
            <div className="absolute top-0 left-0 w-full h-12 bg-surface-900/90 border-b border-white/5 flex items-center px-4 gap-2 z-20">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
              <span className="ml-4 text-xs text-text-muted font-medium">Quorum — Team Standup</span>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[10px] text-accent-light font-mono bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">🔒 E2EE</span>
              </div>
            </div>

            {/* Meeting Grid Mockup */}
            <div className="absolute inset-0 pt-12 p-4 grid grid-cols-3 grid-rows-2 gap-4 bg-[#030303]">
              <MockupTile name="Sarah" gradient="from-rose-500 to-pink-600" />
              <MockupTile name="Alex" gradient="from-blue-500 to-indigo-600" />
              <AgentMockupTile />
              <MockupTile name="James" gradient="from-emerald-500 to-teal-600" />
              <MockupTile name="Priya" gradient="from-violet-500 to-purple-600" />
              {/* Chat panel mockup */}
              <div className="glass-premium rounded-xl flex flex-col p-4 overflow-hidden relative">
                <div className="text-[10px] font-bold text-accent-light mb-3 uppercase tracking-widest relative z-10">Transcript</div>
                <div className="flex-1 space-y-3 overflow-hidden relative z-10">
                  <ChatBubble name="Sarah" text="What were last quarter's results?" delay={0} />
                  <ChatBubble name="Quo" text="Q2 revenue was $4.2M, up 18% YoY. Gross margin improved to 72%." isAgent delay={1} />
                  <ChatBubble name="Alex" text="Can you pull up the source?" delay={2} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ========== Stats Section ========== */}
      <StatsSection />

      {/* ========== How It Works ========== */}
      <HowItWorksSection />

      {/* ========== Features Section ========== */}
      <FeaturesSection />

      {/* ========== Testimonials ========== */}
      <TestimonialsSection />

      {/* ========== Final CTA ========== */}
      <section className="relative z-10 py-32 px-4 bg-mesh bg-fixed">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-3xl" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight drop-shadow-2xl">
            Ready to meet smarter?
          </h2>
          <p className="text-xl md:text-2xl text-text-secondary mb-12 max-w-2xl mx-auto font-medium">
            Start your first AI-powered meeting in under 60 seconds.
            No credit card, no complex setup.
          </p>
          <Link href="/register">
            <Button size="lg" className="text-xl px-12 h-16 shadow-glow border-glow">
              Get started — it&apos;s free
            </Button>
          </Link>
        </div>
      </section>

      {/* ========== Footer ========== */}
      <footer className="relative z-10 border-t border-white/10 py-16 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-12">
            <div>
              <Logo size="sm" />
              <p className="text-sm text-text-muted mt-3 max-w-xs leading-relaxed">
                The first video conferencing platform with a real AI participant in every room.
              </p>
            </div>
            <div className="flex gap-16">
              <div>
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Product</h4>
                <div className="flex flex-col gap-3 text-sm text-text-secondary">
                  <a href="#features" className="hover:text-white transition-colors">Features</a>
                  <a href="#" className="hover:text-white transition-colors">Pricing</a>
                  <a href="#" className="hover:text-white transition-colors">Security</a>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Company</h4>
                <div className="flex flex-col gap-3 text-sm text-text-secondary">
                  <a href="#" className="hover:text-white transition-colors">About</a>
                  <a href="#" className="hover:text-white transition-colors">Blog</a>
                  <a href="#" className="hover:text-white transition-colors">Careers</a>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Legal</h4>
                <div className="flex flex-col gap-3 text-sm text-text-secondary">
                  <a href="#" className="hover:text-white transition-colors">Privacy</a>
                  <a href="#" className="hover:text-white transition-colors">Terms</a>
                  <a href="#" className="hover:text-white transition-colors">DPA</a>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 mt-12 pt-8 flex items-center justify-between">
            <span className="text-xs text-text-muted">© {new Date().getFullYear()} Quorum. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <span className="text-xs text-text-muted">SOC 2 Compliant</span>
              <span className="text-[10px] text-accent-light font-mono bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">🔒 E2EE</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ========== Stats Section ========== */
function StatsSection() {
  const ref = useReveal();
  return (
    <section className="relative z-10 py-20 border-y border-white/5 bg-surface-900/50">
      <div ref={ref} className="reveal max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {[
            { value: 10000, suffix: '+', label: 'Meetings Hosted' },
            { value: 50000, suffix: '+', label: 'Active Users' },
            { value: 99, suffix: '.9%', label: 'Uptime' },
            { value: 150, suffix: '+', label: 'Countries' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-sm text-text-muted font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========== How It Works ========== */
function HowItWorksSection() {
  const ref = useReveal();
  const steps = [
    { num: '01', title: 'Create a room', description: 'Start a meeting in one click. Share the link with your team.', icon: '🚀' },
    { num: '02', title: 'Quo joins automatically', description: 'Your AI participant appears, listens, and understands context in real-time.', icon: '🤖' },
    { num: '03', title: 'Ask anything, get sourced answers', description: 'Just say "Hey Quo" — get instant answers with citations from your connected data.', icon: '💡' },
  ];

  return (
    <section id="how-it-works" className="relative z-10 py-32 px-4 bg-[#030303]">
      <div className="max-w-6xl mx-auto">
        <div ref={ref} className="reveal text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Three steps. That&apos;s it.
          </h2>
          <p className="text-text-secondary text-xl max-w-2xl mx-auto leading-relaxed">
            No integrations, no setup wizards, no AI training required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-[1px] bg-gradient-to-r from-accent/30 via-indigo/30 to-accent/30" />

          {steps.map((step, i) => (
            <StepCard key={step.num} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({ step, index }: { step: { num: string; title: string; description: string; icon: string }; index: number }) {
  const ref = useReveal();
  return (
    <div ref={ref} className="reveal text-center" style={{ transitionDelay: `${index * 150}ms` }}>
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl glass-premium border border-accent/20 flex items-center justify-center text-3xl relative z-10 bg-surface-900">
        {step.icon}
      </div>
      <span className="text-xs font-bold text-accent-light uppercase tracking-widest mb-3 block">{step.num}</span>
      <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed max-w-xs mx-auto">{step.description}</p>
    </div>
  );
}

/* ========== Features Section ========== */
function FeaturesSection() {
  const ref = useReveal();
  const features = [
    {
      icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>,
      title: 'AI that listens',
      description: 'Quo transcribes, understands context, and recognizes when it\'s being addressed. Just say its name.',
      accent: 'from-cyan-500/20 to-blue-500/20',
    },
    {
      icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      title: 'Sourced answers',
      description: 'Every response comes with citations. No hallucinations — just verifiable facts pulled from your connected data.',
      accent: 'from-indigo-500/20 to-purple-500/20',
    },
    {
      icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
      title: 'End-to-end encrypted',
      description: 'Your conversations stay yours. E2EE, no training on your data, SOC 2 compliant infrastructure.',
      accent: 'from-emerald-500/20 to-teal-500/20',
    },
    {
      icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
      title: 'Spatial audio & whispers',
      description: 'Hear participants as if they\'re in the room. Break into whisper groups for side conversations.',
      accent: 'from-amber-500/20 to-orange-500/20',
    },
    {
      icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
      title: 'Collaborative whiteboard',
      description: 'Draw, diagram, and brainstorm together on an infinite canvas. No third-party app required.',
      accent: 'from-rose-500/20 to-pink-500/20',
    },
    {
      icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      title: 'Live polls & mood checks',
      description: 'Instant pulse checks, live polls, and speaker stats. Know how your team is feeling in real-time.',
      accent: 'from-violet-500/20 to-fuchsia-500/20',
    },
  ];

  return (
    <section id="features" className="relative z-10 py-32 px-4 bg-[#050505] border-t border-white/5">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-500/5 blur-[150px] pointer-events-none" />
      <div className="max-w-6xl mx-auto relative z-10">
        <div ref={ref} className="reveal text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            A real participant, not a sidebar widget
          </h2>
          <p className="text-text-secondary text-xl max-w-3xl mx-auto leading-relaxed">
            Quo joins your meeting as a participant. It listens, understands context,
            and speaks up with sourced answers when asked.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, index }: { feature: { icon: React.ReactNode; title: string; description: string; accent: string }; index: number }) {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      className="reveal glass-premium rounded-2xl p-7 hover-lift group"
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.accent} border border-white/5 flex items-center justify-center text-accent-light mb-5 group-hover:shadow-glow transition-shadow duration-300`}>
        {feature.icon}
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{feature.title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
    </div>
  );
}

/* ========== Testimonials ========== */
function TestimonialsSection() {
  const ref = useReveal();
  const testimonials = [
    { name: 'Sarah Chen', role: 'VP Product, Synthwave', quote: 'Quo replaced our note-taker, fact-checker, and follow-up bot. One AI participant does what three integrations couldn\'t.', avatar: 'SC' },
    { name: 'Marcus Rivera', role: 'CTO, NexaTech', quote: 'The E2E encryption and on-prem data policy made it an easy security review. Our CISO signed off in a day.', avatar: 'MR' },
    { name: 'Aisha Patel', role: 'Design Lead, Orbital', quote: 'The whiteboard + spatial audio combo makes remote design crits feel like being in the same room. Game changer.', avatar: 'AP' },
  ];

  return (
    <section id="testimonials" className="relative z-10 py-32 px-4 bg-[#020202] border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div ref={ref} className="reveal text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Loved by forward-thinking teams
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.name} testimonial={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial, index }: { testimonial: { name: string; role: string; quote: string; avatar: string }; index: number }) {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      className="reveal glass-premium rounded-2xl p-7 flex flex-col"
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      <div className="text-3xl text-white/10 font-serif mb-4">&ldquo;</div>
      <p className="text-sm text-text-secondary leading-relaxed flex-1 italic">{testimonial.quote}</p>
      <div className="flex items-center gap-3 mt-6 pt-5 border-t border-white/5">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-indigo flex items-center justify-center text-white text-xs font-bold">
          {testimonial.avatar}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{testimonial.name}</p>
          <p className="text-xs text-text-muted">{testimonial.role}</p>
        </div>
      </div>
    </div>
  );
}

/* ========== Sub-Components ========== */

function MockupTile({ name, gradient }: { name: string; gradient: string }) {
  return (
    <div className="bg-surface-800/80 rounded-xl border border-border-subtle relative overflow-hidden flex items-center justify-center group/tile">
      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-semibold text-sm md:text-base shadow-lg`}>
        {name.charAt(0)}
      </div>
      <div className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-medium text-white flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        {name}
      </div>
    </div>
  );
}

function AgentMockupTile() {
  return (
    <div className="bg-indigo-950/50 rounded-xl border border-accent/20 relative overflow-hidden flex flex-col items-center justify-center">
      <div className="relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-accent/20 animate-orb-expand" />
        <div className="absolute inset-2 rounded-full border border-accent/15 animate-orb-expand" style={{ animationDelay: '1s' }} />
        <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-br from-accent to-accent-dark animate-breathe" />
      </div>
      <div className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-medium text-accent-light flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-accent-light animate-pulse" />
        Quo
      </div>
    </div>
  );
}

function ChatBubble({ name, text, isAgent = false, delay = 0 }: { name: string; text: string; isAgent?: boolean; delay?: number }) {
  return (
    <div className="animate-fade-in" style={{ animationDelay: `${delay * 0.5 + 1}s` }}>
      <span className={`text-[9px] md:text-[10px] font-semibold ${isAgent ? 'text-accent-light' : 'text-text-secondary'}`}>
        {name}
      </span>
      <p className={`text-[8px] md:text-[10px] leading-snug mt-0.5 ${isAgent ? 'text-text-primary' : 'text-text-secondary'}`}>
        {text}
      </p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useRevealDefault() {
  return useReveal();
}
