import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import { Card, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import {
  Users,
  UserPlus,
  Trash2,
  X,
  Mail,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export const VolunteerModal = ({ event, onClose, onUpdated }) => {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVolunteers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/events/${event._id}`);
      if (res.data?.success && res.data.event) {
        setVolunteers(res.data.event.volunteers || []);
      }
    } catch (err) {
      console.warn("Could not fetch event volunteers:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteers();
  }, [event._id]);

  const handleAssignVolunteer = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter a volunteer student email");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post(`/events/${event._id}/volunteers`, {
        email: email.trim(),
      });
      if (res.data?.success) {
        toast.success(res.data.message || "Volunteer assigned successfully!");
        setEmail("");
        setVolunteers(res.data.volunteers || []);
        onUpdated();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign volunteer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveVolunteer = async (volunteerId, volunteerName) => {
    if (
      !window.confirm(
        `Revoke scanner pass and remove "${volunteerName}" from this event?`,
      )
    )
      return;

    try {
      const res = await api.delete(
        `/events/${event._id}/volunteers/${volunteerId}`,
      );
      if (res.data?.success) {
        toast.success("Volunteer access revoked");
        setVolunteers(res.data.volunteers || []);
        onUpdated();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove volunteer");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <Card className="max-w-md w-full border-surface-border shadow-2xl bg-surface animate-scale-up">
        <CardBody className="p-6 sm:p-8 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-brand uppercase tracking-wider">
                <Users className="w-4 h-4" />
                <span>Event Volunteer Staff</span>
              </div>
              <h3 className="text-xl font-extrabold text-ink mt-1">
                {event.title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-ink-subtle hover:text-ink p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3.5 bg-surface-subtle rounded-xl border border-surface-border text-xs text-ink-muted">
            Assigned volunteers are authorized to scan QR admission passes for
            this event. Once the event completes, their scanner access
            automatically expires.
          </div>

          <form onSubmit={handleAssignVolunteer} className="space-y-3">
            <Input
              label="Assign Volunteer by Student Email"
              type="email"
              icon={Mail}
              placeholder="student@campus.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="w-full"
              loading={submitting}
              icon={UserPlus}
            >
              Authorize Scanner Pass
            </Button>
          </form>

          <div className="space-y-3 pt-2 border-t border-surface-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand" />
              Authorized Volunteers ({volunteers.length})
            </h4>

            {loading ? (
              <div className="py-6 text-center text-xs text-ink-muted animate-pulse">
                Loading volunteers...
              </div>
            ) : volunteers.length === 0 ? (
              <p className="text-xs text-ink-subtle text-center py-4">
                No volunteers assigned yet. (Admins retain universal scanner
                permissions).
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {volunteers.map((vol) => (
                  <div
                    key={vol._id || vol}
                    className="p-2.5 rounded-xl bg-surface-subtle border border-surface-border flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-ink">
                        {vol.name || "Volunteer"}
                      </p>
                      <p className="text-[11px] text-ink-muted">{vol.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveVolunteer(
                          vol._id || vol,
                          vol.name || "Volunteer",
                        )
                      }
                      className="p-1.5 text-ink-subtle hover:text-danger rounded cursor-pointer"
                      title="Revoke volunteer access"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2 border-t border-surface-border">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
