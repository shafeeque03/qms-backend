import Product from "../model/productModel.js";
import Service from "../model/serviceModel.js";

export const addProduct = async (req, res) => {
  try {
    const { formdata } = req.body;
    if (!formdata) {
      return res.status(401).json({ message: "No UserData" });
    }
    const product = await Product.create({
      name: formdata.productName,
      price: formdata.price,
      quantity: formdata.quantity,
    });
    res.status(200).json({ product,message: "Product added" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const addService = async (req, res) => {
  try {
    const { formdata } = req.body;
    if (!formdata) {
      return res.status(401).json({ message: "No Data" });
    }
    const service = await Service.create({
      name: formdata.serviceName,
      price: formdata.servicePrice,
    });
    res.status(200).json({ service,message: "Service added" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const getAllData = async (req, res) => {
  try {
    const services = await Service.find({})
    const products = await Product.find({});
    res.status(200).json({services,products})
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const editProduct = async(req,res)=>{
    try {
        const{productId,value} = req.body;
        let product = await Product.findByIdAndUpdate(productId,{
            name:value.name,
            price:value.price,
            quantity:value.quantity
        },{new:true});
        res.status(200).json({product,message:"Product Updated"})
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ status: "Internal Server Error" });        
    }
}

export const editService = async(req,res)=>{
    try {
        const{serviceId,value} = req.body;
        let service = await Service.findByIdAndUpdate(serviceId,{
            name:value.name,
            price:value.price,
            isAvailable:value.isAvailable
        },{new:true});
        res.status(200).json({service,message:"Service Updated"})
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ status: "Internal Server Error" });        
    }
}