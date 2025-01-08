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
        name:{
            type:String,
            required: true
        },
        email:{
            type:String
        },
        isAdmin:{
            type: Boolean
        },
        id:{
            type: String
        }
    },
    statusChangedBy:{
        name:{
            type:String,
        },
        email:{
            type:String
        },
    },
    canEdit:{
        type: Boolean,
        default: true
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'client',
        required: true
    },
    company: {
        name: {
          type: String,
          default: ""
        },
        email: {
          type: String,
          default: ""
        },
        phone: {
          type: String,
        },
        address: {
          type: String,
        },
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'company',
            required: true
        },
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
