import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { PayoutModal } from "../components/PayoutModal";
import { SeatConfigModal } from "../components/SeatConfigModal";
import { VolunteerModal } from "../components/VolunteerModal";
import {
  CalendarPlus,
  Calendar,
  MapPin,
  Trash2,
  ExternalLink,
  Layers,
  Sparkles,
  MessageSquare,
  Star,
  X,
  TrendingUp,
  ThumbsUp,
  AlertCircle,
  FileSpreadsheet,
  Wallet,
  DollarSign,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Building,
  Armchair,
  UserCheck,
} from "lucide-react";

export const ManageEvents = () => {
  const [activeTab, setActiveTab] = useState("events");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportingId, setExportingId] = useState(null);

  const [sentimentModalEvent, setSentimentModalEvent] = useState(null);
  const [sentimentReport, setSentimentReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const [financialData, setFinancialData] = useState(null);
  const [loadingFinance, setLoadingFinance] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  const [seatConfigModalEvent, setSeatConfigModalEvent] = useState(null);

  const [volunteerModalEvent, setVolunteerModalEvent] = useState(null);

  const toast = useToast();

  const fetchClubEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get("/events/admin/my-events");
      if (res.data?.success) {
        setEvents(res.data.events);
      }
    } catch (err) {
      toast.error("Failed to load your club events");
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialSummary = async () => {
    try {
      setLoadingFinance(true);
      const res = await api.get("/settlements/summary");
      if (res.data?.success) {
        setFinancialData(res.data);
      }
    } catch (err) {
      console.warn("Financial summary load notice:", err.message);
    } finally {
      setLoadingFinance(false);
    }
  };

  useEffect(() => {
    fetchClubEvents();
    fetchFinancialSummary();
  }, []);

  const handleMarkCompleted = async (event) => {
    if (
      !window.confirm(
        `Mark "${event.title}" as COMPLETED? This will close all ticket registrations and expire volunteer scanner access.`,
      )
    )
      return;

    try {
      const res = await api.put(`/events/${event._id}`, {
        status: "COMPLETED",
      });
      if (res.data?.success) {
        toast.success(
          `"${event.title}" completed! Volunteer scanner access expired.`,
        );
        fetchClubEvents();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to update event status",
      );
    }
  };

  const handleDeleteEvent = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await api.delete(`/events/${id}`);
      if (res.data?.success) {
        toast.success("Event deleted");
        fetchClubEvents();
        fetchFinancialSummary();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete event");
    }
  };

  const handleExportCSV = async (event) => {
    try {
      setExportingId(event._id);
      const response = await api.get(`/events/${event._id}/attendees/export`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${event.title.replace(/[^a-zA-Z0-9_-]/g, "_")}_Attendees.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Attendee roster exported successfully!");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to export attendee roster",
      );
    } finally {
      setExportingId(null);
    }
  };

  const openSentimentModal = async (event) => {
    setSentimentModalEvent(event);
    setLoadingReport(true);
    setSentimentReport(null);

    try {
      const res = await api.get(`/feedback/event/${event._id}/report`);
      if (res.data?.success) {
        setSentimentReport(res.data);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to load sentiment report",
      );
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12 text-ink">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">
            Club Operations & Settlements
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Manage events, attendee rosters, financial reconciliations, and
            payout disbursements
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/events/create">
            <Button variant="primary" icon={CalendarPlus}>
              Create New Event
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex gap-2 border-b border-surface-border pb-2">
        <button
          onClick={() => setActiveTab("events")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === "events"
              ? "bg-brand text-surface shadow-xs"
              : "text-ink-muted hover:text-ink hover:bg-surface-subtle"
          }`}
        >
          Club Events ({events.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("finance");
            fetchFinancialSummary();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === "finance"
              ? "bg-brand text-surface shadow-xs"
              : "text-ink-muted hover:text-ink hover:bg-surface-subtle"
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          Financial Ledger & Payouts
        </button>
      </div>

      {activeTab === "events" && (
        <>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-28 rounded-xl bg-surface border border-surface-border animate-pulse"
                />
              ))}
            </div>
          ) : events.length === 0 ? (
            <Card className="text-center py-16 bg-surface border-surface-border">
              <CardBody className="space-y-3">
                <Layers className="w-12 h-12 text-ink-subtle mx-auto" />
                <h3 className="text-lg font-bold text-ink">
                  No Events Published
                </h3>
                <p className="text-sm text-ink-muted">
                  You haven't created any events for your club yet.
                </p>
                <Link to="/events/create">
                  <Button variant="primary" size="sm" icon={Sparkles}>
                    Create Your First Event
                  </Button>
                </Link>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const eventDate = new Date(event.date).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  },
                );

                return (
                  <Card
                    key={event._id}
                    hoverEffect
                    className="border-surface-border bg-surface"
                  >
                    <CardBody className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={event.banner}
                          alt={event.title}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-surface-border shrink-0 bg-canvas"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="brand" size="sm">
                              {event.category}
                            </Badge>
                            <Badge
                              variant={
                                event.status === "PUBLISHED"
                                  ? "success"
                                  : "warning"
                              }
                              size="sm"
                            >
                              {event.status}
                            </Badge>
                          </div>
                          <h3 className="font-bold text-base text-ink">
                            {event.title}
                          </h3>
                          <div className="flex items-center gap-4 text-xs text-ink-muted">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-brand" />
                              {eventDate}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-accent" />
                              {event.venue}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-surface-border">
                        <div className="text-right pr-2">
                          <p className="text-xs text-ink-muted font-medium">
                            Capacity
                          </p>
                          <p className="text-sm font-bold text-ink">
                            {event.registeredCount} / {event.capacity}
                          </p>
                          <p className="text-[11px] text-brand font-semibold">
                            {Math.round(
                              (event.registeredCount / event.capacity) * 100,
                            )}
                            % filled
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-xs"
                            title="Export verified attendee roster to CSV"
                            loading={exportingId === event._id}
                            icon={FileSpreadsheet}
                            onClick={() => handleExportCSV(event)}
                          >
                            CSV
                          </Button>

                          {event.status !== "COMPLETED" && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="text-xs text-brand hover:bg-brand-subtle"
                              title="Mark event completed & expire volunteer scanner access"
                              icon={CheckCircle2}
                              onClick={() => handleMarkCompleted(event)}
                            >
                              Complete
                            </Button>
                          )}

                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-xs"
                            title="Assign & manage event volunteers"
                            icon={UserCheck}
                            onClick={() => setVolunteerModalEvent(event)}
                          >
                            Volunteers
                          </Button>

                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-xs"
                            title="Configure auditorium layout & manual seat pricing"
                            icon={Armchair}
                            onClick={() => setSeatConfigModalEvent(event)}
                          >
                            Seating
                          </Button>

                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-xs"
                            icon={Sparkles}
                            onClick={() => openSentimentModal(event)}
                          >
                            AI Sentiment
                          </Button>

                          <Link to={`/events/${event._id}`}>
                            <Button
                              variant="secondary"
                              size="icon"
                              title="View Public Page"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </Link>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-danger hover:bg-danger-bg hover:text-danger"
                            title="Delete Event"
                            onClick={() =>
                              handleDeleteEvent(event._id, event.title)
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === "finance" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-surface-border bg-surface">
              <CardBody className="p-5 space-y-1">
                <span className="text-xs font-semibold uppercase text-ink-muted">
                  Gross Ticket Sales
                </span>
                <p className="text-2xl font-extrabold text-ink">
                  ₹
                  {financialData?.summary?.totalGrossRevenue?.toFixed(2) ||
                    "0.00"}
                </p>
                <span className="text-[11px] text-ink-subtle">
                  Total revenue collected
                </span>
              </CardBody>
            </Card>

            <Card className="border-surface-border bg-surface">
              <CardBody className="p-5 space-y-1">
                <span className="text-xs font-semibold uppercase text-ink-muted">
                  Platform Fee (5%)
                </span>
                <p className="text-2xl font-extrabold text-accent">
                  ₹
                  {financialData?.summary?.totalPlatformFee?.toFixed(2) ||
                    "0.00"}
                </p>
                <span className="text-[11px] text-ink-subtle">
                  Campus maintenance fee
                </span>
              </CardBody>
            </Card>

            <Card className="border-surface-border bg-surface">
              <CardBody className="p-5 space-y-1">
                <span className="text-xs font-semibold uppercase text-ink-muted">
                  Available Balance
                </span>
                <p className="text-2xl font-extrabold text-success">
                  ₹
                  {financialData?.summary?.availableBalance?.toFixed(2) ||
                    "0.00"}
                </p>
                <span className="text-[11px] text-success font-medium">
                  Ready for disbursement
                </span>
              </CardBody>
            </Card>

            <Card className="border-surface-border bg-surface">
              <CardBody className="p-5 space-y-1">
                <span className="text-xs font-semibold uppercase text-ink-muted">
                  Total Disbursed
                </span>
                <p className="text-2xl font-extrabold text-brand">
                  ₹
                  {financialData?.summary?.totalDisbursed?.toFixed(2) || "0.00"}
                </p>
                <span className="text-[11px] text-ink-subtle">
                  Paid to club bank account
                </span>
              </CardBody>
            </Card>
          </div>

          <div className="flex justify-between items-center bg-surface p-4 rounded-xl border border-surface-border">
            <div>
              <h3 className="font-bold text-sm text-ink">
                Club Revenue Disbursements
              </h3>
              <p className="text-xs text-ink-muted">
                Request wire transfer of ticket sales proceeds directly to your
                registered student society bank account.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={ArrowUpRight}
              onClick={() => setShowPayoutModal(true)}
            >
              Request Bank Payout
            </Button>
          </div>

          <Card className="border-surface-border bg-surface">
            <CardBody className="p-5 space-y-4">
              <h3 className="font-bold text-base text-ink">
                Event Revenue Ledger
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-surface-border text-ink-muted uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-3">Event Title</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Tickets Sold</th>
                      <th className="py-2.5 px-3">Gross Revenue</th>
                      <th className="py-2.5 px-3">Net Revenue (95%)</th>
                      <th className="py-2.5 px-3">Payout Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {financialData?.eventBreakdown?.map((ev) => (
                      <tr
                        key={ev.eventId}
                        className="hover:bg-surface-subtle transition-colors"
                      >
                        <td className="py-3 px-3 font-semibold text-ink">
                          {ev.title}
                        </td>
                        <td className="py-3 px-3 text-ink-muted">
                          {new Date(ev.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 font-medium text-ink">
                          {ev.ticketsSold}
                        </td>
                        <td className="py-3 px-3 font-bold text-ink">
                          ₹{ev.grossRevenue.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 font-bold text-success">
                          ₹{ev.netRevenue.toFixed(2)}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ev.payoutStatus === "DISBURSED"
                                ? "bg-success-bg text-success"
                                : ev.payoutStatus === "PENDING"
                                  ? "bg-warning-bg text-warning"
                                  : ev.payoutStatus === "UNCLAIMED"
                                    ? "bg-brand-subtle text-brand"
                                    : "bg-canvas text-ink-subtle"
                            }`}
                          >
                            {ev.payoutStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>

          <Card className="border-surface-border bg-surface">
            <CardBody className="p-5 space-y-4">
              <h3 className="font-bold text-base text-ink">
                Disbursement Request History
              </h3>
              {!financialData?.payouts || financialData.payouts.length === 0 ? (
                <p className="text-xs text-ink-subtle text-center py-6">
                  No payout requests have been submitted yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {financialData.payouts.map((p) => (
                    <div
                      key={p._id}
                      className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-ink">
                            Net ₹{p.netAmount.toFixed(2)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.status === "DISBURSED"
                                ? "bg-success-bg text-success"
                                : p.status === "PENDING"
                                  ? "bg-warning-bg text-warning"
                                  : "bg-danger-bg text-danger"
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-ink-muted">
                          Bank: {p.bankDetails?.bankName} • Acc:{" "}
                          {p.bankDetails?.accountNumber} (
                          {p.bankDetails?.ifscCode})
                        </p>
                        {p.transactionReference && (
                          <p className="text-[10px] font-mono text-brand">
                            Ref: {p.transactionReference}
                          </p>
                        )}
                      </div>
                      <span className="text-[11px] text-ink-subtle">
                        Requested {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {sentimentModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <Card className="max-w-2xl w-full border-surface-border shadow-2xl bg-surface animate-scale-up max-h-[88vh] flex flex-col">
            <CardBody className="p-6 sm:p-8 space-y-6 overflow-y-auto">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-brand">
                    <Sparkles className="w-4 h-4" />
                    <span>Gemini AI Sentiment & Feedback Analysis</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-ink mt-1">
                    {sentimentModalEvent.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSentimentModalEvent(null)}
                  className="text-ink-subtle hover:text-ink p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingReport ? (
                <div className="py-16 text-center text-ink-muted text-sm space-y-3">
                  <Sparkles className="w-8 h-8 text-brand animate-spin mx-auto" />
                  <p>Analyzing attendee reviews with Gemini AI...</p>
                </div>
              ) : sentimentReport ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border">
                      <span className="text-xs text-ink-muted block">
                        Avg Rating
                      </span>
                      <span className="text-xl font-extrabold text-ink mt-0.5 flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 text-accent fill-accent" />
                        {sentimentReport.report?.averageRating || 0}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-success-bg border border-success-border">
                      <span className="text-xs text-success font-semibold block">
                        Positive
                      </span>
                      <span className="text-xl font-extrabold text-success mt-0.5">
                        {sentimentReport.report?.sentimentBreakdown?.positive ||
                          0}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-canvas border border-surface-border">
                      <span className="text-xs text-ink-muted block">
                        Neutral
                      </span>
                      <span className="text-xl font-extrabold text-ink mt-0.5">
                        {sentimentReport.report?.sentimentBreakdown?.neutral ||
                          0}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-danger-bg border border-danger-border">
                      <span className="text-xs text-danger font-semibold block">
                        Critical
                      </span>
                      <span className="text-xl font-extrabold text-danger mt-0.5">
                        {sentimentReport.report?.sentimentBreakdown?.negative ||
                          0}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-brand-subtle border border-brand/30 space-y-2">
                    <h4 className="text-xs font-bold text-brand uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4" />
                      Executive Perception Summary
                    </h4>
                    <p className="text-xs text-ink leading-relaxed font-medium">
                      {sentimentReport.report?.executiveSummary}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border space-y-2">
                      <h4 className="font-bold text-success flex items-center gap-1.5">
                        <ThumbsUp className="w-4 h-4" />
                        Key Highlights & Strengths
                      </h4>
                      <ul className="space-y-1.5 list-disc list-inside text-ink-muted">
                        {(sentimentReport.report?.keyStrengths || []).map(
                          (s, idx) => (
                            <li key={idx}>{s}</li>
                          ),
                        )}
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border space-y-2">
                      <h4 className="font-bold text-accent flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" />
                        Actionable Improvements
                      </h4>
                      <ul className="space-y-1.5 list-disc list-inside text-ink-muted">
                        {(sentimentReport.report?.improvementAreas || []).map(
                          (a, idx) => (
                            <li key={idx}>{a}</li>
                          ),
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-surface-border">
                    <h4 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-brand" />
                      Attendee Reviews ({sentimentReport.feedbacks?.length || 0}
                      )
                    </h4>

                    {!sentimentReport.feedbacks ||
                    sentimentReport.feedbacks.length === 0 ? (
                      <p className="text-xs text-ink-subtle text-center py-4">
                        No written reviews submitted yet for this event.
                      </p>
                    ) : (
                      <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                        {sentimentReport.feedbacks.map((fb) => (
                          <div
                            key={fb._id}
                            className="p-3 rounded-lg bg-surface-subtle border border-surface-border text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-ink">
                                {fb.student?.name || "Student Attendee"}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-accent">
                                  {fb.rating}★
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    fb.sentiment === "POSITIVE"
                                      ? "bg-success-bg text-success"
                                      : fb.sentiment === "NEGATIVE"
                                        ? "bg-danger-bg text-danger"
                                        : "bg-canvas text-ink-muted"
                                  }`}
                                >
                                  {fb.sentiment}
                                </span>
                              </div>
                            </div>
                            {fb.review && (
                              <p className="text-ink-muted italic">
                                "{fb.review}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-ink-muted text-sm">
                  No feedback data available.
                </div>
              )}

              <div className="pt-2 border-t border-surface-border flex justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setSentimentModalEvent(null)}
                >
                  Close Report
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {showPayoutModal && (
        <PayoutModal
          events={financialData?.eventBreakdown || []}
          onClose={() => setShowPayoutModal(false)}
          onSuccess={() => fetchFinancialSummary()}
        />
      )}

      {seatConfigModalEvent && (
        <SeatConfigModal
          event={seatConfigModalEvent}
          onClose={() => setSeatConfigModalEvent(null)}
          onUpdated={() => {
            fetchClubEvents();
          }}
        />
      )}

      {volunteerModalEvent && (
        <VolunteerModal
          event={volunteerModalEvent}
          onClose={() => setVolunteerModalEvent(null)}
          onUpdated={() => {
            fetchClubEvents();
          }}
        />
      )}
    </div>
  );
};
