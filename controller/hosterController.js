import Jwt from "jsonwebtoken";
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
      subject: "For OTP verification",
      text: `Your OTP is: ${otp}`,
      html: `
      <html>
          <body style = "backgroundColor":blue>
              <p style="color:#2A5948">Hello User</p>
              <h3 style="color:#2A5948">Your OTP for verification is: <span style="font-weight: bold; color: #3498db;">${otp}</span></h3>
              <p style="color:#2A5948">If you didn't request this OTP or need further assistance, please connect us</p>
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
        console.log(otp + "," + "email has been send to:", info.response);
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
      const token = Jwt.sign(
        {
          role: "hoster",
        },
        process.env.HOSTER_SECRET,
        {
          expiresIn: "12h",
        }
      );
      res.setHeader(
        "Set-Cookie",
        serialize("hosterToken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 3600, // 1 hour
          path: "/",
        })
      );
      await HotpModel.deleteMany({})
      const hoster = { name: "hoster" };
      return res.status(200).json({ hoster, token, message: "Login Verified" });
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
  await HotpModel.deleteMany({})
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
