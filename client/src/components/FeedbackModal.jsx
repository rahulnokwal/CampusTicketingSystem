import React, { useState } from "react";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import { Card, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Star, X, Sparkles, MessageSquare } from "lucide-react";

const RATING_LABELS = {
  1: "Poor — Needs Major Improvement",
  2: "Fair — Met Basic Expectations",
  3: "Good — Enjoyable Experience",
  4: "Very Good — Well Organized",
  5: "Excellent — Outstanding Event!",
};

export const FeedbackModal = ({ ticket, onClose, onSuccess }) => {
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      toast.warning("Please select a star rating");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("/feedback", {
        registrationId: ticket._id,
        rating,
        review,
      });

      if (res.data?.success) {
        toast.success(res.data.message || "Feedback submitted successfully!");
        if (onSuccess) onSuccess(res.data.feedback);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <Card className="max-w-md w-full border-surface-border shadow-2xl bg-surface animate-scale-up">
        <CardBody className="p-6 sm:p-8 space-y-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-ink-subtle hover:text-ink p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-brand">
              <Sparkles className="w-4 h-4" />
              <span>Post-Event Feedback & AI Sentiment</span>
            </div>
            <h3 className="text-xl font-extrabold text-ink mt-1">
              {ticket.event?.title || "Event Feedback"}
            </h3>
            <p className="text-xs text-ink-muted mt-1">
              Help club organizers improve future campus activities with your
              genuine review.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-center space-y-2 py-2">
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-125 cursor-pointer focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          active
                            ? "text-accent fill-accent"
                            : "text-surface-border fill-transparent"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-xs font-semibold text-ink">
                {RATING_LABELS[hoverRating || rating]}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-muted flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-brand" />
                Your Review & Suggestions (Optional)
              </label>
              <textarea
                rows={4}
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="What did you love? How can the club make the next session even better?"
                className="w-full text-xs bg-canvas border border-surface-border rounded-xl p-3 text-ink focus:outline-none focus:ring-2 focus:ring-brand resize-none placeholder:text-ink-subtle"
              />
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
              >
                Submit Review
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};
