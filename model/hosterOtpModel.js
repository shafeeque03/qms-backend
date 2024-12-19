import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: String,
  otp: String,
  createdAt: Date,
  expiresAt: Date,
});
export default mongoose.model("Hotp", otpSchema);
