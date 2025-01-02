import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  otp: String,
  createdAt: Date,
  expiresAt: Date,
  userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'admin',
          required: true
      } 

})
export default mongoose.model('otp', otpSchema);