import express from 'express';
const hosterRoute = express();

import { hosterLogin,createAdmin,getAllAdmins } from '../controller/hosterController.js';


hosterRoute.post('/login',hosterLogin);
hosterRoute.post('/createAdmin',createAdmin);
hosterRoute.get('/getAdmins',getAllAdmins);

export default hosterRoute;