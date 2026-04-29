import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 🔍 Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password required"
      });
    }

    // 🔍 Find user (include password)
    const user = await User.findOne({ username }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    // 🔐 Compare password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    // 🔑 Generate token (safe fallback)
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role
      },
      process.env.JWT_SECRET || "supersecretkey",
      { expiresIn: "1d" }
    );

    // 🚀 Success response
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        balance: user.balance
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};