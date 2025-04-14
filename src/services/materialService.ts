import { v4 as uuidv4 } from 'uuid';
import * as materialModel from '../models/material';
import { getLessonById } from '../models/lesson';
import { Material } from '../types';
import { saveImage, getImageUrl, ensureUploadDir } from '../cdn/cdn.service'; 
import { promises as fs } from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(__dirname, '..', 'cdn', 'uploads'); 


async function deleteFileFromCdn(fileName: string): Promise<void> {
    try {
        const filePath = path.join(UPLOAD_DIR, fileName);
        await fs.unlink(filePath);
        console.log(`Successfully deleted file: ${fileName}`);
    } catch (error: any) {
        if (error.code !== 'ENOENT') {
            console.error(`Error deleting file ${fileName} from CDN:`, error);
        } else {
            console.warn(`File not found for deletion, possibly already deleted: ${fileName}`);
        }
    }
}


function getFileNameFromUrl(fileUrl: string): string | null {
    if (!fileUrl) return null;
    const parts = fileUrl.split('/');
    return parts.pop() || null; 
}


export async function getMaterialsByLessonIdService(lessonId: string): Promise<Material[]> {
    const lesson = await getLessonById(lessonId);
    if (!lesson) {
        const error = new Error('Lesson not found.');
        (error as any).status = 404; 
        throw error;
    }
    return materialModel.getMaterialsByLessonId(lessonId);
}

export async function getMaterialByIdService(id: string): Promise<Material | null> {
    const material = await materialModel.getMaterialById(id);
    if (!material) {
       const error = new Error('Material not found.');
       (error as any).status = 404;
       throw error;
    }
    return material;
}

export async function createMaterialService(data: {
    lesson_id: string;
    title: string;
    description?: string;
    file?: Express.Multer.File; 
}): Promise<Material> {
    const lesson = await getLessonById(data.lesson_id);
    if (!lesson) {
        throw new Error('Lesson not found.');
    }

    let file_url = '';
    let file_type: string | null = null;
    let file_size: number | null = null;

    if (data.file) {
        const fileName = await saveImage(data.file); 
        file_url = getImageUrl(fileName); 
        file_type = data.file.mimetype;
        file_size = Math.round(data.file.size / 1024); 
    } else {
    
        throw new Error('File is required for material.');
    }


    const newMaterialData: Omit<Material, 'created_at' | 'updated_at'> = {
        id: uuidv4(),
        lesson_id: data.lesson_id,
        title: data.title,
        file_url: file_url,
        file_type: file_type,
        file_size: file_size,
        description: data.description ?? null,
    };

    return materialModel.createMaterial(newMaterialData);
}

export async function updateMaterialService(
    id: string,
    data: {
        lesson_id?: string;
        title?: string;
        description?: string | null;
        file?: Express.Multer.File;
    }
): Promise<Material | null> {
    const existingMaterial = await materialModel.getMaterialById(id);
    if (!existingMaterial) {
        throw new Error('Material not found.');
    }

     if (data.lesson_id && data.lesson_id !== existingMaterial.lesson_id) {
        const lesson = await getLessonById(data.lesson_id);
        if (!lesson) {
            throw new Error('New Lesson not found.');
        }
    }

    const updates: Partial<Omit<Material, 'id' | 'created_at'>> = {};
    let newFileName: string | null = null;

    if (data.file) {
        const oldFileName = getFileNameFromUrl(existingMaterial.file_url);
        if (oldFileName) {
            await deleteFileFromCdn(oldFileName);
        }
        const savedFileName = await saveImage(data.file); 
        updates.file_url = getImageUrl(savedFileName); 
        updates.file_type = data.file.mimetype;
        updates.file_size = Math.round(data.file.size / 1024); 
    }

  
    if (data.title !== undefined) {
        updates.title = data.title;
    }
    if (data.description !== undefined) {
        updates.description = data.description;
    }
     if (data.lesson_id !== undefined) {
        updates.lesson_id = data.lesson_id;
    }



    if (Object.keys(updates).length > 0) {
        return materialModel.updateMaterial(id, { ...updates, updated_at: new Date() });
    }

    return existingMaterial;
}

export async function deleteMaterialService(id: string): Promise<boolean> {
    const material = await materialModel.getMaterialById(id);
    if (!material) {
        throw new Error('Material not found.');
    }


    const fileName = getFileNameFromUrl(material.file_url);
    if (fileName) {
         await deleteFileFromCdn(fileName);
    }


    return materialModel.deleteMaterial(id);
}


export function formatMaterialForResponse(material: Material): any {
    return {
        id: material.id,
        lesson_id: material.lesson_id,
        title: material.title,
        file_url: material.file_url ? `${process.env.APP_URL || 'http://localhost:8000'}${material.file_url}` : null, // Thêm base URL nếu cần
        file_type: material.file_type,
        file_size: material.file_size,
        description: material.description,
        created_at: material.created_at?.toISOString(),
        updated_at: material.updated_at?.toISOString(),
    };
}