import React from 'react';

export const Input = ({
  label,
  error,
  helperText,
  icon: Icon,
  className = '',
  containerClassName = '',
  id,
  type = 'text',
  ...props
}) => {
  const inputId = id || props.name || Math.random().toString(36).substring(7);

  return (
    <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold tracking-wide text-ink-muted uppercase"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 pointer-events-none text-ink-subtle">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          className={`w-full bg-surface border rounded-lg py-2.5 text-sm text-ink placeholder:text-ink-subtle transition-all duration-200 outline-none
            ${Icon ? 'pl-10 pr-3.5' : 'px-3.5'}
            ${
              error
                ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
                : 'border-surface-border hover:border-ink-subtle focus:border-brand focus:ring-2 focus:ring-brand/20'
            }
            disabled:opacity-50 disabled:bg-canvas disabled:cursor-not-allowed
            ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-xs text-danger font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-ink-subtle">{helperText}</p>
      ) : null}
    </div>
  );
};
