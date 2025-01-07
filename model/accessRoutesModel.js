import mongoose from "mongoose";

const AccessRoutesSchema = new mongoose.Schema({
    routes: {
        type: [String],
        default: [],
      },
      adminIs: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true
    }    
});

export default mongoose.model('AccessRoute',AccessRoutesSchema)