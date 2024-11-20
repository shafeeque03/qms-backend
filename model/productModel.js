import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
    name: {
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
      },    
});

export default mongoose.model('product',ProductSchema)