import pool from './database/db';

async function main() {
  try {
    // Ví dụ: Lấy tất cả users từ bảng users
    const [rows] = await pool.query('SELECT * FROM users');
    console.log('Users:', rows);
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await pool.end();
  }
}

main();