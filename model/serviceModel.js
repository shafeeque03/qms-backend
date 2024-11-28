import mongoose from "mongoose";

const ServiceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true
      },
      isAvailable: {
        type: Boolean,
        default:true
      },
      adminIs: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true
    }

      
      
});

export default mongoose.model('service',ServiceSchema)