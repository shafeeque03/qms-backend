import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { serialize } from "cookie";
import User from "../model/userModel.js";
import Client from "../model/clientModel.js";
import Quotation from "../model/quotationModel.js";
import Product from "../model/productModel.js";
import Service from "../model/serviceModel.js";
import cloudinary from "../util/cloudinary.js";

export const userDashData = async (req, res) => {
  const { user } = req.query;

  if (!user) {
    return res.status(400).json({ message: "User data is required" });
  }

  try {
    // Fetch total quotations created by the user with the specified admin status
    const totalQuotations = await Quotation.countDocuments({
      createdBy: user._id,
      adminIs: user.adminIs,
    });

    // Fetch count of quotations grouped by their statuses
    const approvedQuotations = await Quotation.countDocuments({
      createdBy: user._id,
      adminIs: user.adminIs,
      status: "accepted",
    });

    const rejectedQuotations = await Quotation.countDocuments({
      createdBy: user._id,
      adminIs: user.adminIs,
      status: "rejected",
    });

    const pendingQuotations = await Quotation.countDocuments({
      createdBy: user._id,
      adminIs: user.adminIs,
      status: "pending",
    });

    // Fetch last 10 quotations created by the user, sorted by createdAt descending
    const lastTenQuotations = await Quotation.find({
      createdBy: user._id,
      adminIs: user.adminIs,
    })
      .sort({ createdAt: -1 }) // Sort by most recent
      .limit(10);

    // Return response
    return res.status(200).json({
      totalQuotations,
      approvedQuotations,
      rejectedQuotations,
      pendingQuotations,
      lastTenQuotations,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


export const filteredData = async (req, res) => {
  try {
    const {
      searchTerm,
      startDate,
      endDate,
      sortBy,
      sortOrder,
      page = 1,
      limit = 4,
      user,
    } = req.query;

    const userId = user._id;

    // Initialize filter with `createdBy` filter
    const filter = { createdBy: userId };

    // Apply search term filtering for `quotationId`
    if (searchTerm) {
      const numericSearchTerm = parseInt(searchTerm, 10);
      if (!isNaN(numericSearchTerm)) {
        filter.quotationId = numericSearchTerm;
      }
    }

    // Apply date filtering for `expireDate`
    if (startDate && endDate) {
      filter.expireDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // Sort options
    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;
    }

    // Pagination calculations
    const skip = (page - 1) * limit;

    // Fetch filtered and paginated quotations
    const quotations = await Quotation.find(filter)
    .skip(skip)
    .limit(parseInt(limit))
    .populate("createdBy")
    .populate("client")
    .sort(sortOptions)

    // Get total count of quotations for the filter
    const totalCount = await Quotation.countDocuments(filter);

    // Response with pagination details
    res.status(200).json({
      data: quotations,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};



export const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { loginId, password } = req.body;
    const user = await User.findOne({ loginId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if(user.is_blocked){
      return res.status(401).json({ message: "Unauthorized" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { name: user.name, email: user.email, id: user._id, role: "user" },
      process.env.SECRET_KEY,
      {
        expiresIn: "1h",
      }
    );

    res.status(200).json({ user, message: `Welcome ${user.name}`, token });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const logoutUser = (req, res) => {
  res.setHeader(
    "Set-Cookie",
    serialize("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(0),
      path: "/",
    })
  );

  res.status(200).json({ message: "Logged out successfully" });
};

export const addClient = async (req, res) => {
  const { value,adminId } = req.body;
  let client = await Client.create({
    name: value.name,
    email: value.email,
    address: value?.address,
    phone: value?.phone,
    adminIs:adminId
  });
  res.status(201).json({ client, message: "Client added" });
};

export const getClients = async (req, res) => {
  try {
    const{adminId} = req.query
    const clients = await Client.find({adminIs:adminId})
  .collation({ locale: "en", strength: 1 })
  .sort({ name: 1 }); 
    res.status(200).json({ clients });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const getProAndSer = async(req,res)=>{
  const{adminId} = req.params;
  let products = await Product.find({adminIs:adminId})||[];
  let services = await Service.find({adminIs:adminId})||[];
  res.status(200).json({products,services})

}



