import pool from '../database/db';

export interface Category {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
  courses: Course[];
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  category_id: string;
  user_name: string;
  price: number;
  discount_price: number | null;
  thumbnail_url: string | null;
  duration: number | null;
  level: string | null;
  requirements: string | null;
  objectives: string | null;
  status: string;
  rating: number;
  enrollment_count: number;
}

export async function getAllCategoriesWithCourses(): Promise<Category[]> {
  // Lấy tất cả danh mục
  const [categoryRows] = await pool.query(
    'SELECT id, name, status FROM categories WHERE status = ?',
    ['Active']
  );
  const categories = categoryRows as Category[];

  // Lấy khóa học cho từng danh mục
  for (const category of categories) {
    const [courseRows] = await pool.query(
      `SELECT 
         c.id, 
         c.title, 
         c.description, 
         c.category_id, 
         u.name AS user_name, 
         c.price, 
         c.discount_price, 
         c.thumbnail_url, 
         c.duration, 
         c.level, 
         c.requirements, 
         c.objectives, 
         c.status, 
         c.rating, 
         c.enrollment_count 
       FROM courses c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.category_id = ? AND c.status = ?`,
      [category.id, 'Published']
    );
    category.courses = courseRows as Course[];
  }

  return categories;
}