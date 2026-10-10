import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Card, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import {
  Sparkles,
  Calendar,
  MapPin,
  Users,
  IndianRupee,
  Image,
  ArrowRight,
} from "lucide-react";

export const CreateEvent = () => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    category: "Tech",
    venue: "",
    date: "",
    capacity: 100,
    price: 0,
    club: user?.clubName || "Campus Club",
    banner:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80",
    description: "",
  });

  const [aiHighlights, setAiHighlights] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenerateAiDescription = async () => {
    if (!formData.title) {
      toast.error("Please enter an event title first so AI has context!");
      return;
    }

    try {
      setAiLoading(true);
      const res = await api.post("/events/ai/description", {
        title: formData.title,
        category: formData.category,
        club: formData.club,
        keyHighlights: aiHighlights,
      });

      if (res.data?.success && res.data.description) {
        setFormData((prev) => ({ ...prev, description: res.data.description }));
        toast.success("AI description generated successfully!");
      }
    } catch (err) {
      toast.error("AI generation failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.venue ||
      !formData.date ||
      !formData.description
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSubmitLoading(true);
      const res = await api.post("/events", formData);
      if (res.data?.success) {
        toast.success("Event published successfully!");
        navigate("/manage-events");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create event");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12 text-ink">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">
          Create New Campus Event
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Publish an event, configure seating capacity, and draft descriptions
          with Google Gemini AI
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-surface border-surface-border shadow-card">
          <CardBody className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Event Title"
                name="title"
                placeholder="e.g. Annual Tech Symposium & Hackathon"
                value={formData.title}
                onChange={handleChange}
                required
              />

              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-surface border border-surface-border hover:border-ink-subtle focus:border-brand rounded-lg py-2.5 px-3.5 text-sm text-ink outline-none transition-all"
                >
                  <option value="Tech">Tech</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Sports">Sports</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Academic">Academic</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <Input
                label="Venue / Room"
                name="venue"
                placeholder="e.g. Auditorium Hall B, 3rd Floor"
                icon={MapPin}
                value={formData.venue}
                onChange={handleChange}
                required
              />

              <Input
                label="Date & Time"
                name="date"
                type="datetime-local"
                icon={Calendar}
                value={formData.date}
                onChange={handleChange}
                required
              />

              <Input
                label="Total Capacity (Max Seats)"
                name="capacity"
                type="number"
                min="1"
                icon={Users}
                value={formData.capacity}
                onChange={handleChange}
                required
              />

              <Input
                label="Ticket Price (₹ 0 for Free)"
                name="price"
                type="number"
                min="0"
                icon={IndianRupee}
                value={formData.price}
                onChange={handleChange}
              />
            </div>

            <Input
              label="Banner Image URL"
              name="banner"
              placeholder="https://images.unsplash.com/..."
              icon={Image}
              value={formData.banner}
              onChange={handleChange}
            />

            <div className="p-4 sm:p-5 rounded-xl bg-surface-subtle border border-brand/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-bold text-brand">
                  <Sparkles className="w-4 h-4 text-brand animate-pulse" />
                  <span>Google Gemini Description Assistant</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={aiLoading}
                  onClick={handleGenerateAiDescription}
                  icon={Sparkles}
                >
                  Generate Description (AI)
                </Button>
              </div>
              <Input
                placeholder="Optional prompts/highlights (e.g., keynote speaker, prize pool $1000, free pizza)"
                value={aiHighlights}
                onChange={(e) => setAiHighlights(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Event Description
              </label>
              <textarea
                name="description"
                rows="6"
                placeholder="Write event overview, schedule, prerequisites, and rules..."
                value={formData.description}
                onChange={handleChange}
                required
                className="w-full bg-surface border border-surface-border hover:border-ink-subtle focus:border-brand rounded-lg p-3.5 text-sm text-ink outline-none transition-all leading-relaxed placeholder:text-ink-subtle"
              />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/manage-events")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={submitLoading}
                icon={ArrowRight}
              >
                Publish Event
              </Button>
            </div>
          </CardBody>
        </Card>
      </form>
    </div>
  );
};
