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
  dashboardData,
  reportPageData,
  updateAdminProfile,
  updateAdminPassword,
  logoUpdate,
  downloadQuotationReport,
  quotationDetails
} from "../controller/adminController.js";
import {
  downloadPDF,
  getProducts,
  getServices,
} from "../controller/proAndSerController.js";
import { uploadFile } from "../middleware/uploadMiddleware.js";



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
adminRoute.get('/totalReport/:adminId',reportPageData)

//profileControlls
adminRoute.post('/updateProfile',updateAdminProfile)
adminRoute.post('/updateProfilePassword',updateAdminPassword)
adminRoute.post('/updateLogo',uploadFile,logoUpdate)
adminRoute.get('/download-report/:adminId',downloadQuotationReport)
adminRoute.get('/quotationDetails/:qid',quotationDetails);

export default adminRoute;
