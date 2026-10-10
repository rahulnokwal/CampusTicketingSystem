import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Compass,
  Ticket,
  CalendarPlus,
  QrCode,
  LayoutDashboard,
  LogOut,
  Layers,
} from "lucide-react";
import { BrandLogo } from "../ui/BrandLogo";

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, isClubAdmin, isVolunteer } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      show: true,
    },
    {
      to: "/events",
      label: "Explore Events",
      icon: Compass,
      show: true,
    },
    {
      to: "/my-tickets",
      label: "My Tickets",
      icon: Ticket,
      show: user?.role === "student" || user?.role === "super_admin",
    },
    {
      to: "/manage-events",
      label: "My Club Events",
      icon: Layers,
      show: isClubAdmin,
    },
    {
      to: "/events/create",
      label: "Create Event (AI)",
      icon: CalendarPlus,
      show: isClubAdmin,
    },
    {
      to: "/scanner",
      label: "Volunteer Scanner",
      icon: QrCode,
      show: isVolunteer,
    },
  ];

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-surface border-r border-surface-border flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <BrandLogo />
            <div>
              <span className="font-extrabold text-base tracking-tight text-ink block">
                CAMPUS<span className="text-brand">LIFE</span>
              </span>
              <span className="text-[10px] text-ink-subtle font-mono uppercase tracking-wider block">
                Events & Tickets
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? "bg-brand text-brand-fg shadow-glow font-semibold"
                        : "text-ink-muted hover:text-ink hover:bg-surface-subtle"
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
        </nav>

        <div className="p-4 border-t border-surface-border bg-surface-subtle">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="overflow-hidden pr-2">
              <p className="text-sm font-semibold text-ink truncate">
                {user?.name}
              </p>
              <p className="text-xs text-brand font-medium truncate capitalize">
                {user?.role?.replace("_", " ")}
                {user?.clubName ? ` • ${user.clubName}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg text-danger hover:bg-danger-bg border border-transparent hover:border-danger-border transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
