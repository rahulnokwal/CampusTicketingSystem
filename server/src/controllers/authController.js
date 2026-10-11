import { User } from "../models/User.js";
import {
  generateTokens,
  refreshUserSession,
  revokeRefreshToken,
} from "../services/authService.js";
import { sendWelcomeEmail } from "../services/mailService.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie("accessToken", { ...cookieOptions });
  res.clearCookie("refreshToken", { ...cookieOptions, path: "/" });
};

export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = "student",
      clubName,
      inviteCode,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    if (role === "super_admin") {
      return res.status(403).json({
        success: false,
        message:
          "Super Admin accounts cannot be created via public registration",
      });
    }

    const VOLUNTEER_CODE =
      process.env.VOLUNTEER_INVITE_CODE || "CAMPUS_VOLUNTEER_2026";
    const CLUB_ADMIN_CODE =
      process.env.CLUB_ADMIN_INVITE_CODE || "CAMPUS_CLUB_ADMIN_2026";

    let userRole = "student";
    if (role === "volunteer") {
      if (!inviteCode || inviteCode.trim() !== VOLUNTEER_CODE) {
        return res.status(403).json({
          success: false,
          message: "Invalid or missing Volunteer authorization code",
        });
      }
      userRole = "volunteer";
    } else if (role === "club_admin") {
      if (!inviteCode || inviteCode.trim() !== CLUB_ADMIN_CODE) {
        return res.status(403).json({
          success: false,
          message: "Invalid or missing Club Admin authorization code",
        });
      }
      userRole = "club_admin";
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: userRole,
      clubName: userRole === "club_admin" ? clubName || `${name}'s Club` : "",
      isEmailVerified: true,
    });

    const userAgent = req.headers["user-agent"] || "Unknown";
    const { accessToken, refreshToken } = await generateTokens(user, userAgent);

    setAuthCookies(res, accessToken, refreshToken);

    sendWelcomeEmail({
      to: user.email,
      name: user.name,
      role: user.role,
    }).catch((err) => console.error("[Welcome Email Background Error]", err));

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        clubName: user.clubName,
      },
      accessToken,
    });
  } catch (error) {
    console.error("[Register Error]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error during registration",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const userAgent = req.headers["user-agent"] || "Unknown";
    const { accessToken, refreshToken } = await generateTokens(user, userAgent);

    setAuthCookies(res, accessToken, refreshToken);

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        clubName: user.clubName,
      },
      accessToken,
    });
  } catch (error) {
    console.error("[Login Error]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error during login",
    });
  }
};

export const refresh = async (req, res) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!rawRefreshToken) {
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        message: "Refresh token missing. Please sign in again.",
      });
    }

    const userAgent = req.headers["user-agent"] || "Unknown";
    const { accessToken, refreshToken: newRefreshToken } =
      await refreshUserSession(rawRefreshToken, userAgent);

    setAuthCookies(res, accessToken, newRefreshToken);

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      accessToken,
    });
  } catch (error) {
    clearAuthCookies(res);
    return res.status(401).json({
      success: false,
      message: error.message || "Session expired. Please sign in again.",
    });
  }
};

export const logout = async (req, res) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken;
    if (rawRefreshToken) {
      await revokeRefreshToken(rawRefreshToken);
    }
    clearAuthCookies(res);
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    clearAuthCookies(res);
    return res.status(200).json({
      success: true,
      message: "Logged out",
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        clubName: user.clubName,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching user profile",
    });
  }
};
