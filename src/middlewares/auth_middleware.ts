import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1]; // Extract the token from "Bearer <token>"

  if (!token) {
    res.status(401).json({ message: "Missing token" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    (req as any).userId = decoded.userId; // Add userId to the request object
    next(); // Allow the request to proceed
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired token" });
  }
};