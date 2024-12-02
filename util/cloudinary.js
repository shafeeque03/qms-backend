import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.name,
  api_key: process.env.cloudKey,
  api_secret: process.env.cloudSecret,
  secure: true,
});

export default cloudinary;
