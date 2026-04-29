import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1. Check if token exists and is formatted properly
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided."
      });
    }

    // 2. Extract and verify token
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🚀 OPTION A: The Stateless Way (Best Performance)
    // If you signed the token with { userId, role }, just use the decoded data!
    // req.user = decoded; 
    // return next();

    // 🐌 OPTION B: The Stateful Way (If you MUST check if the user still exists/is active)
    // 🔥 Added .lean() to make the query much faster since we don't need to save() this document
    const user = await User.findById(decoded.userId).lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User associated with this token no longer exists."
      });
    }

    req.user = user;
    next();

  } catch (error) {
    // 🔥 Provide specific feedback if the token is simply expired
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please log in again."
      });
    }

    // Catch-all for tampered or malformed tokens
    res.status(401).json({
      success: false,
      message: "Invalid token."
    });
  }
};