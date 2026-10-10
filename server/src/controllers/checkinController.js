import jwt from 'jsonwebtoken';
import { Registration } from '../models/Registration.js';
import { CheckIn } from '../models/CheckIn.js';
import { Event } from '../models/Event.js';
import { User } from '../models/User.js';

const QR_SECRET =
  process.env.JWT_QR_SECRET || 'campus_life_qr_payload_secret_key_tamper_proof_32_bytes';

export const verifyAndCheckInTicket = async (req, res) => {
  const { qrPayload, eventId } = req.body;
  const volunteerId = req.user.userId;

  if (!qrPayload) {
    return res.status(400).json({
      success: false,
      result: 'INVALID',
      message: 'No QR payload provided',
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(qrPayload, QR_SECRET);
  } catch (jwtErr) {
    await CheckIn.create({
      registration: null,
      event: eventId || null,
      scannedBy: volunteerId,
      ticketCode: 'TAMPERED_OR_EXPIRED',
      result: 'INVALID',
      notes: `JWT Verification Failed: ${jwtErr.message}`,
    }).catch(() => {});

    return res.status(400).json({
      success: false,
      result: 'INVALID',
      message: 'Tampered or expired QR ticket. Verification failed.',
    });
  }

  const { ticketCode, eventId: payloadEventId, studentId } = decoded;


  if (eventId && eventId !== payloadEventId) {
    await CheckIn.create({
      registration: null,
      event: eventId,
      scannedBy: volunteerId,
      ticketCode,
      result: 'WRONG_EVENT',
      notes: `Expected event ${eventId}, but ticket is for ${payloadEventId}`,
    }).catch(() => {});

    return res.status(400).json({
      success: false,
      result: 'WRONG_EVENT',
      message: 'Ticket is valid, but issued for a different event!',
    });
  }


  const registration = await Registration.findOne({ ticketCode })
    .populate('student', 'name email role')
    .populate('event', 'title venue date club');

  if (!registration) {
    await CheckIn.create({
      registration: null,
      event: payloadEventId,
      scannedBy: volunteerId,
      ticketCode,
      result: 'INVALID',
      notes: 'Registration record not found in database',
    }).catch(() => {});

    return res.status(404).json({
      success: false,
      result: 'INVALID',
      message: 'Ticket record not found in campus system.',
    });
  }


  if (registration.status === 'CHECKED_IN') {
    await CheckIn.create({
      registration: registration._id,
      event: registration.event._id,
      scannedBy: volunteerId,
      ticketCode,
      result: 'ALREADY_USED',
      notes: `Already checked in at ${registration.checkedInAt}`,
    }).catch(() => {});

    return res.status(409).json({
      success: false,
      result: 'ALREADY_USED',
      message: `TICKET ALREADY USED! Checked in on ${new Date(
        registration.checkedInAt
      ).toLocaleTimeString()}`,
      checkedInAt: registration.checkedInAt,
      student: registration.student,
      event: registration.event,
    });
  }


  const updatedRegistration = await Registration.findOneAndUpdate(
    { _id: registration._id, status: 'BOOKED' },
    {
      $set: {
        status: 'CHECKED_IN',
        checkedInAt: new Date(),
      },
    },
    { new: true }
  )
    .populate('student', 'name email role')
    .populate('event', 'title venue date club');

  if (!updatedRegistration) {
    return res.status(409).json({
      success: false,
      result: 'ALREADY_USED',
      message: 'Concurrent check-in detected. Ticket was just used.',
    });
  }


  await CheckIn.create({
    registration: updatedRegistration._id,
    event: updatedRegistration.event._id,
    scannedBy: volunteerId,
    ticketCode,
    result: 'VALID',
    notes: 'Access granted by volunteer scanner',
  });

  return res.status(200).json({
    success: true,
    result: 'VALID',
    message: 'ENTRY GRANTED! Valid admission pass verified.',
    attendee: {
      ticketCode: updatedRegistration.ticketCode,
      seatLabel: updatedRegistration.seatLabel || null,
      name: updatedRegistration.student?.name,
      email: updatedRegistration.student?.email,
      eventTitle: updatedRegistration.event?.title,
      checkedInAt: updatedRegistration.checkedInAt,
    },
  });
};

export const getAttendeeManifest = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const registrations = await Registration.find({
      event: eventId,
      status: { $in: ['BOOKED', 'CHECKED_IN'] },
    })
      .populate('student', 'name email')
      .lean();

    const manifest = registrations.map((reg) => ({
      ticketCode: reg.ticketCode,
      qrPayload: reg.qrPayload,
      studentName: reg.student?.name || 'Student Attendee',
      studentEmail: reg.student?.email || '',
      seatLabel: reg.seatLabel || '',
      status: reg.status,
      checkedInAt: reg.checkedInAt || null,
    }));

    return res.status(200).json({
      success: true,
      event: {
        id: event._id,
        title: event.title,
        venue: event.venue,
        date: event.date,
      },
      count: manifest.length,
      manifest,
      downloadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Manifest Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate offline manifest',
    });
  }
};

export const syncOfflineCheckIns = async (req, res) => {
  try {
    const { eventId, scans } = req.body;
    const volunteerId = req.user.userId;

    if (!Array.isArray(scans) || scans.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No offline scans provided to sync',
      });
    }

    const results = [];
    let syncedCount = 0;

    for (const scan of scans) {
      const { ticketCode, scannedAt } = scan;

      const registration = await Registration.findOne({ ticketCode, event: eventId });
      if (!registration) {
        results.push({ ticketCode, status: 'NOT_FOUND' });
        continue;
      }

      if (registration.status === 'CHECKED_IN') {
        results.push({ ticketCode, status: 'ALREADY_CHECKED_IN' });
        continue;
      }

      const updated = await Registration.findOneAndUpdate(
        { _id: registration._id, status: 'BOOKED' },
        {
          $set: {
            status: 'CHECKED_IN',
            checkedInAt: scannedAt ? new Date(scannedAt) : new Date(),
          },
        },
        { new: true }
      );

      if (updated) {
        await CheckIn.create({
          registration: updated._id,
          event: eventId,
          scannedBy: volunteerId,
          ticketCode,
          result: 'VALID',
          notes: 'Processed via offline sync queue',
        });
        syncedCount++;
        results.push({ ticketCode, status: 'SYNCED' });
      } else {
        results.push({ ticketCode, status: 'CONFLICT' });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Successfully synchronized ${syncedCount} offline scan(s)`,
      syncedCount,
      results,
    });
  } catch (error) {
    console.error('[Sync Offline Scans Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to synchronize offline scans',
    });
  }
};

export const getCheckInHistory = async (req, res) => {
  try {
    const { eventId } = req.query;
    const filter = {};
    if (eventId) filter.event = eventId;

    const checkIns = await CheckIn.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('scannedBy', 'name email')
      .populate('event', 'title');

    return res.status(200).json({
      success: true,
      count: checkIns.length,
      checkIns,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve check-in audit logs',
    });
  }
};
