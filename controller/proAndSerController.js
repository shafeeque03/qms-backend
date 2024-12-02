import Product from "../model/productModel.js";
import Service from "../model/serviceModel.js";

export const addProduct = async (req, res) => {
  try {
    const { formdata, adminId } = req.body;
    if (!formdata) {
      return res.status(401).json({ message: "No formData" });
    }
    const product = await Product.create({
      name: formdata.productName,
      price: formdata.price,
      quantity: formdata.quantity,
      adminIs: adminId,
    });
    res.status(201).json({ product, message: "Product added" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const addService = async (req, res) => {
  try {
    const {formdata,adminId} = req.body;
    console.log(formdata,"oko")
    if (!formdata) {
      return res.status(401).json({ message: "No Data" });
    }
    const service = await Service.create({
      name: formdata.serviceName,
      price: formdata.price,
      adminIs:adminId
    });
    res.status(201).json({ service, message: "Service added" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};


export const editProduct = async (req, res) => {
  try {
    const { productId, value } = req.body;
    let product = await Product.findByIdAndUpdate(
      productId,
      {
        name: value.productName,
        price: value.price,
        quantity: value.quantity,
      },
      { new: true }
    );
    res.status(200).json({ product, message: "Product Updated" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const editService = async (req, res) => {
  try {
    const { serviceId, value } = req.body;
    let service = await Service.findByIdAndUpdate(
      serviceId,
      {
        name: value.serviceName,
        price: value.price,
        isAvailable: value.isAvailable,
      },
      { new: true }
    );
    res.status(200).json({ service, message: "Service Updated" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const getProducts = async (req, res) => {
  try {
    const { adminId, page = 1, limit = 10, searchQuery = "" } = req.query;
    if (!adminId) {
      return res.status(400).json({ message: "Admin ID is required" });
    }

    const query = { adminIs: adminId };

    if (searchQuery) {
      query.name = { $regex: `^${searchQuery}`, $options: "i" };
    }

    const totalProducts = await Product.countDocuments(query);

    const products = await Product.find(query)
      .skip((page - 1) * limit) // Pagination: Skip records
      .limit(parseInt(limit)); // Limit records
      
    res.status(200).json({
      products,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts,
      message: "Products fetched successfully!",
    });
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getServices = async (req, res) => {
  try {
    const { adminId, page = 1, limit = 10, searchQuery = "" } = req.query;
    if (!adminId) {
      return res.status(400).json({ message: "Admin ID is required" });
    }

    const query = { adminIs: adminId };

    if (searchQuery) {
      query.name = { $regex: `^${searchQuery}`, $options: "i" };
    }

    const totaServices = await Service.countDocuments(query);
    const services = await Service.find(query)
      .skip((page - 1) * limit) // Pagination: Skip records
      .limit(parseInt(limit)); // Limit records
    res.status(200).json({
      services,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totaServices / limit),
      totaServices,
      message: "Services fetched successfully!",
    });
  } catch (error) {
    console.error("Error fetching services:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const downloadPDF = async(req,res)=>{
  try {
    const{fileName,adminId} = req.query;

    if(!fileName || !adminId){
      return res.status(401).json({message:"Missing credentials"})
    }
    let data;
    if(fileName=='products'){
      data = await Product.find({adminIs:adminId})
    }else if(fileName=='services'){
      data = await Service.find({adminIs:adminId})
    };
  
    res.status(200).json({data})
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }

}