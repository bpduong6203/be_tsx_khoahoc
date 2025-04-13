import cors from 'cors';
import express from 'express';
import * as dotenv from 'dotenv';
import cdnRouter from './cdn/cdn.router';

dotenv.config();

const cdnApp = express();
const CDN_PORT = 4000;

cdnApp.use(
  cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

cdnApp.use(express.json());

cdnApp.use('/cdn', cdnRouter);

cdnApp.listen(CDN_PORT, () => {
  console.log(`CDN server running on port ${CDN_PORT}`);
});