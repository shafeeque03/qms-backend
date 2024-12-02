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
        },
        price: {
            type: Number,
            required: true
        }
    }],
    services: [{
        service: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'service',
            required: true
        },
        price: {
            type: Number,
            required: true
        }
    }],
    quotationId:{
        type: Number,
        required: true
    },
    cancelReason: {
        type: String,
        default: ''
    },
    totalAmount: {
        type: Number,
        required: true
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
    },
    adminIs: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true
    },
    approvedOn: {
        type: Date,
    },
}, { timestamps: true });

export default mongoose.model('quotation', QuotationSchema);
