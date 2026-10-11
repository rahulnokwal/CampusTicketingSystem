const DB_NAME = "campus_life_offline_db";
const DB_VERSION = 1;

const openDB = () => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      return reject(new Error("IndexedDB is not supported in this browser"));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains("manifest")) {
        const manifestStore = db.createObjectStore("manifest", {
          keyPath: "ticketCode",
        });
        manifestStore.createIndex("eventId", "eventId", { unique: false });
      }

      if (!db.objectStoreNames.contains("offlineScans")) {
        const scanStore = db.createObjectStore("offlineScans", {
          keyPath: "id",
          autoIncrement: true,
        });
        scanStore.createIndex("eventId", "eventId", { unique: false });
        scanStore.createIndex("synced", "synced", { unique: false });
      }

      if (!db.objectStoreNames.contains("cachedEvents")) {
        db.createObjectStore("cachedEvents", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const offlineStorage = {
  async saveEventManifest(eventId, eventData, attendees) {
    const db = await openDB();
    const tx = db.transaction(["manifest", "cachedEvents"], "readwrite");
    const manifestStore = tx.objectStore("manifest");
    const eventsStore = tx.objectStore("cachedEvents");

    eventsStore.put({
      id: eventId,
      title: eventData.title,
      venue: eventData.venue,
      date: eventData.date,
      count: attendees.length,
      savedAt: new Date().toISOString(),
    });

    for (const attendee of attendees) {
      manifestStore.put({
        ...attendee,
        eventId,
      });
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  },

  async getCachedAttendees(eventId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("manifest", "readonly");
      const store = tx.objectStore("manifest");
      const index = store.index("eventId");
      const request = index.getAll(eventId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  async getCachedEvent(eventId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("cachedEvents", "readonly");
      const store = tx.objectStore("cachedEvents");
      const request = store.get(eventId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  async verifyAndCheckInOffline(eventId, ticketCode) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(["manifest", "offlineScans"], "readwrite");
      const manifestStore = tx.objectStore("manifest");
      const scanStore = tx.objectStore("offlineScans");

      const getReq = manifestStore.get(ticketCode);

      getReq.onsuccess = () => {
        const attendee = getReq.result;

        if (!attendee) {
          return resolve({
            success: false,
            result: "NOT_FOUND",
            message: "Ticket not found in offline attendee manifest.",
          });
        }

        if (eventId && attendee.eventId !== eventId) {
          return resolve({
            success: false,
            result: "WRONG_EVENT",
            message: "Ticket is for a different event!",
          });
        }

        if (attendee.status === "CHECKED_IN") {
          return resolve({
            success: false,
            result: "ALREADY_USED",
            message: `TICKET ALREADY USED! Checked in on ${
              attendee.checkedInAt
                ? new Date(attendee.checkedInAt).toLocaleTimeString()
                : "earlier"
            }`,
            attendee,
          });
        }

        const checkInTime = new Date().toISOString();
        attendee.status = "CHECKED_IN";
        attendee.checkedInAt = checkInTime;
        manifestStore.put(attendee);

        scanStore.add({
          eventId,
          ticketCode,
          studentName: attendee.studentName,
          scannedAt: checkInTime,
          synced: false,
        });

        resolve({
          success: true,
          result: "VALID",
          message: "OFFLINE ENTRY GRANTED! Queued for cloud sync.",
          attendee,
        });
      };

      getReq.onerror = () => reject(getReq.error);
    });
  },

  async getUnsyncedScans(eventId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("offlineScans", "readonly");
      const store = tx.objectStore("offlineScans");
      const request = store.getAll();

      request.onsuccess = () => {
        const allScans = request.result || [];
        const unsynced = allScans.filter(
          (s) => !s.synced && (!eventId || s.eventId === eventId),
        );
        resolve(unsynced);
      };
      request.onerror = () => reject(request.error);
    });
  },

  async markScansSynced(scanIds) {
    const db = await openDB();
    const tx = db.transaction("offlineScans", "readwrite");
    const store = tx.objectStore("offlineScans");

    for (const id of scanIds) {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const item = getReq.result;
        if (item) {
          item.synced = true;
          store.put(item);
        }
      };
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  },
};
