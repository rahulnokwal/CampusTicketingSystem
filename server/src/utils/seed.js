import { User } from "../models/User.js";
import { Event } from "../models/Event.js";
import { Registration } from "../models/Registration.js";
import QRCode from "qrcode";
import jwt from "jsonwebtoken";

const QR_SECRET =
  process.env.JWT_QR_SECRET ||
  "campus_life_qr_payload_secret_key_tamper_proof_32_bytes";

export const seedDatabaseIfEmpty = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return;
    }

    console.log(
      "[Seeder] Empty database detected. Seeding sample campus accounts and events...",
    );

    const superAdmin = await User.create({
      name: "Campus Provost",
      email: "admin@campus.edu",
      password: "password123",
      role: "super_admin",
      isEmailVerified: true,
    });

    const clubAdmin = await User.create({
      name: "DevSoc President",
      email: "club@campus.edu",
      password: "password123",
      role: "club_admin",
      clubName: "Developers & Innovators Society",
      isEmailVerified: true,
    });

    const volunteer = await User.create({
      name: "Alex Volunteer",
      email: "volunteer@campus.edu",
      password: "password123",
      role: "volunteer",
      isEmailVerified: true,
    });

    const student = await User.create({
      name: "Rahul Student",
      email: "student@campus.edu",
      password: "password123",
      role: "student",
      isEmailVerified: true,
    });

    const hackathonDate = new Date();
    hackathonDate.setDate(hackathonDate.getDate() + 7);
    hackathonDate.setHours(10, 0, 0);

    const workshopDate = new Date();
    workshopDate.setDate(workshopDate.getDate() + 14);
    workshopDate.setHours(14, 0, 0);

    const festDate = new Date();
    festDate.setDate(festDate.getDate() + 21);
    festDate.setHours(18, 0, 0);

    const esportsDate = new Date();
    esportsDate.setDate(esportsDate.getDate() + 3);
    esportsDate.setHours(16, 0, 0);

    const event1 = await Event.create({
      title: "HackCampus 2026: 36-Hour Hackathon",
      description:
        "The premier inter-college tech hackathon! Build innovative web, mobile, and AI solutions over an intense 36 hours. Free meals, energy drinks, exclusive sponsor swags, and prizes worth $5,000 for top 3 teams.",
      category: "Tech",
      venue: "Main Auditorium & Innovation Lab C",
      date: hackathonDate,
      capacity: 150,
      registeredCount: 1,
      price: 0,
      club: "Developers & Innovators Society",
      createdBy: clubAdmin._id,
      status: "PUBLISHED",
      banner:
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80",
    });

    const event2 = await Event.create({
      title: "Applied Generative AI & LLM Systems Workshop",
      description:
        "A comprehensive masterclass on building real-world AI applications with Google Gemini API, LangChain, and Vector DBs. Bring your laptops. Certificates provided upon completing hands-on project.",
      category: "Workshop",
      venue: "Science Block Seminar Hall 2",
      date: workshopDate,
      capacity: 80,
      registeredCount: 0,
      price: 199,
      club: "Developers & Innovators Society",
      createdBy: clubAdmin._id,
      status: "PUBLISHED",
      banner:
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
    });

    const event3 = await Event.create({
      title: "AuraFest 2026: Annual Cultural & EDM Night",
      description:
        "The campus cultural extravaganza featuring live music bands, DJ sets, food trucks, street dance battles, and fashion showcase. Gates open at 5:00 PM. High security wristband check-in required.",
      category: "Cultural",
      venue: "Campus Open Air Amphitheatre",
      date: festDate,
      capacity: 500,
      registeredCount: 0,
      price: 350,
      club: "Cultural Affairs Council",
      createdBy: clubAdmin._id,
      status: "PUBLISHED",
      banner:
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80",
    });

    const event4 = await Event.create({
      title: "Campus Valorant & FC26 Esports Championship",
      description:
        "5v5 tactical shooter and console football tournament! Battle against top campus squads on low-latency LAN gaming rigs with live caster commentary and streaming in Student Center.",
      category: "Gaming",
      venue: "Student Recreation Complex",
      date: esportsDate,
      capacity: 64,
      registeredCount: 0,
      price: 50,
      club: "Campus Gaming Guild",
      createdBy: clubAdmin._id,
      status: "PUBLISHED",
      banner:
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80",
    });

    const ticketCode = `CL-DEMO-${Date.now().toString(36).toUpperCase()}`;
    const qrPayload = jwt.sign(
      {
        ticketCode,
        eventId: event1._id.toString(),
        studentId: student._id.toString(),
        type: "CAMPUS_LIFE_TICKET",
      },
      QR_SECRET,
      { expiresIn: "30d" },
    );

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: "H",
      width: 320,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" },
    });

    await Registration.create({
      event: event1._id,
      student: student._id,
      ticketCode,
      qrPayload,
      qrDataUrl,
      status: "BOOKED",
    });

    console.log(
      "[Seeder] Successfully seeded initial demo users, events, and sample ticket!",
    );
  } catch (err) {
    console.error("[Seeder Error]", err.message);
  }
};
