import cors from 'cors';
import express from 'express';
import * as dotenv from 'dotenv';
import authRoutes from './routers/auth';
import enrollmentRoutes from './routers/enrollments';
import courseRoutes from './routers/courses';
import categoryRoutes from './routers/categories';
import lessonRoutes from './routers/lessons';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(
  cors({
    origin: 'http://localhost:3000', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    allowedHeaders: ['Content-Type', 'Authorization'], 
  })
);

app.use(express.json());

// Routes
app.use('/api', authRoutes);

app.use('/api', enrollmentRoutes);

app.use('/api', courseRoutes);

app.use('/api', categoryRoutes);

app.use('/api', lessonRoutes);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});