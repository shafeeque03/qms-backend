import mongoose from "mongoose";

const QuotationSchema = new mongoose.Schema({
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        }
    }],
    services: [{
        service: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'service',
            required: true
        }
    }],
    description: {
        type: String,
        default: ''
    },
    totalAmount: {
        type: Number,
        required: true
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
    expireDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'client',
        required: true
    }
}, { timestamps: true });

export default mongoose.model('quotation', QuotationSchema);
