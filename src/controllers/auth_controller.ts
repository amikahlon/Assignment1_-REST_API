import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserModel, { IUser } from "../models/user_model";
import mongoose from "mongoose";

const generateTokens = (
  userId: string
): { accessToken: string; refreshToken: string } | null => {
  if (!process.env.JWT_SECRET || !process.env.REFRESH_SECRET) return null;

  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

// Add custom interface for Request
interface AuthRequest extends Request {
  userId?: string;
}

// Add error interface
interface CustomError {
  message: string;
  code?: number;
}

// Register
export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, username } = req.body;
  if (!email || !password || !username) {
    res.status(400).json({ message: "Missing fields" });
    return;
  }

  try {
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "Email already in use" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new UserModel({ email, password: hashedPassword, username });
    const savedUser = await user.save();

    res
      .status(201)
      .json({ message: "User registered successfully", userId: savedUser._id });
  } catch (error: unknown) {
    const err = error as CustomError;
    res.status(500).json({ error: err.message || "Unknown error occurred" });
  }
};

// Login
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email?.trim() || !password?.trim()) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const tokens = generateTokens(user._id.toString());
    if (!tokens) {
      res.status(500).json({ message: "Token generation failed" });
      return;
    }

    user.refreshTokens.push(tokens.refreshToken);
    await user.save();

    res
      .status(200)
      .json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
  } catch (error: unknown) {
    if (error instanceof mongoose.Error) {
      res.status(500).json({ message: "Database error" });
      return;
    }
    const err = error as CustomError;
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};

// Logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ message: "Missing refresh token" });
    return;
  }

  try {
    const user = await UserModel.findOne({ refreshTokens: refreshToken });
    if (!user) {
      res.status(400).json({ message: "Invalid token" });
      return;
    }

    user.refreshTokens = user.refreshTokens.filter(
      (token) => token !== refreshToken
    );
    await user.save();

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error: unknown) {
    const err = error as CustomError;
    res.status(500).json({ error: err.message || "Unknown error occurred" });
  }
};

// Refresh Token
export const refresh = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ message: "Missing refresh token" });
    return;
  }

  try {
    const decoded: any = jwt.verify(refreshToken, process.env.REFRESH_SECRET!);
    const user = await UserModel.findById(decoded.userId);
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      res.status(400).json({ message: "Invalid token" });
      return;
    }

    const tokens = generateTokens(user._id.toString());
    if (!tokens) {
      res.status(500).json({ message: "Token generation failed" });
      return;
    }

    user.refreshTokens = user.refreshTokens.filter(
      (token) => token !== refreshToken
    );
    user.refreshTokens.push(tokens.refreshToken);
    await user.save();

    res
      .status(200)
      .json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
  } catch (error: unknown) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({ message: "Invalid refresh token" });
      return;
    }
    const err = error as CustomError;
    res
      .status(403)
      .json({ message: err.message || "Token verification failed" });
  }
};

// Auth Middleware
export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };
    req.userId = decoded.userId; // Store in request object instead of query
    next();
  } catch (error: unknown) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(403).json({ message: "Token expired" });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ message: "Invalid token" });
    }
    const err = error as CustomError;
    res
      .status(403)
      .json({ message: err.message || "Token verification failed" });
  }
};
