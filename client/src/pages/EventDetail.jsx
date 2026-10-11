import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { SeatMap } from "../components/SeatMap";
import {
  Calendar,
  MapPin,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  QrCode,
  Building2,
  Lock,
  Wallet,
  Clock,
  ChevronRight,
  Armchair,
  HeartHandshake,
} from "lucide-react";

export const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [confirmedTicket, setConfirmedTicket] = useState(null);
  const [razorpayReady, setRazorpayReady] = useState(false);

  const [customAmountInput, setCustomAmountInput] = useState("");
  const [enableCustomAmount, setEnableCustomAmount] = useState(false);

  const [seats, setSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [heldSeatId, setHeldSeatId] = useState(null);
  const [holdExpiry, setHoldExpiry] = useState(null);
  const [holdCountdown, setHoldCountdown] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState("summary");
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!holdExpiry) {
      setHoldCountdown(null);
      return;
    }

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(holdExpiry).getTime() - Date.now()) / 1000),
      );
      setHoldCountdown(remaining);
      if (remaining === 0) {
        clearInterval(timerRef.current);
        setSelectedSeat(null);
        setHeldSeatId(null);
        setHoldExpiry(null);
        toast.error("Seat hold expired. Please choose a seat again.");
        if (id) fetchSeats(id);
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [holdExpiry, id]);

  useEffect(() => {
    if (window.Razorpay) {
      setRazorpayReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayReady(true);
    script.onerror = () =>
      console.warn("Razorpay SDK could not be loaded from CDN.");
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/events/${id}`);
      if (res.data?.success) {
        setEvent(res.data.event);
      }
    } catch (err) {
      toast.error("Failed to load event details");
    } finally {
      setLoading(false);
    }
  };

  const fetchSeats = async (eventId) => {
    setLoadingSeats(true);
    try {
      const res = await api.get(`/seats/event/${eventId}`);
      if (res.data?.success) {
        setSeats(res.data.seats || []);
      }
    } catch (err) {
      console.warn("Seat map fetch notice:", err.message);
    } finally {
      setLoadingSeats(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const handleRegisterClick = async () => {
    if (!isAuthenticated) {
      toast.info("Please sign in or create an account to register");
      navigate("/login");
      return;
    }

    setShowCheckoutModal(true);
    if (event?.requiresSeatSelection) {
      setCheckoutStep("seats");
      await fetchSeats(event._id);
    } else {
      setCheckoutStep("summary");
    }
  };

  const handleSeatSelect = async (seat) => {
    if (!seat) {
      if (heldSeatId) {
        try {
          await api.post(`/seats/release/${heldSeatId}`);
        } catch (e) {}
      }
      setSelectedSeat(null);
      setHeldSeatId(null);
      setHoldExpiry(null);
      if (event?._id) fetchSeats(event._id);
      return;
    }

    try {
      const res = await api.post("/seats/hold", {
        eventId: event._id,
        seatId: seat._id,
      });

      if (res.data?.success) {
        setSelectedSeat(seat);
        setHeldSeatId(seat._id);
        setHoldExpiry(res.data.heldUntil);
        toast.success(`Seat ${seat.seatLabel} held for 5 minutes!`);
        fetchSeats(event._id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not hold seat");
    }
  };

  const basePrice =
    selectedSeat && typeof selectedSeat.tierPrice === "number"
      ? selectedSeat.tierPrice
      : event?.price || 0;

  const customNum = Number(customAmountInput);
  const activePaymentAmount =
    enableCustomAmount && !isNaN(customNum) && customNum >= basePrice
      ? customNum
      : basePrice;

  const handleLaunchRazorpayGateway = async () => {
    try {
      setCheckoutLoading(true);

      const orderPayload = {
        eventId: event._id,
        seatId: selectedSeat?._id,
      };

      if (enableCustomAmount && !isNaN(customNum) && customNum >= basePrice) {
        orderPayload.customAmount = customNum;
      }

      const orderRes = await api.post("/payments/order", orderPayload);
      const order = orderRes.data?.order;

      if (!order) {
        throw new Error("Could not create payment order");
      }

      if (
        window.Razorpay &&
        order.keyId &&
        !order.keyId.includes("test_campuslife")
      ) {
        const options = {
          key: order.keyId,
          amount: order.amountInPaise,
          currency: "INR",
          name: "Campus Life",
          description: `Ticket: ${event.title}`,
          image:
            "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=100&auto=format&fit=crop&q=80",
          order_id: order.gatewayOrderId,
          handler: async function (response) {
            try {
              const verifyRes = await api.post("/payments/verify", {
                eventId: event._id,
                seatId: selectedSeat?._id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                customAmount: order.amount,
              });

              if (verifyRes.data?.success) {
                setConfirmedTicket(verifyRes.data.ticket);
                toast.success("Payment verified! Admission pass issued.");
                fetchEvent();
              }
            } catch (vErr) {
              toast.error(
                vErr.response?.data?.message || "Payment verification failed",
              );
            }
          },
          prefill: {
            name: user?.name,
            email: user?.email,
          },
          theme: {
            color: "#4CA1E2",
          },
          modal: {
            ondismiss: function () {
              setCheckoutLoading(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        setCheckoutLoading(false);
        return;
      }

      const verifyRes = await api.post("/payments/verify", {
        eventId: event._id,
        seatId: selectedSeat?._id,
        razorpay_order_id: order.gatewayOrderId,
        razorpay_payment_id: `pay_test_${Date.now()}_simulated`,
        razorpay_signature: "test_sandbox_signature",
        customAmount: order.amount,
      });

      if (verifyRes.data?.success) {
        setConfirmedTicket(verifyRes.data.ticket);
        toast.success("Payment verified! Admission pass issued.");
        fetchEvent();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Payment failed",
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleFreeRegistration = async () => {
    if (enableCustomAmount && customNum > 0) {
      await handleLaunchRazorpayGateway();
      return;
    }

    try {
      setCheckoutLoading(true);
      const regRes = await api.post("/registrations", {
        eventId: event._id,
        seatId: selectedSeat?._id,
      });
      if (regRes.data?.success) {
        setConfirmedTicket(regRes.data.ticket);
        toast.success("Free registration confirmed!");
        fetchEvent();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to complete registration",
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowCheckoutModal(false);
    if (heldSeatId) {
      api.post(`/seats/release/${heldSeatId}`).catch(() => {});
    }
    setSelectedSeat(null);
    setHeldSeatId(null);
    setHoldExpiry(null);
    setEnableCustomAmount(false);
    setCustomAmountInput("");
    setCheckoutStep("summary");
  };

  const formatCountdown = (secs) => {
    if (secs === null || secs === undefined) return "";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-6 animate-pulse text-ink">
        <div className="h-72 bg-surface rounded-2xl border border-surface-border" />
        <div className="h-8 bg-surface rounded w-2/3" />
        <div className="h-24 bg-surface rounded" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20 text-ink">
        <h2 className="text-xl font-bold text-ink">Event Not Found</h2>
        <Link
          to="/events"
          className="text-brand hover:underline mt-2 inline-block"
        >
          Return to Events
        </Link>
      </div>
    );
  }

  const isSoldOut = event.registeredCount >= event.capacity;
  const isCompleted = event.status === "COMPLETED";
  const isDeadlinePassed =
    event.registrationDeadline &&
    new Date() > new Date(event.registrationDeadline);
  const isRegistrationClosed = isSoldOut || isCompleted || isDeadlinePassed;

  const eventDate = new Date(event.date).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const deadlineFormatted = event.registrationDeadline
    ? new Date(event.registrationDeadline).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12 text-ink">
      <Link
        to="/events"
        className="inline-flex items-center gap-2 text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to all events
      </Link>

      <div className="relative rounded-2xl overflow-hidden border border-surface-border shadow-card bg-surface">
        <img
          src={event.banner}
          alt={event.title}
          className="w-full h-64 sm:h-96 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="brand">{event.category}</Badge>
              {isCompleted ? (
                <Badge variant="warning">Event Completed</Badge>
              ) : isDeadlinePassed ? (
                <Badge variant="danger">Registration Closed</Badge>
              ) : isSoldOut ? (
                <Badge variant="danger">Sold Out</Badge>
              ) : (
                <Badge variant="success">Seats Available</Badge>
              )}
              {event.requiresSeatSelection ? (
                <Badge variant="accent">Reserved Seating</Badge>
              ) : (
                <Badge variant="secondary">General Admission</Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-surface leading-tight">
              {event.title}
            </h1>
            <p className="text-sm font-semibold text-brand flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              Organized by {event.club}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-surface border-surface-border shadow-card">
            <CardBody className="p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-ink mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand" />
                  About This Event
                </h3>
                <div className="text-sm text-ink-muted leading-relaxed whitespace-pre-line">
                  {event.description}
                </div>
              </div>

              <div className="pt-6 border-t border-surface-border grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-subtle border border-surface-border">
                  <Calendar className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-ink-muted uppercase">
                      Date & Time
                    </p>
                    <p className="text-xs font-medium text-ink mt-0.5">
                      {eventDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-subtle border border-surface-border">
                  <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-ink-muted uppercase">
                      Venue Location
                    </p>
                    <p className="text-xs font-medium text-ink mt-0.5">
                      {event.venue}
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-24 border-brand/40 shadow-glow bg-surface">
            <CardBody className="p-6 space-y-5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                  Admission Ticket
                </span>
                <div className="text-3xl font-extrabold text-ink mt-1">
                  {event.price === 0 ? (
                    <span className="text-success">Free Entry</span>
                  ) : (
                    <span>₹{event.price}</span>
                  )}
                </div>
              </div>

              <div className="space-y-2 py-3 border-y border-surface-border text-xs">
                <div className="flex justify-between text-ink-muted">
                  <span>Registered Capacity</span>
                  <span className="font-semibold text-ink">
                    {event.registeredCount} / {event.capacity}
                  </span>
                </div>
                <div className="w-full bg-canvas rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isSoldOut ? "bg-danger" : "bg-brand"
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        (event.registeredCount / event.capacity) * 100,
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-ink-subtle text-right">
                  {event.capacity - event.registeredCount} spots remaining
                </p>
              </div>

              <div className="space-y-3">
                {deadlineFormatted && !isCompleted && (
                  <div
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                      isDeadlinePassed
                        ? "bg-danger-bg border-danger-border text-danger"
                        : "bg-surface-subtle border-surface-border text-ink-muted"
                    }`}
                  >
                    <span>Registration Cutoff:</span>
                    <span className="font-bold text-ink">
                      {deadlineFormatted}
                    </span>
                  </div>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={isRegistrationClosed}
                  onClick={handleRegisterClick}
                >
                  {isCompleted
                    ? "Event Completed"
                    : isDeadlinePassed
                      ? "Registration Expired"
                      : isSoldOut
                        ? "Event Sold Out"
                        : event.requiresSeatSelection
                          ? "Select Seat & Register"
                          : event.price === 0
                            ? "Claim Free Pass"
                            : `Book Pass (from ₹${event.price})`}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-ink-subtle">
                  <ShieldCheck className="w-4 h-4 text-success" />
                  <span>Encrypted QR admission pass issued</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {showCheckoutModal && !confirmedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <Card className="max-w-2xl w-full border-surface-border shadow-2xl bg-surface animate-scale-up max-h-[90vh] flex flex-col">
            <CardBody className="p-6 sm:p-8 space-y-5 overflow-y-auto">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-ink">
                    {checkoutStep === "seats"
                      ? "Select Your Seat"
                      : "Checkout & Payment"}
                  </h3>
                  <p className="text-xs text-ink-muted mt-1">{event.title}</p>
                </div>
                <Badge
                  variant={activePaymentAmount === 0 ? "success" : "accent"}
                >
                  {activePaymentAmount === 0
                    ? "Free"
                    : `₹${activePaymentAmount}`}
                </Badge>
              </div>

              {checkoutStep === "seats" && (
                <div className="space-y-4">
                  {holdCountdown !== null && holdCountdown > 0 && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-brand-subtle border border-brand/30 text-xs font-semibold text-brand">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 animate-spin" />
                        <span>
                          Hold expires in {formatCountdown(holdCountdown)}
                        </span>
                      </div>
                      {selectedSeat && (
                        <span className="text-ink">
                          Seat #{selectedSeat.seatLabel} ({selectedSeat.section}{" "}
                          - ₹{selectedSeat.tierPrice})
                        </span>
                      )}
                    </div>
                  )}

                  {loadingSeats ? (
                    <div className="py-12 text-center text-ink-muted text-sm animate-pulse">
                      Loading interactive auditorium map...
                    </div>
                  ) : (
                    <SeatMap
                      seats={seats}
                      onSeatSelect={handleSeatSelect}
                      selectedSeatId={selectedSeat?._id}
                      heldByMeId={user?.userId || user?._id}
                    />
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-surface-border">
                    <Button variant="secondary" onClick={handleCloseModal}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      disabled={!selectedSeat && seats.length > 0}
                      onClick={() => setCheckoutStep("summary")}
                      icon={ChevronRight}
                    >
                      Continue with{" "}
                      {selectedSeat
                        ? `Seat ${selectedSeat.seatLabel}`
                        : "Registration"}
                    </Button>
                  </div>
                </div>
              )}

              {checkoutStep === "summary" && (
                <div className="space-y-5">
                  <div className="bg-surface-subtle p-4 rounded-xl space-y-2.5 text-xs border border-surface-border">
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Attendee:</span>
                      <span className="font-semibold text-ink">
                        {user?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Email:</span>
                      <span className="font-semibold text-ink">
                        {user?.email}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Venue:</span>
                      <span className="text-ink font-medium">
                        {event.venue}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Admission Type:</span>
                      <span className="text-ink font-semibold">
                        {event.requiresSeatSelection
                          ? "Assigned Seat"
                          : "General Admission"}
                      </span>
                    </div>
                    {selectedSeat && (
                      <div className="flex justify-between items-center bg-surface p-2 rounded-lg border border-surface-border">
                        <span className="text-ink-muted flex items-center gap-1.5 font-semibold">
                          <Armchair className="w-4 h-4 text-brand" />
                          Reserved Seat:
                        </span>
                        <span className="font-bold text-accent">
                          {selectedSeat.seatLabel} ({selectedSeat.section}) — ₹
                          {selectedSeat.tierPrice}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-surface-border">
                      <span className="text-ink-muted font-semibold">
                        Base Price:
                      </span>
                      <span className="font-bold text-sm text-ink">
                        {basePrice === 0 ? "₹0.00 (Free)" : `₹${basePrice}.00`}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HeartHandshake className="w-4 h-4 text-brand" />
                        <div>
                          <p className="text-xs font-bold text-ink">
                            Custom Contribution / Pay-What-You-Want
                          </p>
                          <p className="text-[11px] text-ink-muted">
                            Support the student club or event with a higher
                            custom payment (min: ₹{basePrice})
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableCustomAmount}
                          onChange={(e) => {
                            setEnableCustomAmount(e.target.checked);
                            if (e.target.checked && !customAmountInput) {
                              setCustomAmountInput(
                                basePrice > 0 ? basePrice.toString() : "50",
                              );
                            }
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-canvas border border-surface-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand"></div>
                      </label>
                    </div>

                    {enableCustomAmount && (
                      <div className="pt-2 border-t border-surface-border flex items-center gap-3">
                        <span className="text-xs font-bold text-ink">
                          Enter Amount: ₹
                        </span>
                        <input
                          type="number"
                          min={basePrice}
                          value={customAmountInput}
                          onChange={(e) => setCustomAmountInput(e.target.value)}
                          placeholder={`Min ₹${basePrice}`}
                          className="w-32 bg-surface text-ink font-bold text-sm px-3 py-1.5 rounded-lg border border-surface-border focus:border-brand outline-none"
                        />
                        {customNum < basePrice && (
                          <span className="text-[11px] text-danger font-medium">
                            Must be ≥ ₹{basePrice}
                          </span>
                        )}
                        {customNum >= basePrice && (
                          <span className="text-[11px] text-success font-medium">
                            Valid custom amount
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center bg-surface p-3.5 rounded-xl border border-surface-border">
                    <span className="text-xs font-bold text-ink uppercase tracking-wider">
                      Total Payable:
                    </span>
                    <span className="font-extrabold text-xl text-ink">
                      ₹{activePaymentAmount.toFixed(2)}
                    </span>
                  </div>

                  {activePaymentAmount > 0 ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-brand-subtle border border-brand/30 rounded-xl text-xs space-y-1">
                        <div className="flex items-center gap-2 font-semibold text-brand">
                          <CreditCard className="w-4 h-4" />
                          <span>Razorpay Payment Gateway Ready</span>
                        </div>
                        <p className="text-[11px] text-ink-muted">
                          Supports UPI (GPay, PhonePe, Paytm), Credit/Debit
                          Cards, NetBanking, and Campus Wallets.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-ink-subtle">
                        <Lock className="w-3.5 h-3.5 text-success" />
                        <span>
                          256-bit SSL encrypted • Cryptographic HMAC
                          verification
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-success-bg border border-success-border rounded-xl text-xs text-success font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        Complimentary campus pass. No payment required.
                      </span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    {event.requiresSeatSelection && seats.length > 0 ? (
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => setCheckoutStep("seats")}
                      >
                        Change Seat
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={handleCloseModal}
                      >
                        Cancel
                      </Button>
                    )}

                    {activePaymentAmount === 0 ? (
                      <Button
                        variant="primary"
                        className="flex-1"
                        loading={checkoutLoading}
                        onClick={handleFreeRegistration}
                      >
                        Confirm Free Pass
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        className="flex-1"
                        disabled={enableCustomAmount && customNum < basePrice}
                        loading={checkoutLoading}
                        onClick={handleLaunchRazorpayGateway}
                        icon={Wallet}
                      >
                        Pay ₹{activePaymentAmount} & Issue Pass
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {confirmedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <Card className="max-w-md w-full border-brand/40 shadow-glow bg-surface animate-scale-up text-center">
            <CardBody className="p-6 sm:p-8 space-y-6">
              <div className="w-14 h-14 rounded-full bg-success-bg border border-success-border text-success mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-ink">
                  Ticket Confirmed!
                </h3>
                <p className="text-xs text-ink-muted mt-1">
                  Your admission ticket has been generated and sent to{" "}
                  {user?.email}.
                </p>
              </div>

              {confirmedTicket.seatLabel && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-subtle text-brand border border-brand/30 text-sm font-bold">
                  <Armchair className="w-4 h-4" />
                  Reserved Seat: {confirmedTicket.seatLabel}
                </div>
              )}

              {confirmedTicket.qrDataUrl && (
                <div className="bg-white p-4 rounded-2xl w-48 h-48 mx-auto shadow-md flex items-center justify-center border-4 border-brand/30">
                  <img
                    src={confirmedTicket.qrDataUrl}
                    alt="Ticket QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <div className="font-mono text-xs text-brand font-bold tracking-wider">
                PASS #{confirmedTicket.ticketCode}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowCheckoutModal(false);
                    setConfirmedTicket(null);
                  }}
                >
                  Close
                </Button>
                <Link to="/my-tickets" className="flex-1">
                  <Button variant="primary" className="w-full" icon={QrCode}>
                    View In My Tickets
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};
