import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import {
  Calendar,
  MapPin,
  Users,
  Search,
  Sparkles,
  Ticket,
  ArrowRight,
} from "lucide-react";

export const EventBrowse = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = [
    "All",
    "Tech",
    "Workshop",
    "Cultural",
    "Sports",
    "Gaming",
  ];

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory !== "All") params.category = selectedCategory;
      if (search.trim()) params.search = search.trim();

      const res = await api.get("/events", { params });
      if (res.data?.success) {
        setEvents(res.data.events);
      }
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  return (
    <div className="space-y-8 animate-fade-in text-ink w-full max-w-full min-w-0">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand to-brand-dark text-white p-6 sm:p-10 shadow-card w-full">
        <div className="relative z-10 max-w-2xl">
          <Badge
            variant="default"
            size="sm"
            className="mb-3 bg-white/20 text-white border-white/30"
          >
            Campus Life Hub
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Discover What's Happening Across Campus
          </h1>
          <p className="text-sm sm:text-base text-white/90 mt-3 leading-relaxed">
            Register for hackathons, guest workshops, cultural fests, and
            esports tournaments with instant digital QR passes.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center w-full min-w-0">
        <form
          onSubmit={handleSearchSubmit}
          className="w-full md:max-w-md flex gap-2 min-w-0"
        >
          <div className="flex-1 min-w-0">
            <Input
              placeholder="Search events, clubs, or venues..."
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" variant="primary" size="md">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none min-w-0 shrink-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? "bg-brand text-brand-fg border-brand shadow-sm"
                  : "bg-surface text-ink-muted border-surface-border hover:border-brand/40 hover:text-ink"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-80 rounded-xl bg-surface border border-surface-border animate-pulse p-4 flex flex-col justify-between"
            >
              <div className="h-40 bg-canvas rounded-lg" />
              <div className="space-y-2 mt-4">
                <div className="h-4 bg-canvas rounded w-3/4" />
                <div className="h-3 bg-canvas rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card className="text-center py-16 px-4 bg-surface border-surface-border">
          <CardBody className="max-w-md mx-auto space-y-3">
            <Ticket className="w-12 h-12 text-ink-subtle mx-auto" />
            <h3 className="text-lg font-bold text-ink">No Events Found</h3>
            <p className="text-sm text-ink-muted">
              We couldn't find any events matching your filters. Try adjusting
              your search or category.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearch("");
                setSelectedCategory("All");
              }}
            >
              Reset Filters
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const isSoldOut = event.registeredCount >= event.capacity;
            const eventDate = new Date(event.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <Card
                key={event._id}
                hoverEffect
                className="overflow-hidden flex flex-col group border-surface-border bg-surface"
              >
                <div className="relative h-44 overflow-hidden bg-canvas">
                  <img
                    src={event.banner}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge variant="brand" size="sm">
                      {event.category}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    {isSoldOut ? (
                      <Badge variant="danger" size="sm">
                        Sold Out
                      </Badge>
                    ) : event.price === 0 ? (
                      <Badge variant="success" size="sm">
                        Free Pass
                      </Badge>
                    ) : (
                      <Badge variant="accent" size="sm">
                        ₹{event.price}
                      </Badge>
                    )}
                  </div>
                </div>

                <CardBody className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-xs text-brand font-semibold block mb-1">
                      {event.club}
                    </span>
                    <h3 className="font-bold text-base text-ink line-clamp-1 group-hover:text-brand transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-xs text-ink-muted line-clamp-2 mt-2 leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-surface-border text-xs text-ink-muted">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-brand" />
                      <span>{eventDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-accent" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-ink-subtle" />
                        <span>
                          {event.registeredCount} / {event.capacity} registered
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-ink-muted">
                        {Math.round(
                          (event.registeredCount / event.capacity) * 100,
                        )}
                        % Full
                      </span>
                    </div>

                    <div className="w-full bg-canvas rounded-full h-1.5 overflow-hidden">
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
                  </div>

                  <Link
                    to={`/events/${event._id}`}
                    className="block w-full pt-2"
                  >
                    <Button
                      variant={isSoldOut ? "secondary" : "primary"}
                      size="sm"
                      className="w-full"
                      icon={ArrowRight}
                    >
                      {isSoldOut ? "View Details" : "Book Ticket"}
                    </Button>
                  </Link>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
