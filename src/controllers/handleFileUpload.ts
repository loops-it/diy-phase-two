import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() });
export const handleFileUpload = upload.single('file');