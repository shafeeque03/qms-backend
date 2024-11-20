import express from "express";
import User from "../model/userModel.js";
import Jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { serialize } from "cookie";

export const adminLogin = async (req, res) => {
  try {
    const { id, password } = req.body;
    console.log("okokokoko")
    const adminId = process.env.ADMIN_ID;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (id == adminId) {
      if (adminPassword == password) {
        const token = Jwt.sign(
          {
            role: "admin",
          },
          process.env.ADMIN_SECRET,
          {
            expiresIn: "3h",
          }
        );
        res.setHeader(
            "Set-Cookie",
            serialize("adminToken", token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "strict",
              maxAge: 3600, // 1 hour
              path: "/",
            })
          );
          const admin = {name:"admin"}
        return res.status(200).json({ admin,token, message: "Login Verified" });
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
    const { userName, email, phone, loginId, password } = req.body;
    const encryptedPassword = await securePassword(password);
    const user = await User.create({
      name: userName,
      email,
      phone,
      loginId,
      password: encryptedPassword,
    });
    res.status(201).json({ message: "User added successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const getUser = async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.status(200).json({ users });
  } catch (error) {
    console.log(error);
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


//
