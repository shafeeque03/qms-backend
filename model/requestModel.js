import mongoose from "mongoose";

const RequestSchema = new mongoose.Schema(
  {
    note: {
      type: String,
      default: "",
    },
    adminIs: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admin",
      required: true,
    },
    approveStatus: {
      type: String,
      default: "pending",
    },
    requestId: {
      type: Number,
      required: true,
    },
    createdBy: {
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
      },
      isAdmin: {
        type: Boolean,
      },
      id: {
        type: String,
      },
    },
    isQuotCreated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Adds `createdAt` and `updatedAt` fields
  }
);

export default mongoose.model("request", RequestSchema);
