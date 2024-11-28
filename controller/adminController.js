import User from "../model/userModel.js";
import Admin from "../model/adminModel.js"
import Client from "../model/clientModel.js"
import Quotation from "../model/quotationModel.js"
import Jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { serialize } from "cookie";

export const adminLogin = async (req, res) => {
  try {
    const { id, password } = req.body;
    const admin = await Admin.findOne({ email:id });
    if (!admin) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = Jwt.sign(
      { name: admin.name, email: admin.email, id: admin._id, role: "admin" },
      process.env.SECRET_KEY,
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
    const { userName, email, phone, loginId, password,admin } = req.body;
    const encryptedPassword = await securePassword(password);
    const user = await User.create({
      name: userName,
      email,
      phone,
      loginId,
      password: encryptedPassword,
      adminIs:admin._id
    });
    await user.save();
    res.status(201).json({ message: "User added successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "Internal Server Error" });
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

    // Build the search query condition
    const searchCondition = {
      adminIs: admin_id, // Filter by admin_id
      ...(search
        ? {
            $or: [
              { name: { $regex: search, $options: "i" } }, // Search by username (case-insensitive)
              { email: { $regex: search, $options: "i" } }, // Search by email (case-insensitive)
              { loginId: { $regex: search, $options: "i" } }, // Search by loginId (case-insensitive)
            ],
          }
        : {}),
    };

    const users = await User.find(searchCondition)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments(searchCondition); // Count users matching the search condition

    res.status(200).json({
      users,
      currentPage: page,
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

export const searchUserData = async (req, res) => {
  try {
    const { value } = req.params;
    const filteredUsers = await User.find({
      name: { $regex: `^${value}`, $options: "i" },
    });
    res.status(200).json({ filteredUsers });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Error fetching users" });
  }
};

export const updateUserData = async (req, res) => {
  try {
    const { userId, values } = req.body;
    if (!userId || !values) {
      return res.status(400).json({ message: "Invalid request data" });
    }
    const user = await User.findByIdAndUpdate(
      userId,
      {
        name: values.name,
        email: values.email,
        phone: values.phone,
        loginId: values.loginId,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res
      .status(200)
      .json({ message: "User details updated successfully", user });
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
    const search = req.query.search || "";  // Retrieve search query from request

    // Build the search query condition
    const searchCondition = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },  // Search by username (case-insensitive)
            { email: { $regex: search, $options: "i" } },     // Search by email (case-insensitive)
          ],
        }
      : {};

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

export const getQuotations = async(req,res)=>{
  try {
    const quotation = await Quotation.find({}).sort({ createdAt: -1 });
    res.status(200).json({ quotation }); 
  } catch (error) {
    console.error("Error updating user:", error.message);
    res.status(500).json({ message: "Internal server error" });    
  }
}

export const getAllUsers = async(req,res)=>{
  try {
    let users = await User.find({});
    res.status(200).json({users})
  } catch (error) {
    console.error("Error updating user:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const getAllClients = async(req,res)=>{
  try {
    let clients = await Client.find({});
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
    } = req.query;



    // Initialize filter with `createdBy` filter
    const filter = {};

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
      .populate("products.product")
      .populate("services.service")
      .populate("createdBy")
      .populate("client");

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
