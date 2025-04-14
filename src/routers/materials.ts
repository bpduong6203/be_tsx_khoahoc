import express, { Request, Response } from 'express';
import multer from 'multer';
import { body, param, validationResult } from 'express-validator';
import { isAuthenticated, isAdminOrOwner } from '../middleware/auth'; 
import * as materialService from '../services/materialService';

const router = express.Router();


const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit 
});


router.get('/lessons/:lessonId/materials', [
    param('lessonId').isUUID().withMessage('Invalid Lesson ID')
], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const lessonId = req.params.lessonId;
        const materials = await materialService.getMaterialsByLessonIdService(lessonId);
        return res.json({
            data: materials.map(materialService.formatMaterialForResponse),
            message: 'Materials retrieved successfully',
        });
    } catch (error: any) {
        console.error('Error fetching materials:', error);
         const statusCode = error.status || 500; 
        return res.status(statusCode).json({ message: error.message || 'Server error' });
    }
});

router.get('/materials/:id', [
    param('id').isUUID().withMessage('Invalid Material ID')
], async (req: Request, res: Response) => {
     const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const id = req.params.id;
        const material = await materialService.getMaterialByIdService(id);
         if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }
        return res.json({
            data: materialService.formatMaterialForResponse(material),
            message: 'Material retrieved successfully',
        });
    } catch (error: any) {
        console.error('Error fetching material:', error);
         const statusCode = error.status || 500;
        return res.status(statusCode).json({ message: error.message || 'Server error' });
    }
});


router.post('/materials',
    isAuthenticated, 
    isAdminOrOwner, 
    upload.single('file'), 
    [
        body('lesson_id').isUUID().withMessage('Valid Lesson ID is required'),
        body('title').notEmpty().withMessage('Title is required').isString().isLength({ max: 255 }),
        body('description').optional().isString(),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        if (!req.file) {
             return res.status(400).json({ message: 'File is required' });
        }

        try {
            const { lesson_id, title, description } = req.body;
            const material = await materialService.createMaterialService({
                lesson_id,
                title,
                description,
                file: req.file,
            });
            return res.status(201).json({
                data: materialService.formatMaterialForResponse(material),
                message: 'Material created successfully',
            });
        } catch (error: any) {
            console.error('Error creating material:', error);
             const statusCode = error.message.includes('not found') ? 404 : 500;
            return res.status(statusCode).json({ message: error.message || 'Server error' });
        }
    }
);

router.put('/materials/:id',
    isAuthenticated,
    isAdminOrOwner,
    upload.single('file'), 
    [
        param('id').isUUID().withMessage('Invalid Material ID'),
        body('lesson_id').optional().isUUID().withMessage('Invalid Lesson ID'),
        body('title').optional().isString().isLength({ max: 255 }),
        body('description').optional({ nullable: true }).isString(), 
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const id = req.params.id;
            const { lesson_id, title, description } = req.body;

            const updateData: {
                lesson_id?: string;
                title?: string;
                description?: string | null;
                file?: Express.Multer.File;
            } = {};

            if (lesson_id !== undefined) updateData.lesson_id = lesson_id;
            if (title !== undefined) updateData.title = title;

            if (req.body.description !== undefined) {
                updateData.description = description ?? null;
            }

            if (req.file) {
                updateData.file = req.file;
            }

            if (Object.keys(updateData).length === 0 && !req.file) {
                 return res.status(400).json({ message: 'No data provided for update.' });
            }

            const material = await materialService.updateMaterialService(id, updateData);

            if (!material) {
                  const currentMaterial = await materialService.getMaterialByIdService(id); 
                  if (currentMaterial) {
                       return res.json({
                           data: materialService.formatMaterialForResponse(currentMaterial),
                           message: 'No changes detected. Material remains unchanged.',
                       });
                  } else {
                       return res.status(404).json({ message: 'Material not found' });
                  }
            }

            return res.json({
                data: materialService.formatMaterialForResponse(material),
                message: 'Material updated successfully',
            });
        } catch (error: any) {
            console.error('Error updating material:', error);
            const statusCode = error.message.includes('not found') ? 404 : 500;
            return res.status(statusCode).json({ message: error.message || 'Server error' });
        }
    }
);



router.delete('/materials/:id',
    isAuthenticated,
    isAdminOrOwner,
    [
        param('id').isUUID().withMessage('Invalid Material ID')
    ],
    async (req: Request, res: Response) => {
         const errors = validationResult(req);
         if (!errors.isEmpty()) {
             return res.status(400).json({ errors: errors.array() });
         }
        try {
            const id = req.params.id;
            await materialService.deleteMaterialService(id);
            return res.json({ message: 'Material deleted successfully' });
        } catch (error: any) {
            console.error('Error deleting material:', error);
             const statusCode = error.message.includes('not found') ? 404 : 500;
            return res.status(statusCode).json({ message: error.message || 'Server error' });
        }
    }
);

export default router;