import express from 'express';
import {
  getAllCourses,
  getCourseDetails,
  formatCourseForResponse,
} from '../services/courseService';


const router = express.Router();

// GET: Lấy danh sách khóa học
router.get('/courses', async (req: express.Request, res: express.Response) => {
  try {
    const courses = await getAllCourses();
    return res.json({
      data: courses.map(course => formatCourseForResponse(course)),
      message: 'Courses retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET: Lấy khóa học theo ID
router.get('/courses/:id', async (req: express.Request, res: express.Response) => {
  try {
    const course = await getCourseDetails(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    return res.json({
      data: formatCourseForResponse(course),
      message: 'Course retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;