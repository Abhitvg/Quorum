interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const sizeMap = {
  sm: { orb: 'w-6 h-6', inner: 'inset-0.5', dot: 'w-1.5 h-1.5', text: 'text-base' },
  md: { orb: 'w-8 h-8', inner: 'inset-1', dot: 'w-2 h-2', text: 'text-xl' },
  lg: { orb: 'w-12 h-12', inner: 'inset-1.5', dot: 'w-3 h-3', text: 'text-2xl' },
};

export default function Logo({ className = '', size = 'md', showText = true }: LogoProps) {
  const s = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 group ${className}`}>
      {/* Abstract orb mark — represents Quo's presence */}
      <div className={`relative ${s.orb} flex items-center justify-center`}>
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent to-accent-dark opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
        <div className={`absolute ${s.inner} rounded-full bg-surface-900/60 backdrop-blur-sm`} />
        <div className={`relative ${s.dot} rounded-full bg-accent-light animate-breathing group-hover:animate-pulse-glow transition-all duration-300`} />
      </div>
      {showText && (
        <span className={`${s.text} font-semibold tracking-tight text-text-primary`}>
          Quorum
        </span>
      )}
    </div>
  );
}
