import express from "express";
const adminRoute = express();

import {
  addUser,
  adminLogin,
  getUser,
  getUserDetails,
  searchUserData,
  updateUserData,
  updateUserPassword,
  getClients,
  getQuotations,
  getAllUsers,
  getAllClients,
  filteredQuotation
} from "../controller/adminController.js";
import {
  addProduct,
  addService,
  getAllData,
  editProduct,
  editService,
} from "../controller/proAndSerController.js";

//userControlls
adminRoute.post("/addUser", addUser);
adminRoute.post("/login", adminLogin);
adminRoute.get("/getUser", getUser);
adminRoute.get("/userDetails/:userId", getUserDetails);
adminRoute.get("/searchUser/:value", searchUserData);
adminRoute.patch("/updateUser", updateUserData);
adminRoute.patch("/changeUserPassword", updateUserPassword);

//productControlls
adminRoute.post("/addProduct", addProduct);
adminRoute.post("/addService", addService);
adminRoute.get("/getProAndSer", getAllData);
adminRoute.patch("/editProduct", editProduct);
adminRoute.patch("/editService", editService);

//clientControlls
adminRoute.get("/getClients", getClients);
adminRoute.get("/getAllClients", getAllClients);
adminRoute.get("/getAllUsers", getAllUsers);

//quotationControlls
adminRoute.get("/getQuotations", getQuotations);    
adminRoute.get("/filteredQuotation", filteredQuotation);    

export default adminRoute;
