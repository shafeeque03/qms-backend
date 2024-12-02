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
  filteredQuotationDownload
} from "../controller/adminController.js";
import {
  addProduct,
  addService,
  downloadPDF,
  editProduct,
  editService,
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
adminRoute.post("/addProduct", addProduct);
adminRoute.post("/addService", addService);
adminRoute.patch("/editProduct", editProduct);
adminRoute.patch("/editService", editService);
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
export default adminRoute;
