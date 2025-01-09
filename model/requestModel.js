import mongoose from "mongoose";

const RequestSchema = new mongoose.Schema({
  note: {
    type: String,
    default: "",
  },
  adminIs: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "admin",
    required: true,
  },
  isApproved:{
    type: Boolean,
    default: false
  },
  requestId: {
    type: Number,
    required: true,
  },
  createdBy: {
    
  }
});

export default mongoose.model("request", RequestSchema);
