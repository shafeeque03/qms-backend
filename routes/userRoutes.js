import express from 'express';
import { loginUser,logoutUser } from '../controller/userController.js';
const userRoute = express();

userRoute.post('/login',loginUser)
userRoute.post('/logout', logoutUser);

export default userRoute