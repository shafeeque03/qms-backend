import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import bcrypt from "bcrypt";
import Admin from "../model/adminModel.js";
import User from "../model/userModel.js";
import nodemailer from "nodemailer";
import HotpModel from "../model/hosterOtpModel.js";

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

const sendVerifymailOtp = async (email) => {
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
      subject: "🔐 Your Secure Verification Code",
      text: `Your OTP is: ${otp}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="
            margin: 0;
            padding: 0;
            background-color: #0a192f;
            font-family: 'Arial', sans-serif;
          ">
            <div style="
              max-width: 600px;
              margin: 20px auto;
              padding: 20px;
              background: linear-gradient(145deg, #0f2847, #1a365d);
              border-radius: 15px;
              box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
              backdrop-filter: blur(4px);
              border: 1px solid rgba(255, 255, 255, 0.18);
            ">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="
                  color: #64ffda;
                  font-size: 28px;
                  margin: 0;
                  text-transform: uppercase;
                  letter-spacing: 2px;
                ">Verification Required</h1>
              </div>
              
              <div style="
                background: rgba(255, 255, 255, 0.05);
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
              ">
                <p style="
                  color: #8892b0;
                  font-size: 16px;
                  line-height: 1.6;
                  margin: 0;
                ">Hello,</p>
                
                <p style="
                  color: #8892b0;
                  font-size: 16px;
                  line-height: 1.6;
                  margin: 15px 0;
                ">Your verification code is:</p>
                
                <div style="
                  background: linear-gradient(90deg, #64ffda, #00b4d8);
                  padding: 20px;
                  border-radius: 8px;
                  text-align: center;
                  margin: 25px 0;
                ">
                  <h2 style="
                    color: #0a192f;
                    font-size: 32px;
                    margin: 0;
                    letter-spacing: 5px;
                    font-weight: bold;
                  ">${otp}</h2>
                </div>
                
                <p style="
                  color: #8892b0;
                  font-size: 14px;
                  line-height: 1.6;
                  margin: 15px 0;
                ">This code will expire in 3 minutes for security purposes.</p>
              </div>
              
              <div style="
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                padding-top: 20px;
                margin-top: 20px;
              ">
                <p style="
                  color: #64ffda;
                  font-size: 12px;
                  text-align: center;
                  margin: 0;
                ">If you didn't request this code, please ignore this email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    await HotpModel.deleteMany({});
    const verificationOtp = new HotpModel({
      email: email,
      otp: otp,
      createdAt: Date.now(),
      expiresAt: Date.now() + 180000,
    });

    await verificationOtp.save();

    transporter.sendMail(mailOption, (error, info) => {
      if (error) {
        console.log(error.message);
      } else {
        console.log(otp + "," + "email has been sent to:", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

export const hosterLogin = async (req, res) => {
  try {
    const { id } = req.body;
    const hosterId = process.env.HOSTER_ID;
    if (id == hosterId) {
      await sendVerifymailOtp(hosterId);
      return res.status(200).json({ message: "Please Enter the OTP" });
    } else {
      return res.status(403).json({ message: "Incorrect Login ID" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const verifyHosterOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    let dbOtp = await HotpModel.findOne({ email: process.env.HOSTER_ID });
    if (otp == dbOtp.otp) {
      const accessToken = jwt.sign(
        { email: process.env.HOSTER_ID },
        process.env.ACCESS_SECRET_KEY,
        { expiresIn: "12h" }
      );

      const refreshToken = jwt.sign(
        { email: process.env.HOSTER_ID },
        process.env.REFRESH_SECRET_KEY,
        { expiresIn: "7d" }
      );

      // Send refreshToken securely in HttpOnly cookie
      const role = "hoster";
      res.cookie(`${role}RefreshToken`, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
      await HotpModel.deleteMany({});
      const hoster = { name: "hoster" };
      return res
        .status(200)
        .json({ hoster, accessToken, message: "Login Verified" });
    } else {
      return res.status(403).json({ message: "Enter Valid OTP" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const hosterId = process.env.HOSTER_ID;
    await HotpModel.deleteMany({});
    await sendVerifymailOtp(hosterId);
    return res.status(200).json({ message: "OTP has been send" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "Internal Server Error" });
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
    await admin.save();
    res.status(201).json({ message: "Admin added successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({});
    res.status(200).json({ admins });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const getAdminDetails = async (req, res) => {
  try {
    const { adminId } = req.params;
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin Not Found" });
    }
    res.status(200).json({ admin });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const changeAdminPassword = async (req, res) => {
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

export const blockAndUnblockAdmin = async (req, res) => {
  try {
    const { adminId, status } = req.body;
    const admin = await Admin.findByIdAndUpdate(
      adminId,
      { isBlocked: !status },
      { new: true }
    );

    if (!admin) {
      return res.status(404).json({ status: "Admin not found" });
    }

    await User.updateMany({ adminIs: adminId }, { is_blocked: !status });

    res.status(200).json({ admin });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};
