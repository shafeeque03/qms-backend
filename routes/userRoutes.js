import express from 'express';
import { loginUser,logoutUser,addClient,getClients,filteredData, getProAndSer, userDashData } from '../controller/userController.js';
import { createQuotation,quotationDetails,changeQtnStatus, updateQuotationDetails } from '../controller/quotationController.js';
import { uploadFile } from '../middleware/uploadMiddleware.js';
const userRoute = express();


userRoute.post('/login',loginUser)
userRoute.post('/logout', logoutUser);
userRoute.post('/addClient', addClient);
userRoute.get('/getClients', getClients);

userRoute.post('/createQuotation',uploadFile,createQuotation);
userRoute.post('/editQuotation',uploadFile,updateQuotationDetails);

userRoute.get('/quotationDetails/:qid',quotationDetails);
userRoute.get('/getProAndSer/:adminId',getProAndSer);
userRoute.patch('/qtnStatusChange',changeQtnStatus);
userRoute.get('/filteredData',filteredData);
userRoute.get('/dashData',userDashData);

export default userRoute