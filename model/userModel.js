import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
      },
      email: {
        type: String,
      },
      phone: {
        type: Number,
        required: true
      },
      loginId: {
        type: String,
        required: true
      },
      password: {
        type:String,
        required:true
      },
      is_blocked: {
        type: Boolean,
        default:false
      },
      adminIs: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true
    }
      
      
},{timestamps:true});

export default mongoose.model('user',userSchema)