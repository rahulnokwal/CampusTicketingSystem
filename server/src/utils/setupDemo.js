import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Event } from "../models/Event.js";
import { Registration } from "../models/Registration.js";
import QRCode from "qrcode";
import jwt from "jsonwebtoken";

const QR_SECRET =
  process.env.JWT_QR_SECRET ||
  "campus_life_qr_payload_secret_key_tamper_proof_32_bytes";

const seedDemoAccounts = async () => {
  await connectDB();

  console.log("[Setup] Upserting demo accounts...");

  const accounts = [
    {
      name: "Rahul Student",
      email: "student@campus.edu",
      password: "password123",
      role: "student",
      isEmailVerified: true,
    },
    {
      name: "DevSoc President",
      email: "club@campus.edu",
      password: "password123",
      role: "club_admin",
      clubName: "Developers & Innovators Society",
      isEmailVerified: true,
    },
    {
      name: "Alex Volunteer",
      email: "volunteer@campus.edu",
      password: "password123",
      role: "volunteer",
      isEmailVerified: true,
    },
    {
      name: "Campus Provost",
      email: "admin@campus.edu",
      password: "password123",
      role: "super_admin",
      isEmailVerified: true,
    },
  ];

  for (const acc of accounts) {
    const existing = await User.findOne({ email: acc.email });
    if (!existing) {
      await User.create(acc);
      console.log(`Created account: ${acc.email} (${acc.role})`);
    } else {
      existing.name = acc.name;
      existing.password = acc.password;
      existing.role = acc.role;
      if (acc.clubName) existing.clubName = acc.clubName;
      await existing.save();
      console.log(`Updated account: ${acc.email} (${acc.role})`);
    }
  }

  const student = await User.findOne({ email: "student@campus.edu" });
  const clubAdmin = await User.findOne({ email: "club@campus.edu" });

  let event = await Event.findOne({
    title: "HackCampus 2026: 36-Hour Hackathon",
  });
  if (!event) {
    const hackDate = new Date();
    hackDate.setDate(hackDate.getDate() + 7);
    event = await Event.create({
      title: "HackCampus 2026: 36-Hour Hackathon",
      description:
        "The premier inter-college tech hackathon! Build innovative web, mobile, and AI solutions over an intense 36 hours. Free meals, energy drinks, exclusive sponsor swags, and prizes worth $5,000 for top 3 teams.",
      category: "Tech",
      venue: "Main Auditorium & Innovation Lab C",
      date: hackDate,
      capacity: 150,
      registeredCount: 0,
      price: 0,
      club: "Developers & Innovators Society",
      createdBy: clubAdmin._id,
      status: "PUBLISHED",
      banner:
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80",
    });
    console.log("Created HackCampus event");
  }

  const eventCount = await Event.countDocuments({ status: "PUBLISHED" });
  if (eventCount < 4) {
    const aiDate = new Date();
    aiDate.setDate(aiDate.getDate() + 10);
    await Event.create({
      title: "Applied Generative AI Masterclass",
      description:
        "Hands-on workshop building multimodal agents and LLM applications using Google Gemini API. Certificates and exclusive developer credits included.",
      category: "Workshop",
      venue: "Innovation Block Computer Lab 3",
      date: aiDate,
      capacity: 80,
      registeredCount: 0,
      price: 199,
      club: "Developers & Innovators Society",
      createdBy: clubAdmin._id,
      status: "PUBLISHED",
      banner:
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
    });

    const festDate = new Date();
    festDate.setDate(festDate.getDate() + 18);
    await Event.create({
      title: "AuraFest 2026: Campus EDM & Cultural Night",
      description:
        "The biggest campus festival featuring headline live bands, DJs, dance battles, food carnival, and gaming arena. Gates open 5 PM.",
      category: "Cultural",
      venue: "Open Air Amphitheatre",
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
  }

  const existingTicket = await Registration.findOne({
    student: student._id,
    event: event._id,
  });

  if (!existingTicket) {
    const ticketCode = `CL-${Date.now().toString(36).toUpperCase()}-DEMO`;
    const qrPayload = jwt.sign(
      {
        ticketCode,
        eventId: event._id.toString(),
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
      event: event._id,
      student: student._id,
      ticketCode,
      qrPayload,
      qrDataUrl,
      status: "BOOKED",
    });

    await Event.findByIdAndUpdate(event._id, { $inc: { registeredCount: 1 } });
    console.log(`Created sample ticket: ${ticketCode}`);
  }

  console.log("[Setup] Demo accounts and sample data verified!");
  process.exit(0);
};

seedDemoAccounts().catch((err) => {
  console.error(err);
  process.exit(1);
});
