import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-sm shadow-emerald-600/20 hover:shadow-md hover:shadow-emerald-600/30 hover:from-emerald-700 hover:to-emerald-800 active:scale-[0.98]',
  secondary:
    'bg-white text-gray-900 border border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md active:scale-[0.98]',
  outline:
    'border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 active:scale-[0.98]',
  ghost:
    'text-gray-700 hover:bg-gray-100 active:scale-[0.98]',
  danger:
    'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm hover:shadow-md active:scale-[0.98]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm rounded-lg',
  md: 'h-11 px-5 text-sm rounded-xl',
  lg: 'h-12 px-6 text-base rounded-xl',
};

const baseClasses =
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2';

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
};

type ButtonAsButton = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps & {
  href: string;
  target?: string;
  rel?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    className,
    children,
    ...rest
  } = props as CommonProps & { href?: string; [key: string]: unknown };

  const classes = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  if ('href' in props && props.href) {
    const { href, target, rel, onClick } = rest as {
      href: string;
      target?: string;
      rel?: string;
      onClick?: React.MouseEventHandler<HTMLAnchorElement>;
    };
    const isExternal = href.startsWith('http') || target === '_blank';
    if (isExternal) {
      return (
        <a
          href={href}
          target={target}
          rel={rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined)}
          onClick={onClick}
          className={classes}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} onClick={onClick}>
        {children}
      </Link>
    );
  }

  const buttonRest = { ...rest } as { href?: string; [key: string]: unknown };
  delete buttonRest.href;
  return (
    <button className={classes} {...buttonRest}>
      {children}
    </button>
  );
}
