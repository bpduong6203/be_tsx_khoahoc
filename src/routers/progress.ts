// src/routers/progress.ts
import express, { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { isAuthenticated, AuthenticatedRequest } from '../middleware/auth'; 
import * as progressService from '../services/progressService';
import { ProgressStatus } from '../types'; 

const router = express.Router();


router.get('/progress/courses', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const coursesProgress = await progressService.getUserCoursesProgressService(userId);
        return res.json({
            data: coursesProgress,
            message: 'User courses progress retrieved successfully',
        });
    } catch (error: any) {
        console.error('Error fetching user courses progress:', error);
        return res.status(error.status || 500).json({ message: error.message || 'Server error' });
    }
});


router.get('/progress/enrollments/:enrollmentId', isAuthenticated, [
    param('enrollmentId').isUUID().withMessage('Invalid Enrollment ID')
], async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const userId = req.user?.id;
        const enrollmentId = req.params.enrollmentId;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const progressDetail = await progressService.getEnrollmentProgressService(enrollmentId, userId);
        return res.json({
            data: progressDetail,
            message: 'Enrollment progress details retrieved successfully',
        });
    } catch (error: any) {
        console.error('Error fetching enrollment progress:', error);
        return res.status(error.status || 500).json({ message: error.message || 'Server error' });
    }
});


router.put('/progress/enrollments/:enrollmentId/lessons/:lessonId', isAuthenticated, [
    param('enrollmentId').isUUID().withMessage('Invalid Enrollment ID'),
    param('lessonId').isUUID().withMessage('Invalid Lesson ID'),
    body('status').optional().isIn(Object.values(ProgressStatus)).withMessage('Invalid status value'),
    body('time_spent').optional().isInt({ min: 0 }).withMessage('Time spent must be a non-negative integer')
], async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
         const userId = req.user?.id;
        const { enrollmentId, lessonId } = req.params;
        const { status, time_spent } = req.body; 
         if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        
         if (status === undefined && time_spent === undefined) {
              return res.status(400).json({ message: 'At least status or time_spent must be provided for update.' });
         }


        const progress = await progressService.updateLessonProgressService(enrollmentId, lessonId, userId, { status, time_spent });
        return res.json({
            data: progress, 
            message: 'Lesson progress updated successfully',
        });
    } catch (error: any) {
        console.error('Error updating lesson progress:', error);
        return res.status(error.status || 500).json({ message: error.message || 'Server error' });
    }
});

router.post('/progress/enrollments/:enrollmentId/lessons/:lessonId/start', isAuthenticated, [
    param('enrollmentId').isUUID().withMessage('Invalid Enrollment ID'),
    param('lessonId').isUUID().withMessage('Invalid Lesson ID')
], async (req: AuthenticatedRequest, res: Response) => {
     const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const userId = req.user?.id;
        const { enrollmentId, lessonId } = req.params;
         if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const progress = await progressService.startLessonService(enrollmentId, lessonId, userId);
        return res.json({
            data: progress,
            message: 'Lesson marked as started',
        });
    } catch (error: any) {
        console.error('Error starting lesson:', error);
        return res.status(error.status || 500).json({ message: error.message || 'Server error' });
    }
});


router.post('/progress/enrollments/:enrollmentId/lessons/:lessonId/complete', isAuthenticated, [
    param('enrollmentId').isUUID().withMessage('Invalid Enrollment ID'),
    param('lessonId').isUUID().withMessage('Invalid Lesson ID')
], async (req: AuthenticatedRequest, res: Response) => {
     const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const userId = req.user?.id;
        const { enrollmentId, lessonId } = req.params;
         if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const progress = await progressService.completeLessonService(enrollmentId, lessonId, userId);
        return res.json({
            data: progress,
            message: 'Lesson marked as completed',
        });
    } catch (error: any) {
        console.error('Error completing lesson:', error);
        return res.status(error.status || 500).json({ message: error.message || 'Server error' });
    }
});


export default router;