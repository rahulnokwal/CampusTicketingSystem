import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Ticket,
  Users,
  IndianRupee,
  QrCode,
  Sparkles,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Compass,
  Layers,
} from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard/summary');
        if (res.data?.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse text-ink">
        <div className="h-10 bg-surface rounded w-1/3 border border-surface-border" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-surface rounded-xl border border-surface-border" />
          ))}
        </div>
      </div>
    );
  }

  const role = user?.role || 'student';
  const summary = data?.summary || {};

  return (
    <div className="space-y-8 animate-fade-in pb-12 text-ink">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            {role === 'student' && 'Discover campus happenings and view your verified admission tickets.'}
            {role === 'club_admin' && `Managing events for ${user?.clubName || 'your club'}.`}
            {role === 'volunteer' && 'Stationed for gate entrance verification and QR check-in.'}
            {role === 'super_admin' && 'Campus-wide event infrastructure overview.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {role === 'student' && (
            <Link to="/events">
              <Button variant="primary" icon={Compass}>
                Explore Events
              </Button>
            </Link>
          )}
          {(role === 'club_admin' || role === 'super_admin') && (
            <Link to="/events/create">
              <Button variant="primary" icon={Sparkles}>
                Create Event (AI)
              </Button>
            </Link>
          )}
          {(role === 'volunteer' || role === 'super_admin') && (
            <Link to="/scanner">
              <Button variant="primary" icon={QrCode}>
                Open QR Scanner
              </Button>
            </Link>
          )}
        </div>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {role === 'student' && (
          <>
            <Card hoverEffect className="bg-surface border-surface-border">
              <CardBody className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-ink-muted uppercase">
                    Total Passes Booked
                  </p>
                  <p className="text-2xl font-extrabold text-ink mt-1">
                    {summary.totalTickets || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-brand-subtle border border-brand/30 flex items-center justify-center text-brand">
                  <Ticket className="w-6 h-6" />
                </div>
              </CardBody>
            </Card>

            <Card hoverEffect className="bg-surface border-surface-border">
              <CardBody className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-ink-muted uppercase">
                    Active Passes
                  </p>
                  <p className="text-2xl font-extrabold text-brand mt-1">
                    {summary.activeTickets || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-accent-subtle border border-accent/30 flex items-center justify-center text-accent">
                  <Clock className="w-6 h-6" />
                </div>
              </CardBody>
            </Card>

            <Card hoverEffect className="bg-surface border-surface-border">
              <CardBody className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-ink-muted uppercase">
                    Attended Events
                  </p>
                  <p className="text-2xl font-extrabold text-success mt-1">
                    {summary.checkedInTickets || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-success-bg border border-success-border flex items-center justify-center text-success">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </CardBody>
            </Card>

            <Card hoverEffect className="bg-surface border-surface-border">
              <CardBody className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-ink-muted uppercase">
                    Digital Pass Status
                  </p>
                  <p className="text-base font-bold text-ink mt-1">
                    Verified ID
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-warning-bg border border-warning-border flex items-center justify-center text-warning">
                  <QrCode className="w-6 h-6" />
                </div>
              </CardBody>
            </Card>
          </>
        )}

        {(role === 'club_admin' || role === 'super_admin') && (
          <>
            <Card hoverEffect className="bg-surface border-surface-border">
              <CardBody className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-ink-muted uppercase">
                    Hosted Events
                  </p>
                  <p className="text-2xl font-extrabold text-ink mt-1">
                    {summary.totalEvents || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-brand-subtle border border-brand/30 flex items-center justify-center text-brand">
                  <Layers className="w-6 h-6" />
                </div>
              </CardBody>
            </Card>

            <Card hoverEffect className="bg-surface border-surface-border">
              <CardBody className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-ink-muted uppercase">
                    Total Registrations
                  </p>
                  <p className="text-2xl font-extrabold text-brand mt-1">
                    {summary.totalRegistrations || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-accent-subtle border border-accent/30 flex items-center justify-center text-accent">
                  <Users className="w-6 h-6" />
                </div>
              </CardBody>
            </Card>

            <Card hoverEffect className="bg-surface border-surface-border">
              <CardBody className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-ink-muted uppercase">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-extrabold text-success mt-1">
                    ₹{summary.totalRevenue || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-success-bg border border-success-border flex items-center justify-center text-success">
                  <IndianRupee className="w-6 h-6" />
                </div>
              </CardBody>
            </Card>

            <Card hoverEffect className="bg-surface border-surface-border">
              <CardBody className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-ink-muted uppercase">
                    Attendance Rate
                  </p>
                  <p className="text-2xl font-extrabold text-brand mt-1">
                    {summary.attendanceRate || 0}%
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-brand-subtle border border-brand/30 flex items-center justify-center text-brand">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </CardBody>
            </Card>
          </>
        )}

        {role === 'volunteer' && (
          <>
            <Card hoverEffect className="bg-surface border-surface-border">
              <CardBody className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-ink-muted uppercase">
                    Total Scans
                  </p>
                  <p className="text-2xl font-extrabold text-ink mt-1">
                    {summary.totalScans || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-brand-subtle border border-brand/30 flex items-center justify-center text-brand">
                  <QrCode className="w-6 h-6" />
                </div>
              </CardBody>
            </Card>

            <Card hoverEffect className="bg-surface border-surface-border">
              <CardBody className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-ink-muted uppercase">
                    Valid Admissions
                  </p>
                  <p className="text-2xl font-extrabold text-success mt-1">
                    {summary.validScans || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-success-bg border border-success-border flex items-center justify-center text-success">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </CardBody>
            </Card>

            <Card hoverEffect className="bg-surface border-surface-border">
              <CardBody className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-ink-muted uppercase">
                    Duplicate Blocked
                  </p>
                  <p className="text-2xl font-extrabold text-warning mt-1">
                    {summary.duplicateScans || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-warning-bg border border-warning-border flex items-center justify-center text-warning">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </CardBody>
            </Card>

            <Card hoverEffect className="bg-surface border-surface-border">
              <CardBody className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-ink-muted uppercase">
                    Fraud Rejections
                  </p>
                  <p className="text-2xl font-extrabold text-danger mt-1">
                    {summary.invalidScans || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-danger-bg border border-danger-border flex items-center justify-center text-danger">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </CardBody>
            </Card>
          </>
        )}
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-surface border-surface-border shadow-card">
            <CardBody className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-ink">
                  {role === 'student' && 'Upcoming Registered Events'}
                  {(role === 'club_admin' || role === 'super_admin') && 'Recent Registrations'}
                  {role === 'volunteer' && 'Recent Venue Scans'}
                </h3>
                {role === 'student' && (
                  <Link
                    to="/my-tickets"
                    className="text-xs font-semibold text-brand hover:underline"
                  >
                    View All Passes
                  </Link>
                )}
              </div>

              {role === 'student' && (
                <div className="space-y-3">
                  {data?.recentTickets?.length === 0 ? (
                    <p className="text-xs text-ink-subtle py-4 text-center">
                      No upcoming tickets booked yet.
                    </p>
                  ) : (
                    data?.recentTickets?.map((t) => (
                      <div
                        key={t._id}
                        className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-sm text-ink">
                            {t.event?.title}
                          </p>
                          <p className="text-xs text-ink-muted mt-0.5">
                            {new Date(t.event?.date).toLocaleDateString()} • {t.event?.venue}
                          </p>
                        </div>
                        <Link to="/my-tickets">
                          <Button variant="secondary" size="sm" icon={QrCode}>
                            View Pass
                          </Button>
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              )}

              {(role === 'club_admin' || role === 'super_admin') && (
                <div className="space-y-2.5">
                  {data?.recentRegistrations?.length === 0 ? (
                    <p className="text-xs text-ink-subtle py-4 text-center">
                      No attendee registrations yet.
                    </p>
                  ) : (
                    data?.recentRegistrations?.map((reg) => (
                      <div
                        key={reg._id}
                        className="p-3 rounded-lg bg-surface-subtle border border-surface-border text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold text-ink block">
                            {reg.student?.name} ({reg.student?.email})
                          </span>
                          <span className="text-brand text-[11px] font-medium">
                            {reg.event?.title}
                          </span>
                        </div>
                        <Badge
                          variant={reg.status === 'CHECKED_IN' ? 'success' : 'brand'}
                          size="sm"
                        >
                          {reg.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              )}

              {role === 'volunteer' && (
                <div className="space-y-2.5">
                  {data?.recentScans?.length === 0 ? (
                    <p className="text-xs text-ink-subtle py-4 text-center">
                      No scans executed yet this shift.
                    </p>
                  ) : (
                    data?.recentScans?.map((scan, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-surface-subtle border border-surface-border text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-ink block">
                            Pass #{scan.ticketCode}
                          </span>
                          <span className="text-ink-subtle text-[11px]">
                            {scan.notes || 'Scanned at gate'}
                          </span>
                        </div>
                        <Badge
                          variant={scan.result === 'VALID' ? 'success' : 'danger'}
                          size="sm"
                        >
                          {scan.result}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </div>


        <div className="space-y-6">
          <Card className="bg-surface border-surface-border shadow-card">
            <CardBody className="p-6 space-y-4">
              <h3 className="font-bold text-base text-ink">
                Quick Navigation
              </h3>
              <div className="space-y-2">
                <Link to="/events" className="block">
                  <div className="p-3 rounded-xl bg-surface-subtle hover:bg-canvas border border-surface-border transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <Compass className="w-4 h-4 text-brand" />
                      <span className="text-xs font-semibold text-ink group-hover:text-brand">
                        Explore Event Catalog
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-ink-subtle group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>

                {(role === 'club_admin' || role === 'super_admin') && (
                  <Link to="/manage-events" className="block">
                    <div className="p-3 rounded-xl bg-surface-subtle hover:bg-canvas border border-surface-border transition-all flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <Layers className="w-4 h-4 text-brand" />
                        <span className="text-xs font-semibold text-ink group-hover:text-brand">
                          My Club Events
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-ink-subtle group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                )}

                {(role === 'volunteer' || role === 'super_admin') && (
                  <Link to="/scanner" className="block">
                    <div className="p-3 rounded-xl bg-surface-subtle hover:bg-canvas border border-surface-border transition-all flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <QrCode className="w-4 h-4 text-accent" />
                        <span className="text-xs font-semibold text-ink group-hover:text-accent">
                          Launch Volunteer Scanner
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-ink-subtle group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
