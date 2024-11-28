import Jwt from "jsonwebtoken";
import { serialize } from "cookie";
import bcrypt from "bcrypt";
import Admin from "../model/adminModel.js"


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
              expiresIn: "3h",
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
            const hoster = {name:"hoster"}
          return res.status(200).json({ hoster,token, message: "Login Verified" });
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

  export const createAdmin = async(req,res)=>{
    try {
        const{name,email,phone,address1,address2,pincode,password} = req.body.formData;
        const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Email already exists." });
    }
        const encryptedPassword = await securePassword(password);
        const admin = await Admin.create({
            name,
            email,
            phone,
            'address.address1':address1,
            'address.address2':address2,
            'address.pincode':pincode,
            password: encryptedPassword,
          });
          await admin.save();
          res.status(201).json({ message: "Admin added successfully" });
          
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ status: "Internal Server Error" });        
    }
  }

  export const getAllAdmins = async(req,res)=>{
    try {
        const admins = await Admin.find({});
        res.status(200).json({admins})
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ status: "Internal Server Error" });          
    }
  }