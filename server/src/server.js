import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import { connectDB } from "./config/db.js";

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

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((url) => url.trim())
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

const uploadsPath = path.resolve("uploads");
app.use("/uploads", express.static(uploadsPath));

app.get("/health", (req, res) => res.status(200).send("OK"));

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

app.use((req, res) => {
  res
    .status(404)
    .json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();
