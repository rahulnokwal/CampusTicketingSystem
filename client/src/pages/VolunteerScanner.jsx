import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import { offlineStorage } from "../services/offlineStorage";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import {
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  UserCheck,
  ShieldAlert,
  Wifi,
  WifiOff,
  Download,
  RefreshCw,
  Armchair,
  Database,
} from "lucide-react";

export const VolunteerScanner = () => {
  const toast = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [manualCode, setManualCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);

  // Phase 8: Offline PWA State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [downloadingManifest, setDownloadingManifest] = useState(false);
  const [cachedEventInfo, setCachedEventInfo] = useState(null);
  const [pendingScans, setPendingScans] = useState([]);
  const [syncingQueue, setSyncingQueue] = useState(false);

  const html5QrCodeRef = useRef(null);

  // Monitor online / offline network state
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success(
        "Internet connection restored. Synchronizing offline queue...",
      );
      syncOfflineQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning(
        "Switched to Offline Mode. Scanner will use local IndexedDB manifest.",
      );
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [selectedEventId]);

  // Load available events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get("/events?limit=30");
        if (res.data?.success && res.data.events?.length > 0) {
          setEvents(res.data.events);
          setSelectedEventId(res.data.events[0]._id);
        }
      } catch (e) {
        // In offline mode, check cached events
        console.warn("Could not load online events list:", e.message);
      }
    };

    fetchEvents();
  }, []);

  // Check cached manifest & pending scans when selected event changes
  useEffect(() => {
    if (!selectedEventId) return;

    const checkLocalStatus = async () => {
      try {
        const cached = await offlineStorage.getCachedEvent(selectedEventId);
        setCachedEventInfo(cached);

        const unsynced = await offlineStorage.getUnsyncedScans(selectedEventId);
        setPendingScans(unsynced);
      } catch (err) {
        console.warn("Error reading local IndexedDB cache:", err.message);
      }
    };

    checkLocalStatus();
  }, [selectedEventId]);

  // Download Manifest for selected event
  const handleDownloadManifest = async () => {
    if (!selectedEventId) {
      toast.warning("Please select an event first");
      return;
    }

    try {
      setDownloadingManifest(true);
      const res = await api.get(`/checkin/manifest/${selectedEventId}`);
      if (res.data?.success) {
        await offlineStorage.saveEventManifest(
          selectedEventId,
          res.data.event,
          res.data.manifest,
        );

        const cached = await offlineStorage.getCachedEvent(selectedEventId);
        setCachedEventInfo(cached);

        toast.success(
          `Manifest cached! ${res.data.count} attendees downloaded for offline entry.`,
        );
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Failed to download event attendee manifest",
      );
    } finally {
      setDownloadingManifest(false);
    }
  };

  // Sync Offline Queue
  const syncOfflineQueue = async () => {
    if (!isOnline) {
      toast.warning("Cannot sync while offline. Please connect to internet.");
      return;
    }

    try {
      setSyncingQueue(true);
      const unsynced = await offlineStorage.getUnsyncedScans(selectedEventId);
      if (unsynced.length === 0) {
        toast.info("No pending offline scans to sync");
        return;
      }

      const res = await api.post("/checkin/sync-offline", {
        eventId: selectedEventId,
        scans: unsynced.map((s) => ({
          ticketCode: s.ticketCode,
          scannedAt: s.scannedAt,
        })),
      });

      if (res.data?.success) {
        await offlineStorage.markScansSynced(unsynced.map((s) => s.id));
        const remaining =
          await offlineStorage.getUnsyncedScans(selectedEventId);
        setPendingScans(remaining);
        toast.success(res.data.message || "Offline queue synced with server!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Sync failed");
    } finally {
      setSyncingQueue(false);
    }
  };

  const startScanner = async () => {
    try {
      setCameraError("");
      setScanResult(null);

      const html5QrCode = new Html5Qrcode("qr-reader-viewport");
      html5QrCodeRef.current = html5QrCode;

      const qrCodeSuccessCallback = async (decodedText) => {
        try {
          await html5QrCode.pause();
        } catch (e) {}

        handleVerifyPayload(decodedText);
      };

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback,
        () => {},
      );

      setIsScanning(true);
    } catch (err) {
      console.warn("Camera start error:", err);
      setCameraError(
        "Could not access camera device. Please ensure camera permissions are allowed, or use manual ticket code verification below.",
      );
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error("Failed to stop camera:", err);
      }
      setIsScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Extract clean ticket code from raw JWT or plain code
  const extractTicketCode = (payload) => {
    if (!payload) return "";
    if (payload.startsWith("CL-")) return payload.trim();

    try {
      // Decode JWT payload without signature check for offline ticketCode lookup
      const parts = payload.split(".");
      if (parts.length === 3) {
        const decoded = JSON.parse(atob(parts[1]));
        if (decoded.ticketCode) return decoded.ticketCode;
      }
    } catch (e) {
      // ignore
    }
    return payload.trim();
  };

  const handleVerifyPayload = async (payload) => {
    try {
      setVerifying(true);
      const extractedCode = extractTicketCode(payload);

      // If online, try online verification first
      if (isOnline) {
        try {
          const res = await api.post("/checkin/verify", {
            qrPayload: payload,
            eventId: selectedEventId || undefined,
          });

          const resultData = {
            status: "VALID",
            isOffline: false,
            message:
              res.data?.message || "Access Granted: Valid Admission Pass",
            attendee: res.data?.attendee,
            timestamp: new Date().toLocaleTimeString(),
          };

          setScanResult(resultData);
          setScanHistory((prev) => [resultData, ...prev]);
          toast.success("Attendee checked in successfully!");
          return;
        } catch (apiErr) {
          // If this was an actual rejection from server (ALREADY_USED, WRONG_EVENT, etc), show it
          if (apiErr.response) {
            const errRes = apiErr.response.data;
            const status = errRes?.result || "INVALID";

            const resultData = {
              status,
              isOffline: false,
              message:
                errRes?.message ||
                "Verification Failed: Invalid or tampered pass",
              attendee: errRes?.student,
              checkedInAt: errRes?.checkedInAt,
              timestamp: new Date().toLocaleTimeString(),
            };

            setScanResult(resultData);
            setScanHistory((prev) => [resultData, ...prev]);

            if (status === "ALREADY_USED") {
              toast.warning("Ticket was already checked in!");
            } else {
              toast.error("Invalid ticket QR code!");
            }
            return;
          }
          // Otherwise, network dropped during call - fall through to offline check
        }
      }

      // Offline Verification Flow (IndexedDB)
      const offlineRes = await offlineStorage.verifyAndCheckInOffline(
        selectedEventId,
        extractedCode,
      );

      const resultData = {
        status: offlineRes.result,
        isOffline: true,
        message: offlineRes.message,
        attendee: offlineRes.attendee
          ? {
              name: offlineRes.attendee.studentName,
              email: offlineRes.attendee.studentEmail,
              seatLabel: offlineRes.attendee.seatLabel,
              ticketCode: offlineRes.attendee.ticketCode,
            }
          : null,
        timestamp: new Date().toLocaleTimeString(),
      };

      setScanResult(resultData);
      setScanHistory((prev) => [resultData, ...prev]);

      if (offlineRes.success) {
        toast.success("OFFLINE ENTRY GRANTED! Queued for sync.");
        const unsynced = await offlineStorage.getUnsyncedScans(selectedEventId);
        setPendingScans(unsynced);
      } else if (offlineRes.result === "ALREADY_USED") {
        toast.warning("TICKET ALREADY USED in offline log!");
      } else {
        toast.error(
          offlineRes.message || "Ticket not found in local manifest!",
        );
      }
    } catch (err) {
      toast.error("Scan processing error: " + err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleVerifyPayload(manualCode.trim());
    setManualCode("");
  };

  const resumeScanning = async () => {
    setScanResult(null);
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.resume();
      } catch (e) {
        startScanner();
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12 text-ink">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="warning" size="sm">
              Gate Volunteer Mode
            </Badge>
            {isOnline ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success-bg text-success border border-success-border">
                <Wifi className="w-3.5 h-3.5" />
                Live Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-danger-bg text-danger border border-danger-border animate-pulse">
                <WifiOff className="w-3.5 h-3.5" />
                Offline Mode
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink mt-1">
            QR Ticket Scanner & Admission Verification
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Low-latency verification with offline IndexedDB manifest caching
          </p>
        </div>

        {pendingScans.length > 0 && (
          <Button
            variant="primary"
            size="sm"
            onClick={syncOfflineQueue}
            loading={syncingQueue}
            icon={RefreshCw}
          >
            Sync {pendingScans.length} Offline Scan(s)
          </Button>
        )}
      </div>

      <Card className="border-surface-border bg-surface shadow-card">
        <CardBody className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 flex-1">
              <label className="text-xs font-bold uppercase text-ink-muted tracking-wider">
                Active Gate Event
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full text-sm font-medium bg-canvas border border-surface-border rounded-lg px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {events.map((ev) => (
                  <option key={ev._id} value={ev._id}>
                    {ev.title} — {ev.venue}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2 sm:pt-4">
              <Button
                variant="secondary"
                size="sm"
                loading={downloadingManifest}
                onClick={handleDownloadManifest}
                icon={Download}
              >
                Download Offline Manifest
              </Button>
            </div>
          </div>

          {cachedEventInfo && (
            <div className="mt-3 pt-3 border-t border-surface-border flex items-center justify-between text-xs text-ink-muted">
              <span className="flex items-center gap-1.5 font-medium text-brand">
                <Database className="w-3.5 h-3.5" />
                Cached: {cachedEventInfo.count} attendees stored in browser
                IndexedDB
              </span>
              <span className="text-[11px] text-ink-subtle">
                Updated {new Date(cachedEventInfo.savedAt).toLocaleTimeString()}
              </span>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden border-surface-border bg-surface shadow-card">
            <CardBody className="p-6 space-y-6">
              <div className="relative bg-canvas rounded-2xl overflow-hidden border border-surface-border flex flex-col items-center justify-center min-h-[320px]">
                <div
                  id="qr-reader-viewport"
                  className="w-full max-w-sm rounded-xl overflow-hidden"
                />

                {!isScanning && !cameraError && (
                  <div className="text-center p-8 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-brand-subtle border border-brand/30 text-brand mx-auto flex items-center justify-center shadow-sm">
                      <Camera className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-ink">
                        Camera Offline
                      </h4>
                      <p className="text-xs text-ink-muted mt-1 max-w-xs mx-auto">
                        Click below to grant camera access and begin live badge
                        scanning
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      icon={Camera}
                      onClick={startScanner}
                    >
                      Launch Live Scanner
                    </Button>
                  </div>
                )}

                {cameraError && (
                  <div className="text-center p-6 space-y-3">
                    <ShieldAlert className="w-10 h-10 text-warning mx-auto" />
                    <p className="text-xs text-warning max-w-sm">
                      {cameraError}
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={startScanner}
                    >
                      Retry Camera Access
                    </Button>
                  </div>
                )}
              </div>

              {isScanning && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-xs text-success">
                    <span className="w-2.5 h-2.5 rounded-full bg-success animate-ping" />
                    <span>Camera Active • Align QR inside box</span>
                  </div>
                  <Button variant="danger" size="sm" onClick={stopScanner}>
                    Stop Camera
                  </Button>
                </div>
              )}

              {scanResult && (
                <div
                  className={`p-5 rounded-2xl border transition-all animate-scale-up ${
                    scanResult.status === "VALID"
                      ? "bg-success-bg border-success-border text-ink shadow-sm"
                      : scanResult.status === "ALREADY_USED"
                        ? "bg-warning-bg border-warning-border text-ink shadow-sm"
                        : "bg-danger-bg border-danger-border text-ink shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {scanResult.status === "VALID" ? (
                      <CheckCircle2 className="w-8 h-8 text-success shrink-0" />
                    ) : scanResult.status === "ALREADY_USED" ? (
                      <AlertTriangle className="w-8 h-8 text-warning shrink-0" />
                    ) : (
                      <XCircle className="w-8 h-8 text-danger shrink-0" />
                    )}

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              scanResult.status === "VALID"
                                ? "bg-success text-surface"
                                : scanResult.status === "ALREADY_USED"
                                  ? "bg-warning text-surface"
                                  : "bg-danger text-surface"
                            }`}
                          >
                            {scanResult.status === "VALID"
                              ? "VALID ENTRY"
                              : scanResult.status === "ALREADY_USED"
                                ? "ALREADY USED"
                                : "INVALID PASS"}
                          </span>
                          {scanResult.isOffline && (
                            <span className="text-[10px] font-bold uppercase bg-canvas border border-surface-border text-ink px-1.5 py-0.5 rounded">
                              Offline Mode
                            </span>
                          )}
                        </div>
                        <span className="text-xs opacity-75 font-mono text-ink-muted">
                          {scanResult.timestamp}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-base mt-2 text-ink">
                        {scanResult.message}
                      </h3>

                      {scanResult.attendee && (
                        <div className="mt-2 text-xs space-y-1 border-t border-surface-border pt-2 text-ink-muted">
                          <p>
                            <strong className="text-ink">Attendee:</strong>{" "}
                            {scanResult.attendee.name} (
                            {scanResult.attendee.email})
                          </p>
                          {scanResult.attendee.seatLabel && (
                            <p className="flex items-center gap-1.5 text-accent font-semibold">
                              <Armchair className="w-3.5 h-3.5" />
                              Seat: {scanResult.attendee.seatLabel}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="pt-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={RotateCcw}
                          onClick={resumeScanning}
                        >
                          Scan Next Ticket
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-surface-border">
                <form onSubmit={handleManualSubmit} className="space-y-2">
                  <label className="text-xs font-semibold text-ink-muted uppercase">
                    Manual Ticket Code / QR Payload Verification
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. CL-M2K8Q-A19F or JWT payload..."
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      loading={verifying}
                      icon={UserCheck}
                    >
                      Verify
                    </Button>
                  </div>
                </form>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-surface-border bg-surface shadow-card">
            <CardBody className="p-5 space-y-4">
              <h3 className="font-bold text-sm text-ink flex items-center justify-between">
                <span>Session Activity Log</span>
                <Badge variant="default" size="sm">
                  {scanHistory.length} Scans
                </Badge>
              </h3>

              {scanHistory.length === 0 ? (
                <p className="text-xs text-ink-subtle text-center py-8">
                  No scan events recorded this session yet.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                  {scanHistory.map((scan, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-surface-subtle border border-surface-border text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-semibold ${
                              scan.status === "VALID"
                                ? "text-success"
                                : scan.status === "ALREADY_USED"
                                  ? "text-warning"
                                  : "text-danger"
                            }`}
                          >
                            {scan.status}
                          </span>
                          {scan.isOffline && (
                            <span className="text-[9px] bg-canvas px-1 rounded text-ink-muted">
                              OFFLINE
                            </span>
                          )}
                        </div>
                        <span className="text-ink-subtle text-[11px] block mt-0.5">
                          {scan.attendee?.name || "Unknown attendee"}
                          {scan.attendee?.seatLabel &&
                            ` • Seat ${scan.attendee.seatLabel}`}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-ink-subtle">
                        {scan.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
