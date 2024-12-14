import express from 'express';
import { refreshToken } from '../config/middleware.js';

const authRoute = express();

// Refresh token route
authRoute.post('/refresh-token', refreshToken);

export default authRoute;
