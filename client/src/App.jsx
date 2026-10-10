import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { AppLayout } from "./layouts/AppLayout";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { EventBrowse } from "./pages/EventBrowse";
import { EventDetail } from "./pages/EventDetail";
import { MyTickets } from "./pages/MyTickets";
import { CreateEvent } from "./pages/CreateEvent";
import { ManageEvents } from "./pages/ManageEvents";
import { VolunteerScanner } from "./pages/VolunteerScanner";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas text-canvas-fg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-canvas-fg-muted">
            Verifying session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(user.role) &&
    user.role !== "super_admin"
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/events" element={<EventBrowse />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/my-tickets" element={<MyTickets />} />

        <Route
          path="/events/create"
          element={
            <ProtectedRoute allowedRoles={["club_admin"]}>
              <CreateEvent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manage-events"
          element={
            <ProtectedRoute allowedRoles={["club_admin"]}>
              <ManageEvents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/scanner"
          element={
            <ProtectedRoute allowedRoles={["volunteer", "club_admin"]}>
              <VolunteerScanner />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/events" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
