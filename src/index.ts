import cors from 'cors';
import express from 'express';
import * as dotenv from 'dotenv';
import authRoutes from './routers/auth';
import enrollmentRoutes from './routers/enrollments';
import courseRoutes from './routers/courses';
import categoryRoutes from './routers/categories';
import lessonRoutes from './routers/lessons';
import userRoutes from './routers/user';
import paymentRoutes from './routers/payment';
import cdnRouter from './cdn/cdn.router';
import materialRoutes from './routers/materials';
import progressRoutes from './routers/progress';

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

app.use('/api', userRoutes);

app.use('/api', paymentRoutes);

app.use('/cdn', cdnRouter);

app.use('/api', materialRoutes);

app.use('/api', progressRoutes);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});