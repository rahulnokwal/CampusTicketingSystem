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
  Armchair,
  Plus,
  Trash2,
  CheckCircle2,
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
    requiresSeatSelection: false,
    registrationDeadline: "",
  });

  // Auditorium seating custom layout builder
  const [customSections, setCustomSections] = useState([
    {
      name: "VIP",
      price: 150,
      rows: [{ row: "A", seatCount: 8, startNumber: 1 }],
    },
    {
      name: "General",
      price: 100,
      rows: [
        { row: "B", seatCount: 10, startNumber: 1 },
        { row: "C", seatCount: 10, startNumber: 1 },
      ],
    },
    {
      name: "Balcony",
      price: 80,
      rows: [{ row: "D", seatCount: 8, startNumber: 1 }],
    },
  ]);

  const [aiHighlights, setAiHighlights] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  // Section builder helpers
  const handleAddSection = () => {
    const nextCharCode = String.fromCharCode(65 + customSections.length * 2);
    setCustomSections([
      ...customSections,
      {
        name: `Section ${customSections.length + 1}`,
        price: Number(formData.price) || 100,
        rows: [{ row: nextCharCode, seatCount: 10, startNumber: 1 }],
      },
    ]);
  };

  const handleRemoveSection = (secIndex) => {
    setCustomSections(customSections.filter((_, idx) => idx !== secIndex));
  };

  const handleSectionNameChange = (secIndex, newName) => {
    const updated = [...customSections];
    updated[secIndex].name = newName;
    setCustomSections(updated);
  };

  const handleSectionPriceChange = (secIndex, newPrice) => {
    const updated = [...customSections];
    updated[secIndex].price = Number(newPrice);
    setCustomSections(updated);
  };

  const handleAddRow = (secIndex) => {
    const updated = [...customSections];
    const existingRows = updated[secIndex].rows;
    const lastRowLabel =
      existingRows.length > 0
        ? existingRows[existingRows.length - 1].row
        : "A";
    const nextRowLabel = String.fromCharCode(lastRowLabel.charCodeAt(0) + 1);
    updated[secIndex].rows.push({
      row: nextRowLabel,
      seatCount: 10,
      startNumber: 1,
    });
    setCustomSections(updated);
  };

  const handleRemoveRow = (secIndex, rowIndex) => {
    const updated = [...customSections];
    updated[secIndex].rows = updated[secIndex].rows.filter(
      (_, idx) => idx !== rowIndex,
    );
    setCustomSections(updated);
  };

  const handleRowChange = (secIndex, rowIndex, field, val) => {
    const updated = [...customSections];
    updated[secIndex].rows[rowIndex][field] =
      field === "row" ? val.toUpperCase() : Number(val);
    setCustomSections(updated);
  };

  // Calculate total configured seats
  const totalConfiguredSeats = customSections.reduce((acc, sec) => {
    return (
      acc +
      sec.rows.reduce(
        (rAcc, row) => rAcc + (Number(row.seatCount) || 0),
        0,
      )
    );
  }, 0);

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

      const payload = {
        ...formData,
        capacity: formData.requiresSeatSelection
          ? totalConfiguredSeats || formData.capacity
          : Number(formData.capacity),
        price: Number(formData.price),
        seatingConfiguration: formData.requiresSeatSelection
          ? { sections: customSections }
          : null,
      };

      const res = await api.post("/events", payload);
      if (res.data?.success) {
        const createdEvent = res.data.event;

        // If seat selection enabled with custom sections, trigger seat layout generation
        if (formData.requiresSeatSelection && createdEvent?._id) {
          try {
            await api.post(`/seats/event/${createdEvent._id}/configure`, {
              sections: customSections,
              requiresSeatSelection: true,
            });
          } catch (seatErr) {
            console.warn("Seat configuration notice:", seatErr.message);
          }
        }

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
          Publish an event, configure general admission or custom auditorium seating, and draft descriptions with AI
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
                label="Registration Deadline / Expiry"
                name="registrationDeadline"
                type="datetime-local"
                icon={Calendar}
                value={formData.registrationDeadline}
                onChange={handleChange}
                placeholder="Optional cutoff time before event starts"
              />

              <Input
                label="Total Capacity (Max Attendees)"
                name="capacity"
                type="number"
                min="1"
                icon={Users}
                value={
                  formData.requiresSeatSelection
                    ? totalConfiguredSeats
                    : formData.capacity
                }
                onChange={handleChange}
                disabled={formData.requiresSeatSelection}
                required
              />

              <Input
                label="Base Ticket Price (₹ 0 for Free)"
                name="price"
                type="number"
                min="0"
                icon={IndianRupee}
                value={formData.price}
                onChange={handleChange}
              />
            </div>

            {/* Seat Selection Toggle & Auditorium Arrangement Configurator */}
            <div className="p-4 sm:p-5 rounded-xl bg-surface-subtle border border-surface-border space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Armchair className="w-4 h-4 text-brand" />
                    <span className="text-sm font-bold text-ink">
                      Auditorium Seat Selection
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted">
                    Enable if attendees must pick a specific seat from a stage layout. If disabled, this event operates as General Admission.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="requiresSeatSelection"
                    checked={formData.requiresSeatSelection}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-canvas border border-surface-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                </label>
              </div>

              {formData.requiresSeatSelection && (
                <div className="space-y-4 pt-3 border-t border-surface-border">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-ink">
                        Custom Auditorium Arrangement & Pricing
                      </h4>
                      <p className="text-[11px] text-ink-muted">
                        Define custom sections (e.g. VIP, General, Balcony) with manual tier prices and row counts.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-brand bg-brand-subtle px-2.5 py-1 rounded-md border border-brand/30">
                        Total Seats: {totalConfiguredSeats}
                      </span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        icon={Plus}
                        onClick={handleAddSection}
                      >
                        Add Section
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {customSections.map((sec, secIdx) => (
                      <div
                        key={secIdx}
                        className="p-3.5 bg-surface rounded-xl border border-surface-border space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              value={sec.name}
                              onChange={(e) =>
                                handleSectionNameChange(secIdx, e.target.value)
                              }
                              placeholder="Section Name"
                              className="font-bold text-xs text-ink bg-surface-subtle px-2.5 py-1.5 rounded-lg border border-surface-border outline-none focus:border-brand"
                            />
                            <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                              <span>Price: ₹</span>
                              <input
                                type="number"
                                min="0"
                                value={sec.price}
                                onChange={(e) =>
                                  handleSectionPriceChange(
                                    secIdx,
                                    e.target.value,
                                  )
                                }
                                className="w-20 text-xs font-semibold text-ink bg-surface-subtle px-2 py-1 rounded-lg border border-surface-border outline-none focus:border-brand"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              icon={Plus}
                              onClick={() => handleAddRow(secIdx)}
                            >
                              Add Row
                            </Button>
                            {customSections.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSection(secIdx)}
                                className="p-1.5 text-ink-subtle hover:text-danger rounded cursor-pointer"
                                title="Remove section"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Rows in section */}
                        <div className="space-y-1.5 pl-2 border-l-2 border-brand/40">
                          {sec.rows.map((row, rowIdx) => (
                            <div
                              key={rowIdx}
                              className="flex items-center gap-3 text-xs"
                            >
                              <div className="flex items-center gap-1">
                                <span className="text-ink-muted text-[11px]">Row:</span>
                                <input
                                  type="text"
                                  maxLength="2"
                                  value={row.row}
                                  onChange={(e) =>
                                    handleRowChange(
                                      secIdx,
                                      rowIdx,
                                      "row",
                                      e.target.value,
                                    )
                                  }
                                  className="w-12 text-center font-bold text-ink bg-surface-subtle px-1.5 py-1 rounded border border-surface-border"
                                />
                              </div>

                              <div className="flex items-center gap-1">
                                <span className="text-ink-muted text-[11px]">Seats:</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="50"
                                  value={row.seatCount}
                                  onChange={(e) =>
                                    handleRowChange(
                                      secIdx,
                                      rowIdx,
                                      "seatCount",
                                      e.target.value,
                                    )
                                  }
                                  className="w-16 text-center text-ink bg-surface-subtle px-1.5 py-1 rounded border border-surface-border"
                                />
                              </div>

                              <div className="flex items-center gap-1">
                                <span className="text-ink-muted text-[11px]">Start #:</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={row.startNumber}
                                  onChange={(e) =>
                                    handleRowChange(
                                      secIdx,
                                      rowIdx,
                                      "startNumber",
                                      e.target.value,
                                    )
                                  }
                                  className="w-14 text-center text-ink bg-surface-subtle px-1.5 py-1 rounded border border-surface-border"
                                />
                              </div>

                              {sec.rows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveRow(secIdx, rowIdx)
                                  }
                                  className="text-ink-subtle hover:text-danger p-1"
                                  title="Delete row"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
