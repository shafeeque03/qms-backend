import express from "express";
const adminRoute = express();

import {
  addUser,
  adminLogin,
  getUser,
  getUserDetails,
  updateUserData,
  updateUserPassword,
  getClients,
  getAllUsers,
  getAllClients,
  filteredQuotation,
  filteredQuotationDownload,
  dashboardData
} from "../controller/adminController.js";
import {
  downloadPDF,
  getProducts,
  getServices,
} from "../controller/proAndSerController.js";


//userControlls
adminRoute.post("/addUser", addUser);
adminRoute.post("/login", adminLogin);
adminRoute.get("/getUser", getUser);
adminRoute.get("/userDetails/:userId", getUserDetails);
adminRoute.patch("/updateUser", updateUserData);
adminRoute.patch("/changeUserPassword", updateUserPassword);

//productAndServiceControlls

adminRoute.get("/getProducts",getProducts)
adminRoute.get("/getServices",getServices)
adminRoute.get('/downloadSerOrPro',downloadPDF)

//clientControlls
adminRoute.get("/getClients", getClients);
adminRoute.get("/getAllClients/:adminId", getAllClients);
adminRoute.get("/getAllUsers/:adminId", getAllUsers);

//quotationControlls   
adminRoute.get("/filteredQuotation", filteredQuotation);    
adminRoute.get("/downloadQuotation",filteredQuotationDownload);

//dashboardControlls
adminRoute.get('/dashboardData',dashboardData)
export default adminRoute;
