import { Request, Response, NextFunction } from "express";
import userModel from "../models/user_model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const register = async (req: Request, res: Response) => {
  const email = req.body.email;
  const password = req.body.password;
  const username = req.body.username;
  if (!email || !password || !username) {
    res.status(400).json({
      status: "error",
      message: "missing email, username or password",
    });
    return;
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await userModel.create({
      email: email,
      password: hashedPassword,
      username: username,
    });
    const tokens = generateTokens(user._id.toString());
    if (!tokens) {
      res.status(500).json({
        status: "error",
        message: "Token generation failed",
      });
      return;
    }
    user.refreshTokens = [tokens.refreshToken];
    await user.save();

    res.status(201).json({
      status: "success",
      data: {
        userId: user._id,
        username: user.username,
        email: user.email,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

const generateTokens = (
  _id: string
): { accessToken: string; refreshToken: string } | null => {
  try {
    const secret = process.env.TOKEN_SECRET;
    if (!secret) {
      throw new Error("TOKEN_SECRET is not set");
    }

    const accessToken = jwt.sign({ _id }, secret, { expiresIn: "1h" });
    const refreshToken = jwt.sign({ _id }, secret, { expiresIn: "7d" });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating tokens:", error);
    return null;
  }
};

const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        status: "error",
        message: "Missing email or password",
      });
      return;
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
      return;
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
      return;
    }

    const tokens = generateTokens(user._id.toString());
    if (!tokens) {
      res.status(500).json({
        status: "error",
        message: "Failed to generate tokens",
      });
      return;
    }

    // Add refresh token to user's refreshTokens array
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push(tokens.refreshToken);
    await user.save();

    res.status(200).json({
      status: "success",
      data: {
        userId: user._id,
        username: user.username,
        email: user.email,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

const logout = async (req: Request, res: Response) => {
  const refreshToken = req.body.refreshToken;
  if (!refreshToken) {
    res.status(400).send("missing refresh token");
    return;
  }
  if (!process.env.TOKEN_SECRET) {
    res.status(400).send("missing auth configuration");
    return;
  }
  jwt.verify(
    refreshToken,
    process.env.TOKEN_SECRET,
    async (err: any, data: any) => {
      if (err) {
        res.status(403).send("invalid token");
        return;
      }
      const payload = data as TokenPayload;
      try {
        const user = await userModel.findOne({ _id: payload._id });
        if (!user) {
          res.status(400).send("invalid token");
          return;
        }
        if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
          res.status(400).send("invalid token");
          user.refreshTokens = [];
          await user.save();
          return;
        }
        const tokens = user.refreshTokens.filter(
          (token) => token !== refreshToken
        );
        user.refreshTokens = tokens;
        await user.save();
        res.status(200).send("logged out");
      } catch (err) {
        res.status(400).send("invalid token");
      }
    }
  );
};

const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.body.refreshToken;
  if (!refreshToken) {
    res.status(400).send("invalid token");
    return;
  }
  if (!process.env.TOKEN_SECRET) {
    res.status(400).send("missing auth configuration");
    return;
  }
  jwt.verify(
    refreshToken,
    process.env.TOKEN_SECRET,
    async (err: any, data: any) => {
      if (err) {
        res.status(403).send("invalid token");
        return;
      }
      const payload = data as TokenPayload;
      try {
        const user = await userModel.findOne({ _id: payload._id });
        if (!user) {
          res.status(400).send("invalid token");
          return;
        }
        if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
          user.refreshTokens = [];
          await user.save();
          res.status(400).send("invalid token");
          return;
        }
        const newTokens = generateTokens(user._id.toString());
        if (!newTokens) {
          user.refreshTokens = [];
          await user.save();
          res.status(400).send("missing auth configuration");
          return;
        }

        user.refreshTokens = user.refreshTokens.filter(
          (token) => token !== refreshToken
        );
        user.refreshTokens.push(newTokens.refreshToken);
        await user.save();

        res.status(200).send({
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
        });
      } catch (err) {
        res.status(400).send("invalid token");
      }
    }
  );
};

type TokenPayload = {
  _id: string;
  random: number;
};

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({
        status: "error",
        message: "No authorization header",
      });
      return;
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      res.status(401).json({
        status: "error",
        message: "Authorization format must be: Bearer <token>",
      });
      return;
    }

    const token = parts[1];
    const secret = process.env.TOKEN_SECRET || "fallback_secret_key";

    try {
      const decoded = jwt.verify(token, secret) as TokenPayload;
      req.query.userId = decoded._id;
      next();
    } catch (jwtError) {
      console.log("JWT Verification failed:", jwtError);
      res.status(403).json({
        status: "error",
        message: "Invalid token",
      });
    }
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({
      status: "error",
      message: "Authentication error",
    });
  }
};

export { register, login, logout, refresh };
