import express from 'express';
import { verifyToken } from '../utils/auth';
import { enrollCourse } from '../models/enrollment';
import { body, param, validationResult } from 'express-validator';


const router = express.Router();

const authenticate = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const payload = verifyToken(token);
    (req as any).user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// Middleware xác thực user
const isAuthenticated = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const payload = verifyToken(token);
    (req as any).user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};



// router.post('/', authenticate, async (req: express.Request, res: express.Response) => {
//   try {
//     const { courseId } = req.body as { courseId: string };
//     const userId = (req as any).user?.id;

//     if (!userId) {
//       return res.status(401).json({ error: 'User not authenticated' });
//     }

//     const course = await getCourseById(courseId);
//     if (!course) {
//       return res.status(404).json({ error: 'Course not found' });
//     }

//     await enrollCourse(userId, courseId, course.discount_price || course.price);
//     return res.json({ message: 'Enrolled successfully' });
//   } catch (error) {
//     return res.status(500).json({ error: 'Server error' });
//   }
// });

// router.get('/', authenticate, async (req: express.Request, res: express.Response) => {
//   try {
//     const userId = (req as any).user?.id;

//     if (!userId) {
//       return res.status(401).json({ error: 'User not authenticated' });
//     }

//     const enrollments = await getEnrollmentsByUser(userId);
//     return res.json(enrollments);
//   } catch (error) {
//     return res.status(500).json({ error: 'Server error' });
//   }
// });

export default router;