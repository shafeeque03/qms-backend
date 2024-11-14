import express from 'express';
const adminRoute = express();

import {addUser,adminLogin,getUser,getUserDetails,searchUserData} from '../controller/adminController.js';

adminRoute.post('/addUser',addUser); 
adminRoute.post('/login',adminLogin); 
adminRoute.get('/getUser',getUser); 
adminRoute.get('/userDetails/:userId',getUserDetails)
adminRoute.get('/searchUser/:value',searchUserData)
export default adminRoute