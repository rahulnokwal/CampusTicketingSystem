import React from 'react';

export const Card = ({
  children,
  className = '',
  hoverEffect = false,
  glow = false,
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-surface border border-surface-border rounded-xl shadow-card transition-all duration-300 text-ink
        ${hoverEffect ? 'hover:border-brand/40 hover:-translate-y-0.5 hover:shadow-lg' : ''}
        ${glow ? 'shadow-glow border-brand/50 ring-1 ring-brand/30' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`p-5 border-b border-surface-border text-ink ${className}`}>{children}</div>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={`p-5 text-ink ${className}`}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`p-5 pt-0 border-t border-surface-border text-ink ${className}`}>{children}</div>
);
