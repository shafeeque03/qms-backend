import User from "../model/userModel.js";
import Client from "../model/clientModel.js";
import Product from "../model/productModel.js";
import Service from "../model/serviceModel.js";
import Quotation from "../model/quotationModel.js";

export const createQuotation = async (req, res) => {
  try {
    const {
      products,
      services,
      totalAmount,
      expireDate,
      client,
      createdBy,
      adminId
    } = req.body;
    if(products.length==0 && services.length==0){
      return res.status(400).json({ message:"Please Select Product or Service"});
    }

    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product with ID ${item.product} not found` });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({ message: `Insufficient quantity for product: ${product.name}` });
      }

      product.quantity -= item.quantity;
      await product.save();
    }

    const qtnId = (await Quotation.find({}).countDocuments()) + 1000;

    const newQuotation = new Quotation({
      products,
      services,
      totalAmount,
      expireDate,
      client,
      createdBy,
      quotationId: qtnId,
      adminIs:adminId
    });

    await newQuotation.save();

    res.status(200).json({ message: "Quotation created successfully!" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};



export const changeQtnStatus = async (req, res) => {
    try {
        const { status,reason,qid } = req.body;
      const quotation = await Quotation.findById(qid);
      
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
  
      quotation.status = status;
      if (status === "rejected") {
        quotation.cancelReason = reason;
      }
      if(status==="accepted"){
        quotation.approvedOn = new Date();
      }
  
      await quotation.save();
  
      res.status(200).json({
        message: "Quotation status successfully updated",
        quotation,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Server error" });
    }
  };


export const quotationDetails = async (req, res) => {
    try {
      const { qid } = req.params;
      const quotation = await Quotation.findById(qid)
        .populate({
          path: "products.product",
          select: "name",
        })
        .populate({
          path: "services.service",
          select: "name",
        })
        .populate({
          path: "createdBy",
          select: "name phone email ",
        })
        .populate({
          path: "client",
          select: "name email",
        })
        .populate({
          path: "adminIs",
          select: "name email phone address"
        });
  
      res.status(200).json({ quotation });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Server error" });
    }
  };


