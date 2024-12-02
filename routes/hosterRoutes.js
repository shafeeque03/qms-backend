import express from 'express';
const hosterRoute = express();

import { hosterLogin,createAdmin,getAllAdmins, getAdminDetails, changeAdminPassword,blockAndUnblockAdmin } from '../controller/hosterController.js';


hosterRoute.post('/login',hosterLogin);
hosterRoute.post('/createAdmin',createAdmin);
hosterRoute.get('/getAdmins',getAllAdmins);
hosterRoute.get('/getAdminDetails/:adminId',getAdminDetails);
hosterRoute.post('/changeAdminPassword',changeAdminPassword);
hosterRoute.post('/changeAdminBlock',blockAndUnblockAdmin);

export default hosterRoute;