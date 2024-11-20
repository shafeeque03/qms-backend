// // // backend - controllers/userController.js
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { serialize } from "cookie";
import User from "../model/userModel.js"; // Replace with your actual user model

// // Login controller
export const loginUser = async (req, res) => {
  try {
      const { loginId,password } = req.body;
    const user = await User.findOne({ loginId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
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

    res.setHeader(
      "Set-Cookie",
      serialize("userToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 3600, // 1 hour
        path: "/",
      })
    );

    res.status(200).json({ user, message: `Welcome ${user.name}`,token });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Logout controller
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
