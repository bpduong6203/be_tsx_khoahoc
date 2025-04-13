// src/models/course.ts
import pool from '../database/db';
import { Course, Lesson } from '../types'; // Đảm bảo Course type đủ trường

// Hàm kiểm tra course tồn tại
async function checkCourseExists(id: string): Promise<boolean> {
    const [rows] = await pool.query('SELECT id FROM courses WHERE id = ?', [id]);
    return (rows as any[]).length > 0;
}

// Hàm lấy danh sách courses - Đã sửa lại signature
export async function getCourses(filters: { // <-- Chỉ nhận 1 tham số filters
    category_id?: string;
    status?: string;
    level?: string;
    search?: string;
    sort_by?: string;
    sort_direction?: 'ASC' | 'DESC';
    // Thêm min_price, max_price nếu cần
} = {}): Promise<Course[]> { // <-- Tham số filters có giá trị mặc định {}
    let sql = `SELECT c.id, c.title, c.description, c.category_id, c.user_id, c.price, c.discount_price,
                      c.thumbnail_url, c.duration, c.level, c.requirements, c.objectives, c.status,
                      c.rating, c.enrollment_count, c.created_at, c.updated_at
               FROM courses c`; // Alias c
    const params: (string | number)[] = [];
    const whereClauses: string[] = [];

    if (filters.category_id) {
        whereClauses.push('c.category_id = ?');
        params.push(filters.category_id);
    }
    if (filters.status) {
        whereClauses.push('c.status = ?');
        params.push(filters.status);
    }
     if (filters.level) {
        whereClauses.push('c.level = ?');
        params.push(filters.level);
    }
    if (filters.search) {
        // Tìm kiếm đơn giản trên title và description
        whereClauses.push('(c.title LIKE ? OR c.description LIKE ?)');
        params.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    // Thêm filter giá nếu cần

    if (whereClauses.length > 0) {
        sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    // Sorting (cần kiểm tra tên cột hợp lệ để tránh SQL Injection nếu tên cột từ input)
    const sortBy = ['created_at', 'title', 'price', 'rating', 'enrollment_count'].includes(filters.sort_by || '') ? filters.sort_by : 'created_at';
    const sortDirection = filters.sort_direction === 'ASC' ? 'ASC' : 'DESC';
    sql += ` ORDER BY c.${sortBy} ${sortDirection}`;

    // Pagination có thể thêm LIMIT ?, OFFSET ? vào đây

    const [rows] = await pool.query(sql, params);
    return (rows as any[]).map(row => ({
        ...row,
        price: Number(row.price) || 0,
        discount_price: row.discount_price ? Number(row.discount_price) : null,
        rating: Number(row.rating) || 0,
        enrollment_count: Number(row.enrollment_count) || 0,
        created_at: row.created_at ? new Date(row.created_at) : null, // Hoặc new Date() nếu không nullable
        updated_at: row.updated_at ? new Date(row.updated_at) : null,
    })) as Course[]; // Cần đảm bảo Course type khớp
}

// Lấy chi tiết course theo ID
export async function getCourseById(id: string): Promise<Course | null> {
    const [rows] = await pool.query('SELECT * FROM courses WHERE id = ?', [id]);
    const row = (rows as any[])[0];
    if (!row) return null;
    return {
        ...row,
        price: Number(row.price) || 0,
        discount_price: row.discount_price ? Number(row.discount_price) : null,
        rating: Number(row.rating) || 0,
        enrollment_count: Number(row.enrollment_count) || 0,
        created_at: row.created_at ? new Date(row.created_at) : new Date(),
        updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
    } as Course; // Cần đảm bảo Course type khớp
}

// === BỔ SUNG CREATE ===
export async function createCourse(courseData: {
    id: string; // Do service tạo
    title: string;
    description?: string | null;
    category_id?: string | null;
    user_id: string; // Do service cung cấp (từ user đăng nhập)
    price: number;
    discount_price?: number | null;
    thumbnail_url?: string | null; // Chỉ lưu URL dạng string
    duration?: number | null;
    level?: string | null;
    requirements?: string | null;
    objectives?: string | null;
    status?: string; // 'Draft', 'Published', ...
}): Promise<Course> {
    const { id, title, description, category_id, user_id, price, discount_price, thumbnail_url, duration, level, requirements, objectives, status } = courseData;
    const createdAt = new Date();
    const updatedAt = new Date();

    await pool.query(
        `INSERT INTO courses (id, title, description, category_id, user_id, price, discount_price, thumbnail_url, duration, level, requirements, objectives, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, title, description, category_id, user_id, price, discount_price, thumbnail_url, duration, level, requirements, objectives, status || 'Draft', createdAt, updatedAt]
    );

    const newCourse = await getCourseById(id);
    if (!newCourse) {
        throw new Error('Failed to retrieve newly created course');
    }
    return newCourse;
}

// === BỔ SUNG UPDATE ===
export async function updateCourse(
    id: string,
    updates: { // Các trường có thể update
        title?: string;
        description?: string | null;
        category_id?: string | null;
        price?: number;
        discount_price?: number | null;
        thumbnail_url?: string | null; // Chỉ nhận URL string
        duration?: number | null;
        level?: string | null;
        requirements?: string | null;
        objectives?: string | null;
        status?: string;
    }
): Promise<Course | null> {
    if (!(await checkCourseExists(id))) {
        return null; // Course không tồn tại
    }

    const updateFields = { ...updates, updated_at: new Date() };
    // Sửa lỗi filter: kiểm tra xem key có trong updates không trước khi truy cập
    const fieldsToUpdate = Object.keys(updateFields)
                                .filter(key => key === 'updated_at' || updates[key as keyof typeof updates] !== undefined);

    if (fieldsToUpdate.length === 1 && fieldsToUpdate[0] === 'updated_at') {
        return getCourseById(id); // Không có gì thay đổi
    }

    const setClause = fieldsToUpdate.map(key => `${key} = ?`).join(', ');
    // Sửa lỗi values: đảm bảo lấy đúng giá trị từ updateFields
    const values = fieldsToUpdate.map(key => updateFields[key as keyof typeof updateFields]);

    await pool.query(`UPDATE courses SET ${setClause} WHERE id = ?`, [...values, id]);

    return await getCourseById(id);
}

// === BỔ SUNG DELETE ===
export async function deleteCourse(id: string): Promise<{ success: boolean, thumbnailUrl: string | null }> {
    // Lấy thông tin course trước khi xóa để trả về thumbnail_url (nếu có)
    const course = await getCourseById(id);
    if (!course) {
        return { success: false, thumbnailUrl: null }; // Không tìm thấy để xóa
    }

    // Cần xử lý ràng buộc khóa ngoại nếu có (vd: xóa enrollments, lessons trước?)
    // Ví dụ: await pool.query('DELETE FROM lessons WHERE course_id = ?', [id]);
    // Ví dụ: await pool.query('DELETE FROM enrollments WHERE course_id = ?', [id]);

    const [result] = await pool.query('DELETE FROM courses WHERE id = ?', [id]);
    const success = (result as any).affectedRows > 0;

    return { success, thumbnailUrl: course.thumbnail_url };
}

// === BỔ SUNG GET COURSES BY USER ID ===
export async function getCoursesByUserId(userId: string): Promise<Course[]> {
    const [rows] = await pool.query('SELECT * FROM courses WHERE user_id = ? ORDER BY created_at DESC', [userId]);
     return (rows as any[]).map(row => ({
        ...row,
        price: Number(row.price) || 0,
        discount_price: row.discount_price ? Number(row.discount_price) : null,
        rating: Number(row.rating) || 0,
        enrollment_count: Number(row.enrollment_count) || 0,
        created_at: row.created_at ? new Date(row.created_at) : new Date(),
        updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
    })) as Course[]; // Cần đảm bảo Course type khớp
}

// Các hàm helper getCategoryById, getUserById, getLessonsByCourseId nên được import từ model tương ứng nếu cần
// export async function getCategoryById(categoryId: string): Promise<{ id: string; name: string } | null> { ... }
// export async function getUserById(userId: string): Promise<{ id: string; name: string } | null> { ... }
// export async function getLessonsByCourseId(courseId: string): Promise<Lesson[]> { ... }