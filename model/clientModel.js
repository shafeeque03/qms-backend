import mongoose from "mongoose";

const ClientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    address: {
        type: String,
        default: ""
    },
    phone: {
        type: Number,
    },
    adminIs: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true
    }
}, { timestamps: true });

export default mongoose.model('client', ClientSchema);
