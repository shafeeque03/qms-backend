import express from 'express';
const hosterRoute = express();

import { hosterLogin,createAdmin,getAllAdmins, getAdminDetails, changeAdminPassword,blockAndUnblockAdmin,verifyHosterOtp,resendOtp } from '../controller/hosterController.js';


hosterRoute.post('/login',hosterLogin);
hosterRoute.post('/verifyOtp',verifyHosterOtp);
hosterRoute.post('/resendOtp',resendOtp);
hosterRoute.post('/createAdmin',createAdmin);
hosterRoute.get('/getAdmins',getAllAdmins);
hosterRoute.get('/getAdminDetails/:adminId',getAdminDetails);
hosterRoute.post('/changeAdminPassword',changeAdminPassword);
hosterRoute.post('/changeAdminBlock',blockAndUnblockAdmin);

export default hosterRoute;