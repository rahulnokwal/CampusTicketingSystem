import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { FeedbackModal } from "../components/FeedbackModal";
import {
  Ticket,
  QrCode,
  Calendar,
  MapPin,
  X,
  Armchair,
  Award,
  Star,
  FileDown,
  Receipt,
} from "lucide-react";

export const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [feedbackTicket, setFeedbackTicket] = useState(null);
  const [downloadingCertId, setDownloadingCertId] = useState(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);
  const [reviewedTickets, setReviewedTickets] = useState({});
  const toast = useToast();

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get("/registrations/my-tickets");
      if (res.data?.success) {
        setTickets(res.data.tickets);
      }
    } catch (err) {
      toast.error("Failed to load your tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCancelTicket = async (ticketId) => {
    if (!window.confirm("Are you sure you want to cancel this event ticket?"))
      return;

    try {
      const res = await api.delete(`/registrations/${ticketId}`);
      if (res.data?.success) {
        toast.success("Registration cancelled");
        setSelectedTicket(null);
        fetchTickets();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel ticket");
    }
  };

  const handleDownloadCertificate = async (ticket) => {
    try {
      setDownloadingCertId(ticket._id);
      const response = await api.get(`/certificates/${ticket._id}/download`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Certificate-${ticket.ticketCode}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Certificate downloaded successfully!");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Could not download certificate",
      );
    } finally {
      setDownloadingCertId(null);
    }
  };

  const handleDownloadInvoice = async (ticket) => {
    try {
      setDownloadingInvoiceId(ticket._id);
      const response = await api.get(`/payments/${ticket._id}/invoice`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `TaxInvoice-${ticket.ticketCode}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Tax invoice receipt downloaded!");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Could not download invoice receipt",
      );
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "CHECKED_IN":
        return (
          <Badge variant="success" dot>
            Checked In
          </Badge>
        );
      case "BOOKED":
        return (
          <Badge variant="brand" dot>
            Valid Pass
          </Badge>
        );
      case "CANCELLED":
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12 text-ink">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">
          My Event Tickets
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Present your QR code pass at venue entrances, download certificates,
          and share feedback
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-48 rounded-xl bg-surface border border-surface-border animate-pulse"
            />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Card className="text-center py-16 bg-surface border-surface-border">
          <CardBody className="space-y-3">
            <Ticket className="w-12 h-12 text-ink-subtle mx-auto" />
            <h3 className="text-lg font-bold text-ink">No Active Passes</h3>
            <p className="text-sm text-ink-muted">
              You haven't registered for any upcoming events yet.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tickets.map((ticket) => {
            const event = ticket.event;
            const eventDate = event
              ? new Date(event.date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "N/A";

            const isCheckedIn = ticket.status === "CHECKED_IN";
            const isReviewed = reviewedTickets[ticket._id];

            return (
              <Card
                key={ticket._id}
                hoverEffect
                className="border-surface-border bg-surface flex flex-col justify-between overflow-hidden"
              >
                <CardBody className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-brand">
                        {event?.club || "Campus Event"}
                      </span>
                      <h3 className="font-bold text-lg text-ink mt-0.5">
                        {event?.title || "Unknown Event"}
                      </h3>
                    </div>
                    {getStatusBadge(ticket.status)}
                  </div>

                  <div className="space-y-1.5 text-xs text-ink-muted pt-2 border-t border-surface-border">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-brand shrink-0" />
                      <span>{eventDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-accent shrink-0" />
                      <span className="truncate">{event?.venue}</span>
                    </div>
                    {ticket.seatLabel && (
                      <div className="flex items-center gap-2 text-ink font-semibold">
                        <Armchair className="w-4 h-4 text-brand shrink-0" />
                        <span>Seat: {ticket.seatLabel}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 font-mono text-[11px] text-ink-subtle pt-1">
                      <span>Pass ID: {ticket.ticketCode}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-surface-border">
                    <div className="flex items-center justify-between gap-3">
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        icon={QrCode}
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        Show QR Pass
                      </Button>
                      {ticket.status === "BOOKED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-danger hover:text-danger hover:bg-danger-bg"
                          onClick={() => handleCancelTicket(ticket._id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>

                    {isCheckedIn && (
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1 text-xs"
                          loading={downloadingCertId === ticket._id}
                          icon={Award}
                          onClick={() => handleDownloadCertificate(ticket)}
                        >
                          Certificate (PDF)
                        </Button>
                        <Button
                          variant={isReviewed ? "secondary" : "primary"}
                          size="sm"
                          className="flex-1 text-xs"
                          icon={Star}
                          onClick={() => setFeedbackTicket(ticket)}
                        >
                          {isReviewed ? "Feedback Given" : "Rate Event"}
                        </Button>
                      </div>
                    )}

                    {event?.price > 0 && (
                      <div className="pt-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full text-xs"
                          icon={Receipt}
                          loading={downloadingInvoiceId === ticket._id}
                          onClick={() => handleDownloadInvoice(ticket)}
                        >
                          Tax Invoice & Receipt (PDF)
                        </Button>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <Card className="max-w-sm w-full border-brand/40 shadow-glow bg-surface animate-scale-up text-center">
            <CardBody className="p-6 sm:p-8 space-y-6 relative">
              <button
                onClick={() => setSelectedTicket(null)}
                className="absolute top-4 right-4 text-ink-subtle hover:text-ink p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <span className="text-xs font-semibold text-brand uppercase tracking-wider">
                  Campus Admission Pass
                </span>
                <h3 className="text-lg font-bold text-ink mt-1">
                  {selectedTicket.event?.title}
                </h3>
                <div className="mt-2">
                  {getStatusBadge(selectedTicket.status)}
                </div>
              </div>

              {selectedTicket.seatLabel && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-subtle text-brand border border-brand/30 text-xs font-bold">
                  <Armchair className="w-3.5 h-3.5" />
                  Seat: {selectedTicket.seatLabel}
                </div>
              )}

              {selectedTicket.qrDataUrl ? (
                <div className="bg-white p-4 rounded-2xl w-56 h-56 mx-auto shadow-md flex items-center justify-center border-4 border-brand/30">
                  <img
                    src={selectedTicket.qrDataUrl}
                    alt="Ticket QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-56 h-56 mx-auto flex items-center justify-center bg-surface-subtle rounded-2xl">
                  <QrCode className="w-16 h-16 text-ink-subtle animate-pulse" />
                </div>
              )}

              <div className="space-y-1">
                <p className="font-mono text-xs font-bold text-brand tracking-wider">
                  {selectedTicket.ticketCode}
                </p>
                <p className="text-[11px] text-ink-muted">
                  Present this QR code on your phone screen at the venue gate.
                </p>
              </div>

              {selectedTicket.status === "CHECKED_IN" && (
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  icon={FileDown}
                  loading={downloadingCertId === selectedTicket._id}
                  onClick={() => handleDownloadCertificate(selectedTicket)}
                >
                  Download Certificate PDF
                </Button>
              )}

              {selectedTicket.event?.price > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  icon={Receipt}
                  loading={downloadingInvoiceId === selectedTicket._id}
                  onClick={() => handleDownloadInvoice(selectedTicket)}
                >
                  Download Tax Invoice & Receipt
                </Button>
              )}

              <div className="pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => setSelectedTicket(null)}
                >
                  Close Pass
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {feedbackTicket && (
        <FeedbackModal
          ticket={feedbackTicket}
          onClose={() => setFeedbackTicket(null)}
          onSuccess={(fb) => {
            setReviewedTickets((prev) => ({
              ...prev,
              [feedbackTicket._id]: true,
            }));
          }}
        />
      )}
    </div>
  );
};
