import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';

export const Topbar = ({ onToggleSidebar }) => {
  const { user } = useAuth();

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'super_admin':
        return 'accent';
      case 'club_admin':
        return 'brand';
      case 'volunteer':
        return 'warning';
      default:
        return 'success';
    }
  };

  return (
    <header className="h-16 w-full bg-surface/90 backdrop-blur-md border-b border-surface-border sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between text-ink shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-subtle lg:hidden cursor-pointer"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2 text-xs text-ink-subtle">
          <span className="inline-block w-2 h-2 rounded-full bg-success animate-pulse"></span>
          <span>Campus Gateway Online</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <Badge variant={getRoleBadgeVariant(user.role)} size="sm">
            {user.role?.replace('_', ' ')}
          </Badge>
        )}

        <div className="flex items-center gap-2 pl-2 border-l border-surface-border">
          <div className="w-8 h-8 rounded-full bg-brand-subtle border border-brand/30 flex items-center justify-center text-brand font-semibold text-xs">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <span className="text-sm font-medium text-ink hidden md:inline-block">
            {user?.name}
          </span>
        </div>
      </div>
    </header>
  );
};
