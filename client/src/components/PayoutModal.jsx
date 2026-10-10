import React, { useState } from "react";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import { Card, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { X, Building2, Wallet, ShieldCheck, ArrowRight } from "lucide-react";

export const PayoutModal = ({ events = [], onClose, onSuccess }) => {
  const toast = useToast();
  const eligibleEvents = events.filter(
    (ev) => ev.grossRevenue > 0 && ev.payoutStatus === "UNCLAIMED",
  );

  const [selectedEventId, setSelectedEventId] = useState(
    eligibleEvents[0]?.eventId || "",
  );
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedEvent = eligibleEvents.find(
    (e) => e.eventId === selectedEventId,
  );

  const grossRevenue = selectedEvent ? selectedEvent.grossRevenue : 0;
  const platformFee = grossRevenue * 0.05;
  const netAmount = grossRevenue - platformFee;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEventId) {
      toast.warning("Please select an event with eligible revenue");
      return;
    }
    if (!accountHolder || !accountNumber || !ifscCode || !bankName) {
      toast.warning("Please complete all bank settlement details");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("/settlements/request", {
        eventId: selectedEventId,
        accountHolder,
        accountNumber,
        ifscCode,
        bankName,
      });

      if (res.data?.success) {
        toast.success(
          res.data.message || "Payout request submitted successfully!",
        );
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to submit payout request",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <Card className="max-w-lg w-full border-surface-border shadow-2xl bg-surface animate-scale-up max-h-[90vh] flex flex-col">
        <CardBody className="p-6 sm:p-8 space-y-6 overflow-y-auto">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-brand uppercase">
                <Wallet className="w-4 h-4" />
                <span>Club Revenue Settlement</span>
              </div>
              <h3 className="text-xl font-extrabold text-ink mt-1">
                Request Bank Payout
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-ink-subtle hover:text-ink p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-ink-muted">
                Select Event for Settlement
              </label>
              {eligibleEvents.length === 0 ? (
                <div className="p-3 bg-canvas border border-surface-border rounded-xl text-xs text-ink-muted text-center">
                  No events with unclaimed paid ticket revenue found.
                </div>
              ) : (
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full text-xs font-semibold bg-canvas border border-surface-border rounded-xl px-3 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  {eligibleEvents.map((ev) => (
                    <option key={ev.eventId} value={ev.eventId}>
                      {ev.title} — Gross ₹{ev.grossRevenue} (Net ₹
                      {ev.netRevenue.toFixed(2)})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedEvent && (
              <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border space-y-2 text-xs">
                <div className="flex justify-between text-ink-muted">
                  <span>Gross Ticket Sales:</span>
                  <span className="font-semibold text-ink">
                    ₹{grossRevenue.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-ink-muted">
                  <span>Campus Platform Commission (5%):</span>
                  <span className="text-danger">
                    -₹{platformFee.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-surface-border font-bold text-sm">
                  <span className="text-ink">Net Bank Disbursement:</span>
                  <span className="text-success text-base">
                    ₹{netAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3 pt-2 border-t border-surface-border">
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-brand" />
                Receiving Bank Account Details
              </h4>

              <div className="space-y-1">
                <label className="text-xs text-ink-muted font-medium">
                  Account Holder Name
                </label>
                <Input
                  placeholder="e.g. Society of Software Engineers"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-ink-muted font-medium">
                    Account Number
                  </label>
                  <Input
                    placeholder="e.g. 9876543210123"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-ink-muted font-medium">
                    IFSC Code
                  </label>
                  <Input
                    placeholder="e.g. SBIN0001234"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-ink-muted font-medium">
                  Bank & Branch Name
                </label>
                <Input
                  placeholder="e.g. State Bank of India, Campus Branch"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="p-3 bg-brand-subtle border border-brand/30 rounded-xl text-[11px] text-ink-muted flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-brand shrink-0 mt-0.5" />
              <span>
                Disbursements are processed directly by the Campus Finance
                Office via NEFT/IMPS within 2–3 business days.
              </span>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                loading={submitting}
                disabled={eligibleEvents.length === 0}
                icon={ArrowRight}
              >
                Request ₹{netAmount.toFixed(0)} Payout
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};
