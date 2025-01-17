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
  quotationDetails,
  createAdmin,
  otpVerifying,
  resendOtp,
  forgetPassword,
  changeAdminPass,
  addCompany,
  fetchCompaies,
  updateCompany,
  fetchAllAdmins,
  addAdmin,
  updateAdminData,
  chnageSubAdminPass,
  addClient,
  getProAndSer,
  fetchClients,
  changeEditAccess,
  fetchAllRequests,
  createRequestAdmin,
  changeRequestStatus,
} from "../controller/adminController.js";
import {
  downloadPDF,
  getProducts,
  getServices,
} from "../controller/proAndSerController.js";
import { uploadFile } from "../middleware/uploadMiddleware.js";
import { changeQtnStatus, createQuotation, sendProposalEmail, updateQuotationDetails } from "../controller/quotationController.js";



//userControlls
adminRoute.post("/addUser", addUser);
adminRoute.post("/login", adminLogin);
adminRoute.get("/getUser", getUser);
adminRoute.get("/userDetails/:userId", getUserDetails);
adminRoute.patch("/updateUser", updateUserData);
adminRoute.patch("/changeUserPassword", updateUserPassword);

adminRoute.patch("/changeEditAccess", changeEditAccess);

adminRoute.post('/addClient', addClient);
adminRoute.get('/getProAndSer/:adminId',getProAndSer);
adminRoute.post('/createQuotation',uploadFile,createQuotation);
adminRoute.get('/fetchClients', fetchClients);

adminRoute.patch('/qtnStatusChange',changeQtnStatus);
adminRoute.post('/editQuotation',uploadFile,updateQuotationDetails);


//SubadminControlls
adminRoute.get("/getAdmins/:adminId", fetchAllAdmins);
adminRoute.post("/addAdmin", addAdmin);
adminRoute.patch("/updateAdmin", updateAdminData);
adminRoute.patch("/changeSubAdminPassword", chnageSubAdminPass);


adminRoute.get('/fetchAllRequests/:adminId',fetchAllRequests);
adminRoute.post('/createRequestAdmin',createRequestAdmin)
adminRoute.post('/changeRequestStatus',changeRequestStatus)



//productAndServiceControlls
adminRoute.get("/getProducts",getProducts)
adminRoute.get("/getServices",getServices)
adminRoute.get('/downloadSerOrPro',downloadPDF)

//companyControlls
adminRoute.post("/addCompany",addCompany)
adminRoute.post("/updateCompany",updateCompany)
adminRoute.get("/getCompanies/:adminId",fetchCompaies)

//clientControlls
adminRoute.get("/getClients", getClients);
adminRoute.get("/getAllClients/:adminId", getAllClients);
adminRoute.get("/getAllUsers/:adminId", getAllUsers);

//quotationControlls   
adminRoute.get("/filteredQuotation", filteredQuotation);    
adminRoute.get("/downloadQuotation",filteredQuotationDownload);
adminRoute.post('/sendMail',sendProposalEmail);

//dashboardControlls
adminRoute.get('/dashboardData',dashboardData)
adminRoute.get('/totalReport/:adminId',reportPageData)

//profileControlls
adminRoute.post('/updateProfile',updateAdminProfile)
adminRoute.post('/updateProfilePassword',updateAdminPassword)
adminRoute.post('/updateLogo',uploadFile,logoUpdate)
adminRoute.get('/download-report/:adminId',downloadQuotationReport)
adminRoute.get('/quotationDetails/:qid',quotationDetails);
adminRoute.post('/createAdmin',createAdmin);
adminRoute.post('/verifyOtp',otpVerifying);
adminRoute.post('/resendOtp',resendOtp);
adminRoute.post('/forgetPassword',forgetPassword);
adminRoute.post('/changePassword',changeAdminPass);

export default adminRoute;
