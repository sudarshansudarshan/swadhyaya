import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
  showWordmark?: boolean;
  variant?: 'dark' | 'light';
};

export function Logo({ className, showWordmark = true, variant = 'dark' }: LogoProps) {
  const textColor = variant === 'dark' ? 'text-[var(--ink)]' : 'text-white';
  const accent = 'text-[var(--primary)]';

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-9 w-9 shrink-0"
        aria-label="Swadhyaya logo"
      >
        <defs>
          <linearGradient id="logo-bg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#1F6F5C" />
            <stop offset="1" stopColor="#7B5EA7" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="36" height="36" rx="9" fill="url(#logo-bg)" />
        <path
          d="M9 11.5c0-.6.4-1 1-1 2.8 0 5.5 1 7.5 2.8v12.4C15.5 24 12.8 23 10 23c-.6 0-1-.4-1-1V11.5z"
          fill="#FAF5E8"
        />
        <path
          d="M27 11.5c0-.6-.4-1-1-1-2.8 0-5.5 1-7.5 2.8v12.4c2-1.7 4.7-2.7 7.5-2.7.6 0 1-.4 1-1V11.5z"
          fill="#FAF5E8"
          opacity="0.85"
        />
        <circle cx="18" cy="9.5" r="1.6" fill="#B8860B" />
        <path
          d="M18 6.5v3M15.5 8l2.5 1.5L20.5 8"
          stroke="#B8860B"
          strokeWidth="0.9"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span className={cn('text-lg font-bold tracking-tight', textColor)}>
            Swadhyaya
          </span>
          <span className={cn('text-[10px] font-medium tracking-wider uppercase', accent)}>
            self-study
          </span>
        </div>
      )}
    </div>
  );
}
