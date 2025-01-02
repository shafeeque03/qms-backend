import User from "../model/userModel.js";
import Client from "../model/clientModel.js";
import Quotation from "../model/quotationModel.js";
import Product from "../model/productModel.js";
import Service from "../model/serviceModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { serialize } from "cookie";
import Admin from "../model/adminModel.js";
import otpModel from "../model/otpModel.js";
import cloudinary from "../util/cloudinary.js";
import nodemailer from "nodemailer";

import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

import PDFDocument from "pdfkit";
import pdf from "html-pdf";

const sendVerifymailOtp = async (name, email, userId) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const otp = Math.floor(1000 + Math.random() * 9000);

    const mailOption = {
      from: "qmsalfarooq.com",
      to: email,
      subject: "For OTP verification",
      text: `Your OTP is: ${otp}`,
      html: `
      <html>
          <body style = "backgroundColor":blue>
              <p style="color:#2A5948">Hello,${name}</p>
              <h3 style="color:#2A5948">Your OTP for verification is: <span style="font-weight: bold; color: #3498db;">${otp}</span></h3>
              <p style="color:#2A5948">If you didn't request this OTP or need further assistance, please connect us</p>
          </body>
      </html>
  `,
    };
    await otpModel.deleteMany({ userId: userId });
    const verificationOtp = new otpModel({
      userId: userId,
      otp: otp,
      createdAt: Date.now(),
      expiresAt: Date.now() + 180000,
    });

    await verificationOtp.save();

    transporter.sendMail(mailOption, (error, info) => {
      if (error) {
        console.log(error.message);
      } else {
        console.log(otp + "," + "email has been send to:", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

export const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email: email });
    if (!admin) {
      return res.status(404).json({ message: "User not found" });
    }
    await sendVerifymailOtp(admin.name, admin.email, admin._id);
    res.status(200).json({ admin, message: "OTP has been send" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const changeAdminPass = async (req, res) => {
  try {
    const { adminId, password } = req.body;
    if (!adminId || !password) {
      return res.status(400).json({ message: "Invalid request" });
    }
    const encryptedPassword = await securePassword(password);
    await Admin.findByIdAndUpdate(
      adminId,
      { password: encryptedPassword, isBlocked: false, passwordTries: 0 },
      { new: true }
    );
    res.status(200).json({ message: "Password Updated" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { adminId } = req.body;
    const admin = await Admin.findById(adminId);
    await sendVerifymailOtp(admin.name, admin.email, admin._id);
    res.status(200).json({ message: "OTP has been send" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const otpVerifying = async (req, res) => {
  try {
    const { adminId, otp } = req.body;
    const otpData = await otpModel.findOne({ userId: adminId });
    console.log(otpData,"otpDataaaa")


    console.log(adminId,otp,"jijiij")

    const correctOtp = otpData.otp;
    if (otpData && otpData.expiresAt < Date.now()) {
      return res.status(401).json({ message: "Email OTP has expired" });
    }
    if (correctOtp == otp) {
      console.log("its right otp")
      await otpModel.deleteMany({ userId: adminId });
      await Admin.updateOne({ _id: adminId }, { $set: { isVerified: true } });
      res.status(200).json({
        status: true,
        message: "User registration success, you can login now",
      });
    } else {
      res.status(400).json({ message: "Incorrect OTP" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createAdmin = async (req, res) => {
  try {
    const { name, email, phone, address1, address2, pincode, password } =
      req.body.formData;
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Email already exists." });
    }
    const encryptedPassword = await securePassword(password);
    const admin = await Admin.create({
      name,
      email,
      phone,
      "address.address1": address1,
      "address.address2": address2,
      "address.pincode": pincode,
      password: encryptedPassword,
    });
    const adminData = await admin.save();
    await sendVerifymailOtp(adminData.name, adminData.email, adminData._id);
    res.status(201).json({
      message: `otp has send to ${email}`,
      userData: adminData,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const quotationDetails = async (req, res) => {
  try {
    const { qid } = req.params;
    const quotation = await Quotation.findById(qid)
      .populate({
        path: "createdBy",
        select: "name phone email ",
      })
      .populate({
        path: "client",
        select: "name email phone address",
      })
      .populate({
        path: "adminIs",
        select: "name email phone address",
      });

    res.status(200).json({ quotation });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const downloadQuotationReport = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { startDate, endDate } = req.query;

    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start and end dates are required",
      });
    }

    // Aggregate quotations within date range
    const quotations = await Quotation.aggregate([
      {
        $match: {
          adminIs: new mongoose.Types.ObjectId(adminId),
          approvedOn: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $lookup: {
          from: "clients",
          localField: "client",
          foreignField: "_id",
          as: "clientDetails",
        },
      },
      { $unwind: "$clientDetails" },
    ]);

    // Calculate total revenue
    const totalRevenue = quotations.reduce(
      (sum, q) => sum + (q.subTotal || 0),
      0
    );

    // Generate HTML for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #2c3e50; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: left; 
            }
            th { 
              background-color: #f2f2f2; 
              font-weight: bold;
            }
            .summary { 
              margin-top: 20px; 
              font-weight: bold; 
              font-size: 18px; 
            }
          </style>
        </head>
        <body>
          <h1>Quotation Report</h1>
          <p><strong>Date Range:</strong> ${startDate} to ${endDate}</p>
          
          <table>
            <thead>
              <tr>
                <th>Quotation No</th>
                <th>Client Name</th>
                <th>Total Amount</th>
                <th>Created Date</th>
                <th>Approved Date</th>
              </tr>
            </thead>
            <tbody>
              ${quotations
                .map(
                  (q) => `
                <tr>
                  <td>${q.quotationId}</td>
                  <td>${q.clientDetails.name}</td>
                  <td>$${q.subTotal?.toFixed(2)}</td>
                  <td>${q.createdAt.toISOString().split("T")[0]}</td>
                  <td>${q.approvedOn.toISOString().split("T")[0]}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="summary">
            <p>Total Quotations: ${quotations.length}</p>
            <p>Total Revenue: $${totalRevenue.toFixed(2)}</p>
          </div>
        </body>
      </html>
    `;

    // PDF generation options
    const options = {
      format: "A4",
      orientation: "portrait",
      border: {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm",
      },
    };

    // Generate PDF
    pdf.create(htmlContent, options).toBuffer((err, buffer) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error generating PDF",
          error: err.message,
        });
      }

      // Send PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=quotations_${startDate}_to_${endDate}.pdf`
      );
      res.send(buffer);
    });
  } catch (error) {
    console.error("Download Report Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const logoUpdate = async (req, res) => {
  try {
    const { adminId, file } = req.body;

    if (!adminId) {
      return res.status(400).json({ message: "Admin ID is required" });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (file) {
      const fileData = file.base64;
      const uploadResult = await cloudinary.uploader.upload(fileData, {
        folder: "admin_logos",
        transformation: [{ width: 500, height: 500, crop: "limit" }],
      });

      admin.logo = uploadResult.secure_url;

      const newAdmin = await admin.save();

      return res.status(200).json({
        message: "Logo updated successfully",
        newAdmin,
      });
    } else {
      if (admin.logo) {
        const publicId = admin.logo.split("/").pop().split(".")[0];

        await cloudinary.uploader.destroy(`admin_logos/${publicId}`);
      }

      // Clear logo in database
      admin.logo = null;
      await admin.save();

      return res.status(200).json({
        message: "Logo removed successfully",
      });
    }
  } catch (error) {
    console.error("Error updating logo:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const reportPageData = async (req, res) => {
  try {
    const { adminId } = req.params;

    // Validate adminId
    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Admin ID",
      });
    }

    // 1. Total Revenue Calculation
    const totalRevenueResult = await Quotation.aggregate([
      {
        $match: {
          adminIs: new mongoose.Types.ObjectId(adminId),
          status: "accepted",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$subTotal" },
          totalQuotations: { $sum: 1 },
        },
      },
    ]);

    const totalQuotationsCount = await Quotation.find({
      adminIs: adminId,
    }).countDocuments();

    // 2. Most Purchased Products
    const mostPurchasedProducts = await Quotation.aggregate([
      {
        $match: {
          adminIs: new mongoose.Types.ObjectId(adminId),
          status: "accepted",
        },
      },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.name",
          totalQuantity: { $sum: "$products.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$products.quantity", "$products.price"] },
          },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
    ]);

    // 3. Most Provided Services
    const mostProvidedServices = await Quotation.aggregate([
      {
        $match: {
          adminIs: new mongoose.Types.ObjectId(adminId),
          status: "accepted",
        },
      },
      { $unwind: "$services" },
      {
        $group: {
          _id: "$services.name",
          totalUsage: { $sum: 1 },
          totalRevenue: { $sum: "$services.price" },
        },
      },
      { $sort: { totalUsage: -1 } },
      { $limit: 5 },
    ]);

    // 4. Quotation Status Breakdown
    const quotationStatusBreakdown = await Quotation.aggregate([
      {
        $match: {
          adminIs: new mongoose.Types.ObjectId(adminId),
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // 5. Monthly Revenue Trend
    const monthlyRevenueTrend = await Quotation.aggregate([
      {
        $match: {
          adminIs: new mongoose.Types.ObjectId(adminId),
          status: "accepted",
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$approvedOn" },
            month: { $month: "$approvedOn" },
          },
          totalRevenue: { $sum: "$subTotal" },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);

    // 6. Top Clients
    const topClients = await Quotation.aggregate([
      {
        $match: {
          adminIs: new mongoose.Types.ObjectId(adminId),
          status: "accepted",
        },
      },
      {
        $group: {
          _id: "$client",
          totalRevenue: { $sum: "$subTotal" },
          quotationCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "clients",
          localField: "_id",
          foreignField: "_id",
          as: "clientDetails",
        },
      },
      { $unwind: "$clientDetails" },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
    ]);

    // Prepare Response
    res.status(200).json({
      success: true,
      data: {
        totalRevenue: totalRevenueResult[0]?.totalRevenue || 0,
        totalQuotations: totalQuotationsCount || 0,
        mostPurchasedProducts,
        mostProvidedServices,
        quotationStatusBreakdown: quotationStatusBreakdown.reduce(
          (acc, status) => {
            acc[status._id] = status.count;
            return acc;
          },
          {}
        ),
        monthlyRevenueTrend,
        topClients: topClients.map((client) => ({
          name: client.clientDetails.name,
          totalRevenue: client.totalRevenue,
          quotationCount: client.quotationCount,
        })),
      },
    });
  } catch (error) {
    console.error("Report Page Data Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

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
          totalAmount: { $sum: "$subTotal" },
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

const MAX_PASSWORD_TRIES = 10;
export const adminLogin = async (req, res) => {
  try {
    const { id, password } = req.body;
    const admin = await Admin.findOne({ email: id });
    if (!admin) {
      return res.status(404).json({ message: "User not found" });
    }

    if (admin.isBlocked) {
      if (admin.passwordTries >= MAX_PASSWORD_TRIES) {
        return res
          .status(403)
          .json({
            message:
              "Your account has been blocked due to multiple incorrect attempts. Please contact the admin.",
          });
      }
      return res
        .status(403)
        .json({ message: "Your account has been blocked, Contact admin" });
    }

    if (admin.passwordTries >= MAX_PASSWORD_TRIES) {
      admin.isBlocked = true;
      await admin.save();
      return res.status(403).json({
        message:
          "Your account has been blocked due to multiple incorrect attempts. Please Change password.",
      });
    }

    // Check if the user is not verified
    if (!admin.isVerified) {
      await sendVerifymailOtp(admin.name, admin.email, admin._id);
      return res.status(200).json({
        adminData: admin,
        message: "Account not verified. Please complete OTP verification.",
        isVerified: false,
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      admin.passwordTries += 1; // Increment incorrect attempts
      await admin.save();
      return res.status(403).json({ message: "Invalid credentials" });
    }
    // Reset passwordTries on successful login
    if (admin.passwordTries > 0) {
      admin.passwordTries = 0;
      await admin.save();
    }

    // Generate Access Token (short-lived)
    const accessToken = jwt.sign(
      { id: admin._id, email: admin.email },
      process.env.ACCESS_SECRET_KEY,
      { expiresIn: "12h" }
    );

    // Generate Refresh Token (long-lived)
    // const refreshToken = jwt.sign(
    //   { id: admin._id },
    //   process.env.REFRESH_SECRET_KEY,
    //   { expiresIn: "7d" }
    // );

    // Send refreshToken securely in HttpOnly cookie
    // const role = 'admin'
    // res.cookie(`${role}RefreshToken`, refreshToken, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production',
    //   sameSite: 'strict',
    //   expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    // });

    res.status(200).json({
      admin,
      message: `Welcome ${admin.name}`,
      accessToken,
      isVerified: true,
    });
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
      $or: [{ email }, { loginId }],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User with the same email or login ID already exists",
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
      adminIs: admin._id,
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
      return res
        .status(400)
        .json({ status: "Bad Request", message: "Admin ID is required" });
    }
    const query = { adminIs: admin_id };

    if (search) {
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

    // Check for required data
    if (!userId || !values) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    // Check if another user has the same email or loginId
    const existingUser = await User.findOne({
      $or: [{ email: values.email }, { loginId: values.loginId }],
      _id: { $ne: userId }, // Exclude the current user
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User with the same email or login ID already exists",
      });
    }

    // Update user data
    const user = await User.findByIdAndUpdate(
      userId,
      {
        name: values.name,
        email: values.email,
        phone: values.phone,
        loginId: values.loginId,
        is_blocked: values.isBlocked,
      },
      { new: true } // Return the updated document
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User details updated", user });
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
    if (password.newPassword.trim() == "") {
      return res.status(403).json({ message: "Please Enter a valid password" });
    }
    const encryptedPassword = await securePassword(password.newPassword);
    await User.findByIdAndUpdate(
      userId,
      { password: encryptedPassword, is_blocked: false, passwordTries: 0 },
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
    const adminId = req.query.adminId;
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

    const totalUsers = await Client.countDocuments(searchCondition); // Count users matching the search condition
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

export const getAllUsers = async (req, res) => {
  try {
    const { adminId } = req.params;
    let users = await User.find({ adminIs: adminId });
    res.status(200).json({ users });
  } catch (error) {
    console.error("Error updating user:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllClients = async (req, res) => {
  try {
    const { adminId } = req.params;
    let clients = await Client.find({ adminIs: adminId });
    res.status(200).json({ clients });
  } catch (error) {
    console.error("Error updating user:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

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
      adminId,
    } = req.query;

    // Initialize filter with `createdBy` filter
    const filter = { adminIs: adminId };

    // Apply search term filtering for `quotationId`
    if (searchTerm) {
      const numericSearchTerm = parseInt(searchTerm, 10);
      if (!isNaN(numericSearchTerm)) {
        filter.quotationId = numericSearchTerm;
      }
    }

    // Apply date filtering for `createdAt`
    if (startDate && endDate) {
      filter.expireDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    if(startDate && !endDate){
      filter.createdAt = {
        $gte: new Date(startDate),
      };
    }

    if(endDate && !startDate){
      filter.createdAt = {
        $lte: new Date(endDate),
      };
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
      .limit(parseInt(limit));
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
    const { searchTerm, startDate, endDate, sortBy, sortOrder, adminId } =
      req.query;

    const filter = { adminIs: adminId };

    if (searchTerm) {
      const numericSearchTerm = parseInt(searchTerm, 10);
      if (!isNaN(numericSearchTerm)) {
        filter.quotationId = numericSearchTerm;
      }
    }

    if (startDate && endDate) {
      filter.expireDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;
    }

    const quotations = await Quotation.find(filter).sort(sortOptions);

    res.status(200).json({ quotations });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    const { adminId, values } = req.body;

    // Check for required data
    if (!adminId || !values) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    // Check if another user has the same email or loginId
    const existingUser = await Admin.findOne({
      email: values.email,
      _id: { $ne: adminId }, // Exclude the current user
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User with the same email already exists",
      });
    }

    // Update user data
    const user = await Admin.findByIdAndUpdate(
      adminId,
      {
        name: values.name,
        email: values.email,
        phone: values.phone,
        address: values.address,
      },
      { new: true } // Return the updated document
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User details updated", user });
  } catch (error) {
    console.error("Error updating user:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateAdminPassword = async (req, res) => {
  try {
    const { adminId, password } = req.body;
    if (password.newPassword != password.confirmPassword) {
      return res.status(403).json({ message: "Passwords do not match" });
    }
    if (password.newPassword.trim() == "") {
      return res.status(403).json({ message: "Please Enter a valid password" });
    }
    const encryptedPassword = await securePassword(password.newPassword);
    await Admin.findByIdAndUpdate(
      adminId,
      { password: encryptedPassword },
      { new: true }
    );
    res.status(200).json({ message: "Password Updated" });
  } catch (error) {
    console.error("Error updating user:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
