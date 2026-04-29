import mongoose from "mongoose";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, "Username must be at least 3 characters long"],
    index: true
  },

  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"],
    select: false
  },

  role: {
    type: String,
    enum: ["admin", "agent", "user"],
    default: "user"
  },

  balance: {
    type: Number,
    default: 0,
    min: [0, "Balance cannot be negative"]
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
    required: function () {
      return this.role === "user"; // only users MUST have creator
    }
  }

}, { timestamps: true });

// 🔐 Hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 🔑 Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);