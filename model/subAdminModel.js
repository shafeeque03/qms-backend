import mongoose from "mongoose";

const subAdminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    phone: {
      type: Number,
      required: true,
    },
    loginId: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    passwordTries: {
      type: Number,
      default: 0,
    },
    adminIs: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admin",
      required: true,
    },
    accessRoutes: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccessRoute",
      required: true,
    },
    isSuper: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("subAdmin", subAdminSchema);
