import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.join(__dirname, 'uploads');

export const ensureUploadDir = async () => {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directory:', error);
    throw new Error('Failed to initialize CDN storage');
  }
};

export const saveImage = async (file: Express.Multer.File): Promise<string> => {
  await ensureUploadDir();
  
  const fileName = `${uuidv4()}${path.extname(file.originalname)}`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  await fs.writeFile(filePath, file.buffer);
  return fileName; 
};

export const getImageUrl = (fileName: string): string => {
  return `/cdn/images/${fileName}`; 
};