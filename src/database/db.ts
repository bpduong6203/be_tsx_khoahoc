import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config(); 

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: Number(process.env.DB_PORT) || 3306, 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function checkConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL database');
    connection.release();
  } catch (error) {
    console.error('Error connecting to MySQL:', error);
  }
}

checkConnection();

export default pool;
