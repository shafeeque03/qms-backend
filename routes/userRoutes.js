import express from 'express';
import { loginUser,logoutUser,addClient,getClients,filteredData, getProAndSer } from '../controller/userController.js';
import { createQuotation,quotationDetails,changeQtnStatus } from '../controller/quotationController.js';
import { uploadFile } from '../middleware/uploadMiddleware.js';
const userRoute = express();

userRoute.post('/login',loginUser)
userRoute.post('/logout', logoutUser);
userRoute.post('/addClient', addClient);
userRoute.get('/getClients', getClients);

userRoute.post('/createQuotation',uploadFile,createQuotation);
userRoute.get('/quotationDetails/:qid',quotationDetails);
userRoute.get('/getProAndSer/:adminId',getProAndSer);
userRoute.patch('/qtnStatusChange',changeQtnStatus);
userRoute.get('/filteredData',filteredData);

export default userRoute