import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API,
  api_secret: process.env.CLOUDINARY_SECRET,
  secure: true,
});

// Add these helper methods to your Cloudinary configuration file
export const getWebAccessiblePdfUrl = (originalUrl) => {
  // Convert raw/upload URL to web-accessible URL
  return originalUrl
    .replace('/raw/upload/', '/upload/')
    .replace('.pdf', '')
    + '.pdf';
};

export const generatePdfViewUrl = (publicId) => {
  return cloudinary.url(publicId, {
    resource_type: 'raw',
    type: 'upload',
    format: 'pdf',
    flags: 'attachment'
  });
};

export default cloudinary;