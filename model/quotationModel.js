import mongoose from "mongoose";

const QuotationSchema = new mongoose.Schema({
    products: [{
        name: {
            type: String,
            required:true
        },
        description:{
            type: String,
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
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
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
    },
    tax: {
        type: Number,
    },
    taxName: {
        type: String,
        default:"Tax"
    },
    subTotal: {
        type: Number,
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
    from: {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            // required: true
        },
        phone: {
            type: String,
            // required: true
        },
        address: {
            type: String,
            // required: true
        }
    },
    adminIs: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true
    },
    approvedOn: {
        type: Date,
    },
    fileUrl: {
        type: Array,
    },
    proposal: {
        type: String,
        // required: true
    },
    publicId: {
        type: String,
        // required: true
    }
}, { timestamps: true });

export default mongoose.model('quotation', QuotationSchema);
