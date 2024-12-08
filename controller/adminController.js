import User from "../model/userModel.js";
import Admin from "../model/adminModel.js"
import Client from "../model/clientModel.js"
import Quotation from "../model/quotationModel.js"
import Product from "../model/productModel.js";
import Service from "../model/serviceModel.js"
import Jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { serialize } from "cookie";


export const dashboardData = async (req, res) => {
  try {
    const { adminId } = req.query;
    if (!adminId) {
      return res.status(401).json({ message: "Invalid adminId" });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Revenue data for the last 7 days
    const last7DaysRevenue = await Quotation.aggregate([
      {
        $match: {
          adminIs: new mongoose.Types.ObjectId(adminId),
          status: "accepted",
          approvedOn: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$approvedOn" }, // Group by day
          },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: { _id: 1 }, // Sort by date ascending
      },
    ]);

    const totalQuotations = await Quotation.find({
      adminIs: adminId,
    }).countDocuments();
    const totalUsers = await User.find({
      adminIs: adminId,
    }).countDocuments();
    const totalProducts = await Product.find({
      adminIs: adminId,
    }).countDocuments();
    const totalServices = await Service.find({
      adminIs: adminId,
    }).countDocuments();

    res.status(200).json({
      totalQuotations,
      totalUsers,
      totalProducts,
      totalServices,
      last7DaysRevenue,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};


export const adminLogin = async (req, res) => {
  try {
    const { id, password } = req.body;
    const admin = await Admin.findOne({ email:id });
    if (!admin) {
      return res.status(404).json({ message: "User not found" });
    }

    if(admin.isBlocked){
      return res.status(401).json({ message: "Unauthorized" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = Jwt.sign(
      { name: admin.name, email: admin.email, id: admin._id, role: "admin" },
      process.env.ADMIN_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.setHeader(
      "Set-Cookie",
      serialize("userToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 3600,
        path: "/",
      })
    );

    res.status(200).json({ admin, message: `Welcome ${admin.name}`, token });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

//User Management
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

export const addUser = async (req, res) => {
  try {
    const { userName, email, phone, loginId, password, admin } = req.body;

    // Validate input data
    if (!userName || !email || !phone || !loginId || !password || !admin) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if email or loginId already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { loginId }]
    });

    if (existingUser) {
      return res.status(409).json({ 
        message: "User with the same email or login ID already exists" 
      });
    }

    // Encrypt password
    const encryptedPassword = await securePassword(password);

    // Create and save new user
    const user = await User.create({
      name: userName,
      email,
      phone,
      loginId,
      password: encryptedPassword,
      adminIs: admin._id
    });

    res.status(201).json({ message: "User added successfully", user });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const getUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const admin_id = req.query.adminId;

    if (!admin_id) {
      return res.status(400).json({ status: "Bad Request", message: "Admin ID is required" });
    }
    const query = { adminIs: admin_id };

    if(search){
      query.name = { $regex: `^${search}`, $options: "i" };
    }

    const totalUsers = await User.countDocuments(query); // Count users matching the search conditio

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));


    res.status(200).json({
      users,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "Internal Server Error" });
  }
};



export const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    let user = await User.findById({ _id: userId });
    res.status(200).json({ user });
  } catch (error) {
    console.log(error.message);
  }
};


export const updateUserData = async (req, res) => {
  try {
    const { userId, values } = req.body;
    if (!userId || !values) {
      return res.status(400).json({ message: "Invalid request data" });
    }
    const existingUser = await User.findOne({
      $or: [{ email:values.email }, { loginId:values.loginId }]
    });

    if (existingUser) {
      return res.status(409).json({ 
        message: "User with the same email or login ID already exists" 
      });
    }
    const user = await User.findByIdAndUpdate(
      userId,
      {
        name: values.name,
        email: values.email,
        phone: values.phone,
        loginId: values.loginId,
        is_blocked:values.isBlocked
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res
      .status(200)
      .json({ message: "User details updated", user });
  } catch (error) {
    console.error("Error updating user:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUserPassword = async (req, res) => {
  try {
    const { userId, password } = req.body;
    if (password.newPassword != password.confirmPassword) {
      return res.status(403).json({ message: "Passwords do not match" });
    }
    if(password.newPassword.trim()==''){
      return res.status(403).json({ message: "Please Enter a valid password" });
    }
    const encryptedPassword = await securePassword(password.newPassword);
    await User.findByIdAndUpdate(
      userId,
      { password: encryptedPassword },
      { new: true }
    );
    res.status(200).json({ message: "Password Updated" });
  } catch (error) {
    console.error("Error updating user:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};



export const getClients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || ""; 
    const adminId = req.query.adminId
     // Retrieve search query from request

    // Build the search query condition

    const searchCondition = { adminIs: adminId }; // Correct field name should match your schema
    if (search) {
      searchCondition.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    

    const users = await Client.find(searchCondition)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await Client.countDocuments(searchCondition);  // Count users matching the search condition
    res.status(200).json({
      users,
      currentPage: page,
      totalPagess: Math.ceil(totalUsers / limit),
      totalUsers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "Internal Server Error" });
  }
};


export const getAllUsers = async(req,res)=>{
  try {
    const{adminId} = req.params
    let users = await User.find({adminIs:adminId});
    res.status(200).json({users})
  } catch (error) {
    console.error("Error updating user:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const getAllClients = async(req,res)=>{
  try {
    const{adminId} = req.params
    let clients = await Client.find({adminIs:adminId});
    res.status(200).json({clients})
  } catch (error) {
    console.error("Error updating user:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const filteredQuotation = async (req, res) => {
  try {
    const {
      searchTerm,
      startDate,
      endDate,
      sortBy,
      sortOrder,
      page = 1,
      limit = 4,
      adminId
    } = req.query;



    // Initialize filter with `createdBy` filter
    const filter = {adminIs:adminId};

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
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
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


export const filteredQuotationDownload = async (req, res) => {
  try {
    const {
      searchTerm,
      startDate,
      endDate,
      sortBy,
      sortOrder,
      adminId
    } = req.query;

    const filter = {adminIs:adminId};

    if (searchTerm) {
      const numericSearchTerm = parseInt(searchTerm, 10);
      if (!isNaN(numericSearchTerm)) {
        filter.quotationId = numericSearchTerm;
      }
    }

    if (startDate && endDate) {
      filter.expireDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;
    }


    const quotations = await Quotation.find(filter)
      .sort(sortOptions)

    console.log(quotations,"heyy")
    res.status(200).json({quotations});
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

