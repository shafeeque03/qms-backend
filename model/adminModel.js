import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // Ensures no duplicate email entries
    },
    phone: {
      type: Number,
      required: true,
    },
    address: {
      address1: {
        type: String,
        required: true,
      },
      address2: {
        type: String,
      },
      pincode: {
        type: Number,
        required: true,
      },
    },
    password: {
      type: String,
      required: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("admin", adminSchema);