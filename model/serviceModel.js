import mongoose from "mongoose";

const ServiceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
      },
    description: {
        type: String,
        default: ""
      },
      adminIs: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true
    }

      
      
});

export default mongoose.model('service',ServiceSchema)