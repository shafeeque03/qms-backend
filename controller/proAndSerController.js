import Product from "../model/productModel.js";
import Service from "../model/serviceModel.js";



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