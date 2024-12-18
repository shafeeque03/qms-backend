import Jwt from "jsonwebtoken";
import { serialize } from "cookie";
import bcrypt from "bcrypt";
import Admin from "../model/adminModel.js";
import User from "../model/userModel.js";

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

export const hosterLogin = async (req, res) => {
  try {
    const { id, password } = req.body;
    const hosterId = process.env.HOSTER_ID;
    const hosterPassword = process.env.HOSTER_PASSWORD;
    if (id == hosterId) {
      if (hosterPassword == password) {
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
        const hoster = { name: "hoster" };
        return res
          .status(200)
          .json({ hoster, token, message: "Login Verified" });
      } else {
        return res.status(403).json({ message: "Incorrect Password" });
      }
    } else {
      return res.status(401).json({ message: "Incorrect Login ID" });
    }
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
      { password: encryptedPassword, isBlocked: false, passwordTries:0 },
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
