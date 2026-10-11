import React from "react";

export const SeatMap = ({
  seats = [],
  onSeatSelect,
  selectedSeatId,
  heldByMeId,
}) => {
  const sections = seats.reduce((acc, seat) => {
    const secName = seat.section || "General";
    if (!acc[secName]) {
      acc[secName] = [];
    }
    acc[secName].push(seat);
    return acc;
  }, {});

  const handleSeatClick = (seat) => {
    if (seat.status === "RESERVED") return;
    if (seat.status === "HELD") {
      const isMine =
        heldByMeId &&
        seat.heldBy &&
        seat.heldBy.toString() === heldByMeId.toString();
      if (!isMine) return;
      onSeatSelect(null);
      return;
    }
    onSeatSelect(seat);
  };

  const getSeatBadge = (seat) => {
    const isSelected =
      selectedSeatId && seat._id.toString() === selectedSeatId.toString();
    const isMine =
      heldByMeId &&
      seat.heldBy &&
      seat.heldBy.toString() === heldByMeId.toString();

    const baseClasses =
      "w-10 h-10 rounded-lg text-xs font-bold flex flex-col items-center justify-center transition-all duration-150 select-none border shadow-xs";

    if (isSelected) {
      return `${baseClasses} bg-accent text-surface border-accent ring-2 ring-accent ring-offset-2 scale-105 cursor-pointer`;
    }

    if (seat.status === "RESERVED") {
      return `${baseClasses} bg-canvas text-ink-subtle border-surface-border opacity-50 cursor-not-allowed`;
    }

    if (seat.status === "HELD") {
      if (isMine) {
        return `${baseClasses} bg-brand-dark text-surface border-brand ring-2 ring-brand cursor-pointer`;
      }
      return `${baseClasses} bg-canvas text-ink-muted border-accent/40 opacity-70 cursor-not-allowed`;
    }

    return `${baseClasses} bg-surface text-ink border-brand/50 hover:bg-brand hover:text-surface hover:border-brand cursor-pointer`;
  };

  if (!seats || seats.length === 0) {
    return (
      <div className="text-center py-8 text-ink-muted text-sm">
        No interactive seats configured for this event.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-block px-8 py-2 bg-canvas border border-surface-border rounded-xl text-xs font-bold text-ink-muted tracking-wider uppercase">
          Stage / Podium
        </div>
      </div>

      <div className="space-y-5">
        {Object.entries(sections).map(([secName, secSeats]) => {
          const samplePrice = secSeats[0]?.tierPrice;
          const availableCount = secSeats.filter(
            (s) => s.status === "AVAILABLE",
          ).length;

          return (
            <div
              key={secName}
              className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border space-y-2.5"
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="text-ink">{secName} Section</span>
                  <span className="text-brand font-bold">₹{samplePrice}</span>
                </div>
                <span className="text-ink-muted text-[11px]">
                  {availableCount} / {secSeats.length} available
                </span>
              </div>

              <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 justify-items-center pt-1">
                {secSeats
                  .sort((a, b) =>
                    a.seatLabel.localeCompare(b.seatLabel, undefined, {
                      numeric: true,
                    }),
                  )
                  .map((seat) => (
                    <button
                      key={seat._id}
                      type="button"
                      onClick={() => handleSeatClick(seat)}
                      disabled={
                        seat.status === "RESERVED" ||
                        (seat.status === "HELD" &&
                          (!heldByMeId ||
                            !seat.heldBy ||
                            seat.heldBy.toString() !== heldByMeId.toString()))
                      }
                      title={`Seat ${seat.seatLabel} (${seat.section}) - ₹${seat.tierPrice} - ${seat.status}`}
                      className={getSeatBadge(seat)}
                    >
                      <span>{seat.seatLabel}</span>
                    </button>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 text-xs pt-2 border-t border-surface-border text-ink-muted">
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-surface border border-brand/50" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-accent" />
          <span className="text-accent font-semibold">Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-brand-dark" />
          <span>Held by You</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-canvas border border-surface-border opacity-50" />
          <span>Booked</span>
        </div>
      </div>
    </div>
  );
};
