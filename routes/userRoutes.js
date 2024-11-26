import express from 'express';
import { loginUser,logoutUser,addClient,getClients,filteredData } from '../controller/userController.js';
import { createQuotation,quotationDetails,changeQtnStatus } from '../controller/quotationController.js';
const userRoute = express();

userRoute.post('/login',loginUser)
userRoute.post('/logout', logoutUser);
userRoute.post('/addClient', addClient);
userRoute.get('/getClients', getClients);

userRoute.post('/createQuotation',createQuotation);
userRoute.get('/quotationDetails/:qid',quotationDetails);
userRoute.patch('/qtnStatusChange',changeQtnStatus);
userRoute.get('/filteredData',filteredData);

export default userRoute