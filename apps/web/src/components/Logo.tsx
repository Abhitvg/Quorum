export default function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Abstract orb mark — represents Quo's presence */}
      <div className="relative w-8 h-8 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent to-accent-dark opacity-80" />
        <div className="absolute inset-1 rounded-full bg-surface-900/60 backdrop-blur-sm" />
        <div className="relative w-2 h-2 rounded-full bg-accent-light animate-breathing" />
      </div>
      <span className="text-xl font-semibold tracking-tight text-text-primary">
        Quorum
      </span>
    </div>
  );
}
