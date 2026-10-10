import React from 'react';

export const BrandLogo = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14',
  };

  const iconSizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  };

  const containerClass = sizeMap[size] || sizeMap.md;
  const iconClass = iconSizeMap[size] || iconSizeMap.md;

  return (
    <div
      className={`${containerClass} rounded-xl bg-gradient-to-br from-brand via-brand to-brand-dark flex items-center justify-center text-white shadow-md shadow-brand/25 shrink-0 ${className}`}
    >
      <svg
        className={`${iconClass} text-white`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Modern Event Admission Ticket with Perforation & Notch */}
        <path d="M3 9a2.5 2.5 0 0 1 0 6v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2a2.5 2.5 0 0 1 0-6V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" />
        <path d="M13 5v2" strokeDasharray="1.5 1.5" />
        <path d="M13 11v2" strokeDasharray="1.5 1.5" />
        <path d="M13 17v2" strokeDasharray="1.5 1.5" />
        {/* Ticket Center Star / Seal */}
        <polygon points="8.5,8.5 9.5,11 12,11.5 10,13 10.5,15.5 8.5,14 6.5,15.5 7,13 5,11.5 7.5,11" fill="currentColor" />
      </svg>
    </div>
  );
};

