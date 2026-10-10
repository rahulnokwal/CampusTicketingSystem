import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const variants = {
    default: 'bg-surface-subtle text-ink-muted border-surface-border',
    brand: 'bg-brand-subtle text-brand border-brand/30',
    accent: 'bg-accent-subtle text-accent border-accent/30',
    success: 'bg-success-bg text-success border-success-border',
    warning: 'bg-warning-bg text-warning border-warning-border',
    danger: 'bg-danger-bg text-danger border-danger-border',
  };

  const dotColors = {
    default: 'bg-ink-subtle',
    brand: 'bg-brand',
    accent: 'bg-accent',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border tracking-wide uppercase ${
        variants[variant] || variants.default
      } ${sizes[size] || sizes.md} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full animate-pulse ${
            dotColors[variant] || dotColors.default
          }`}
        />
      )}
      {children}
    </span>
  );
};
