import * as React from 'react';
import { cn } from '@/lib/utils';

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
  glass?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
};

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive, glass, padding = 'md', children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl border bg-white shadow-sm transition-all duration-200',
          glass && 'bg-white/80 backdrop-blur-sm',
          paddingMap[padding],
          interactive && 'hover:shadow-lg hover:-translate-y-0.5 hover:border-emerald-200 cursor-pointer',
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    );
  },
);
Card.displayName = 'Card';

export function CardHeader({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-3', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-semibold text-[var(--ink)]', className)} {...rest}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...rest }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-[var(--ink-soft)]', className)} {...rest}>
      {children}
    </p>
  );
}
