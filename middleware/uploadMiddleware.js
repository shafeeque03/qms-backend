import multer from 'multer';

// Configure storage
const storage = multer.memoryStorage(); // Stores the file in memory
const upload = multer({ storage });

// Export middleware
export const uploadFile = upload.single('file');
