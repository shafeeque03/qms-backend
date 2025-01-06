import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
      },
    email: {
        type: String,
        required: true
      },
      phone:{
        type: String,
        default: ""
      },
      address:{
        type: String,
        default:""
      },
      logo:{
        type: String,
        default: ""
      },
      adminIs: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true
    }    
});

export default mongoose.model('company',companySchema)