import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";
import { seedDatabaseIfEmpty } from "./utils/seed.js";

// Route imports
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import checkinRoutes from "./routes/checkinRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import seatRoutes from "./routes/seatRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import settlementRoutes from "./routes/settlementRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

const uploadsPath = path.resolve("uploads");
app.use("/uploads", express.static(uploadsPath));

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/checkin", checkinRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/settlements", settlementRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "online",
    service: "Campus Life Event & Ticketing API",
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((err, req, res, next) => {
  console.error("[Global Error Handler]", err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

const startServer = async () => {
  await connectDB();
  await seedDatabaseIfEmpty();

  app.listen(PORT, () => {
    console.log(`🚀 [Campus Life Server] Running on http://localhost:${PORT}`);
  });
};

startServer();
