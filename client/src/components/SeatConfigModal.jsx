import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import { Card, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import {
  Armchair,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  IndianRupee,
  Layers,
} from "lucide-react";

export const SeatConfigModal = ({ event, onClose, onUpdated }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [requiresSeatSelection, setRequiresSeatSelection] = useState(
    Boolean(event.requiresSeatSelection),
  );

  const [sections, setSections] = useState([
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

  const [existingSeats, setExistingSeats] = useState([]);
  const [editingSeatId, setEditingSeatId] = useState(null);
  const [singleSeatPrice, setSingleSeatPrice] = useState("");

  const loadSeats = async () => {
    try {
      setFetchLoading(true);
      const res = await api.get(`/seats/event/${event._id}`);
      if (res.data?.success) {
        setExistingSeats(res.data.seats || []);
        if (event.seatingConfiguration?.sections) {
          setSections(event.seatingConfiguration.sections);
        }
      }
    } catch (err) {
      console.warn("Could not load current seat map:", err.message);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    loadSeats();
  }, [event._id]);

  const handleAddSection = () => {
    const nextCharCode = String.fromCharCode(65 + sections.length * 2);
    setSections([
      ...sections,
      {
        name: `Section ${sections.length + 1}`,
        price: Number(event.price) || 100,
        rows: [{ row: nextCharCode, seatCount: 10, startNumber: 1 }],
      },
    ]);
  };

  const handleRemoveSection = (secIndex) => {
    setSections(sections.filter((_, idx) => idx !== secIndex));
  };

  const handleSectionNameChange = (secIndex, newName) => {
    const updated = [...sections];
    updated[secIndex].name = newName;
    setSections(updated);
  };

  const handleSectionPriceChange = (secIndex, newPrice) => {
    const updated = [...sections];
    updated[secIndex].price = Number(newPrice);
    setSections(updated);
  };

  const handleAddRow = (secIndex) => {
    const updated = [...sections];
    const existingRows = updated[secIndex].rows;
    const lastRowLabel =
      existingRows.length > 0 ? existingRows[existingRows.length - 1].row : "A";
    const nextRowLabel = String.fromCharCode(lastRowLabel.charCodeAt(0) + 1);
    updated[secIndex].rows.push({
      row: nextRowLabel,
      seatCount: 10,
      startNumber: 1,
    });
    setSections(updated);
  };

  const handleRemoveRow = (secIndex, rowIndex) => {
    const updated = [...sections];
    updated[secIndex].rows = updated[secIndex].rows.filter(
      (_, idx) => idx !== rowIndex,
    );
    setSections(updated);
  };

  const handleRowChange = (secIndex, rowIndex, field, val) => {
    const updated = [...sections];
    updated[secIndex].rows[rowIndex][field] =
      field === "row" ? val.toUpperCase() : Number(val);
    setSections(updated);
  };

  const totalCapacity = sections.reduce((acc, sec) => {
    return (
      acc +
      sec.rows.reduce((rAcc, row) => rAcc + (Number(row.seatCount) || 0), 0)
    );
  }, 0);

  const handleSaveConfiguration = async () => {
    try {
      setLoading(true);
      const res = await api.post(`/seats/event/${event._id}/configure`, {
        requiresSeatSelection,
        sections: requiresSeatSelection ? sections : [],
      });

      if (res.data?.success) {
        toast.success("Auditorium seating layout updated successfully!");
        onUpdated();
        onClose();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Failed to update auditorium arrangement",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSingleSeatPrice = async (seat) => {
    const parsed = Number(singleSeatPrice);
    if (isNaN(parsed) || parsed < 0) {
      toast.error("Enter a valid seat price");
      return;
    }

    try {
      const res = await api.patch(`/seats/${seat._id}/price`, {
        tierPrice: parsed,
      });
      if (res.data?.success) {
        toast.success(`Seat ${seat.seatLabel} price set to ₹${parsed}`);
        setEditingSeatId(null);
        setSingleSeatPrice("");
        loadSeats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update seat price");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <Card className="max-w-3xl w-full border-surface-border shadow-2xl bg-surface animate-scale-up max-h-[90vh] flex flex-col">
        <CardBody className="p-6 sm:p-8 space-y-6 overflow-y-auto">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-brand uppercase tracking-wider">
                <Armchair className="w-4 h-4" />
                <span>Auditorium Seating & Manual Seat Pricing</span>
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

          <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-bold text-ink">
                Auditorium Seat Selection Toggle
              </span>
              <p className="text-xs text-ink-muted">
                Turn ON for reserved seat picking from stage map; turn OFF for
                general admission pass booking.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={requiresSeatSelection}
                onChange={(e) => setRequiresSeatSelection(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-canvas border border-surface-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
            </label>
          </div>

          {requiresSeatSelection ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink">
                    Auditorium Section Arrangement
                  </h4>
                  <p className="text-[11px] text-ink-muted">
                    Configure sections, rows, and individual seat quantities
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-brand bg-brand-subtle px-2.5 py-1 rounded-lg border border-brand/30">
                    Capacity: {totalCapacity} Seats
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

              <div className="space-y-4">
                {sections.map((sec, secIdx) => (
                  <div
                    key={secIdx}
                    className="p-4 bg-surface rounded-xl border border-surface-border space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={sec.name}
                          onChange={(e) =>
                            handleSectionNameChange(secIdx, e.target.value)
                          }
                          className="font-bold text-xs text-ink bg-surface-subtle px-3 py-1.5 rounded-lg border border-surface-border outline-none focus:border-brand"
                        />
                        <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                          <span>Section Price: ₹</span>
                          <input
                            type="number"
                            min="0"
                            value={sec.price}
                            onChange={(e) =>
                              handleSectionPriceChange(secIdx, e.target.value)
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
                          icon={Plus}
                          onClick={() => handleAddRow(secIdx)}
                        >
                          Add Row
                        </Button>
                        {sections.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSection(secIdx)}
                            className="p-1.5 text-ink-subtle hover:text-danger rounded cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 pl-3 border-l-2 border-brand/40">
                      {sec.rows.map((row, rowIdx) => (
                        <div
                          key={rowIdx}
                          className="flex items-center gap-3 text-xs"
                        >
                          <div className="flex items-center gap-1">
                            <span className="text-ink-muted text-[11px]">
                              Row:
                            </span>
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
                            <span className="text-ink-muted text-[11px]">
                              Seat Count:
                            </span>
                            <input
                              type="number"
                              min="1"
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
                            <span className="text-ink-muted text-[11px]">
                              Start #:
                            </span>
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
                              onClick={() => handleRemoveRow(secIdx, rowIdx)}
                              className="text-ink-subtle hover:text-danger p-1"
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

              {existingSeats.length > 0 && (
                <div className="pt-4 border-t border-surface-border space-y-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-ink">
                      Manual Pricing for Individual Seats
                    </h4>
                    <p className="text-[11px] text-ink-muted">
                      Click any seat to customize its individual tier price
                      manually.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-surface-subtle rounded-xl border border-surface-border">
                    {existingSeats.map((seat) => {
                      const isEditing = editingSeatId === seat._id;
                      return (
                        <div
                          key={seat._id}
                          className="flex items-center gap-1 p-1.5 rounded-lg bg-surface border border-surface-border text-xs"
                        >
                          <span className="font-bold text-ink">
                            {seat.seatLabel}
                          </span>
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                value={singleSeatPrice}
                                onChange={(e) =>
                                  setSingleSeatPrice(e.target.value)
                                }
                                placeholder="₹"
                                className="w-16 px-1.5 py-0.5 text-xs bg-canvas rounded border border-brand outline-none"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateSingleSeatPrice(seat)
                                }
                                className="px-1.5 py-0.5 bg-brand text-white rounded text-[10px] font-bold"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingSeatId(null)}
                                className="text-ink-muted text-[10px]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSeatId(seat._id);
                                setSingleSeatPrice(seat.tierPrice.toString());
                              }}
                              className="text-brand hover:underline font-semibold ml-1 cursor-pointer"
                              title="Click to edit manual price"
                            >
                              ₹{seat.tierPrice}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center bg-surface-subtle rounded-xl border border-surface-border space-y-2">
              <Layers className="w-10 h-10 text-brand mx-auto opacity-70" />
              <p className="text-sm font-bold text-ink">
                General Admission Configured
              </p>
              <p className="text-xs text-ink-muted">
                Attendees will book general tickets based on the base price (₹
                {event.price}) without selecting specific auditorium seats.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-border">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={loading}
              onClick={handleSaveConfiguration}
              icon={CheckCircle2}
            >
              Save Seating Arrangement
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
