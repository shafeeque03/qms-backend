import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dbconnect from './config/database.js'
import adminRoute from './routes/adminRoutes.js';
import userRoute from './routes/userRoutes.js'
import hosterRoute from './routes/hosterRoutes.js';
import authRoute from './routes/authRoute.js';
import http from 'http';
import cookieParser from 'cookie-parser';

const port = 5555

dotenv.config();
dbconnect();
let app = express();
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
    origin:"http://localhost:4000",
    methods:['GET','POST','PUT','PATCH'],
    credentials:true
}));
app.use('/',userRoute);
app.use('/admin',adminRoute);
app.use('/hoster',hosterRoute);
app.use('/auth',authRoute);

const server = http.createServer(app);
server.listen(port,()=>console.log(`App working on port ${port}`))


