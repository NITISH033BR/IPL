import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
  try {
    // 1. Get Authorization header
    const authHeader = req.headers.authorization;

    // 2. Check if header exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }

    // 3. Extract token
    const token = authHeader.split(" ")[1];

    // 4. Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "supersecretkey"
    );

    // 5. Attach user data to request
    req.user = decoded;

    // 6. Continue
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};

export default verifyToken;