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
      
      
},{timestamps:true});

export default mongoose.model('user',userSchema)