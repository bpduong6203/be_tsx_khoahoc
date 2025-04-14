import pool from '../database/db';
import { Material } from '../types';

// Lấy tất cả materials theo lesson_id
export async function getMaterialsByLessonId(lessonId: string): Promise<Material[]> {
    const [rows] = await pool.query(
        `SELECT id, lesson_id, title, file_url, file_type, file_size, description, created_at, updated_at
         FROM materials
         WHERE lesson_id = ?`,
        [lessonId]
    );
    return (rows as any[]).map(row => ({
        ...row,
        file_size: row.file_size ? Number(row.file_size) : null,
        created_at: row.created_at ? new Date(row.created_at) : null,
        updated_at: row.updated_at ? new Date(row.updated_at) : null,
    })) as Material[];
}

// Lấy material theo ID
export async function getMaterialById(id: string): Promise<Material | null> {
    const [rows] = await pool.query(
        `SELECT id, lesson_id, title, file_url, file_type, file_size, description, created_at, updated_at
         FROM materials
         WHERE id = ?`,
        [id]
    );
    const row = (rows as any[])[0];
    if (!row) return null;
    return {
        ...row,
        file_size: row.file_size ? Number(row.file_size) : null,
        created_at: row.created_at ? new Date(row.created_at) : null,
        updated_at: row.updated_at ? new Date(row.updated_at) : null,
    } as Material;
}

// Tạo material mới
export async function createMaterial(material: Omit<Material, 'created_at' | 'updated_at'>): Promise<Material> {
    const { id, lesson_id, title, file_url, file_type, file_size, description } = material;
    const createdAt = new Date();
    const updatedAt = new Date();
    await pool.query(
        `INSERT INTO materials (id, lesson_id, title, file_url, file_type, file_size, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, lesson_id, title, file_url, file_type, file_size, description, createdAt, updatedAt]
    );

    // Lấy lại material vừa tạo để trả về (đảm bảo lấy đúng dữ liệu từ DB)
    const newMaterial = await getMaterialById(id);
    if (!newMaterial) {
        throw new Error('Failed to create or retrieve material after insertion.');
    }
    return newMaterial;
}

// Cập nhật material
export async function updateMaterial(
    id: string,
    updates: Partial<Omit<Material, 'id' | 'created_at'>> & { updated_at: Date }
): Promise<Material | null> {
    // Tạo một đối tượng mới chỉ chứa các trường cần update trong DB
    const dbUpdateFields: Partial<Omit<Material, 'id' | 'created_at' | 'updated_at'>> = {};
    for (const key in updates) {
        if (key !== 'id' && key !== 'created_at' && key !== 'updated_at' && updates.hasOwnProperty(key)) {
             // Copy các trường hợp lệ vào dbUpdateFields
            (dbUpdateFields as any)[key] = (updates as any)[key];
        }
    }


    // Chỉ cập nhật nếu có trường nào đó thay đổi
    if (Object.keys(dbUpdateFields).length === 0) {
        return getMaterialById(id);
    }

    const fields = Object.keys(dbUpdateFields).map(key => `${key} = ?`).join(', ');
    const values = Object.values(dbUpdateFields);

    // Thêm updated_at vào cuối câu SET và giá trị tương ứng
    const query = `UPDATE materials SET ${fields}, updated_at = ? WHERE id = ?`;
    const queryParams = [...values, updates.updated_at, id]; // Lấy updated_at từ object gốc

    const [result] = await pool.query(query, queryParams);

    if ((result as any).affectedRows === 0) {
       return null;
    }

    return getMaterialById(id);
}


// Xóa material
export async function deleteMaterial(id: string): Promise<boolean> {
    const [result] = await pool.query('DELETE FROM materials WHERE id = ?', [id]);
    return (result as any).affectedRows > 0;
}