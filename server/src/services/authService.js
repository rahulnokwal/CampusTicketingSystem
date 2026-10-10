import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "../models/User.js";
import { RefreshToken } from "../models/RefreshToken.js";

const ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ||
  "campus_life_access_jwt_secret_key_super_secure_32_bytes_min";
const REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  "campus_life_refresh_jwt_secret_key_super_secure_32_bytes_min";
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const generateTokens = async (user, userAgent = "Unknown") => {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name,
    clubName: user.clubName || "",
  };

  const accessToken = jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
  });

  const rawRefreshToken = crypto.randomBytes(40).toString("hex");
  const tokenHash = hashToken(rawRefreshToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshToken.create({
    user: user._id,
    tokenHash,
    expiresAt,
    userAgent,
  });

  return { accessToken, refreshToken: rawRefreshToken };
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_SECRET);
};

export const refreshUserSession = async (
  rawRefreshToken,
  userAgent = "Unknown",
) => {
  if (!rawRefreshToken) {
    throw new Error("No refresh token provided");
  }

  const tokenHash = hashToken(rawRefreshToken);
  const storedToken = await RefreshToken.findOne({ tokenHash });

  if (!storedToken) {
    throw new Error("Invalid or revoked refresh token");
  }

  if (new Date() > storedToken.expiresAt) {
    await RefreshToken.deleteOne({ _id: storedToken._id });
    throw new Error("Refresh token has expired");
  }

  const user = await User.findById(storedToken.user);
  if (!user) {
    await RefreshToken.deleteOne({ _id: storedToken._id });
    throw new Error("User not found");
  }

  await RefreshToken.deleteOne({ _id: storedToken._id });

  return generateTokens(user, userAgent);
};

export const revokeRefreshToken = async (rawRefreshToken) => {
  if (!rawRefreshToken) return;
  const tokenHash = hashToken(rawRefreshToken);
  await RefreshToken.deleteOne({ tokenHash });
};

export const revokeAllUserTokens = async (userId) => {
  await RefreshToken.deleteMany({ user: userId });
};
