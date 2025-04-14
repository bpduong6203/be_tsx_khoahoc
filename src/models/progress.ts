import pool from '../database/db';
import { Progress, ProgressStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

export async function findOrCreateProgress(enrollmentId: string, lessonId: string): Promise<Progress> {
    const [findRows] = await pool.query(
        `SELECT id, enrollment_id, lesson_id, status, start_date, completion_date, last_access_date, time_spent, created_at, updated_at
         FROM progress
         WHERE enrollment_id = ? AND lesson_id = ?`,
        [enrollmentId, lessonId]
    );

    let progress = (findRows as any[])[0] as Progress | undefined;

    if (progress) {
        progress.start_date = progress.start_date ? new Date(progress.start_date) : null;
        progress.completion_date = progress.completion_date ? new Date(progress.completion_date) : null;
        progress.last_access_date = progress.last_access_date ? new Date(progress.last_access_date) : null;
        progress.created_at = progress.created_at ? new Date(progress.created_at) : null;
        progress.updated_at = progress.updated_at ? new Date(progress.updated_at) : null;
        return progress;
    }

    const newProgress: Progress = {
        id: uuidv4(),
        enrollment_id: enrollmentId,
        lesson_id: lessonId,
        status: ProgressStatus.NotStarted, 
        start_date: null,
        completion_date: null,
        last_access_date: null, 
        time_spent: 0,
        created_at: new Date(),
        updated_at: new Date(),
    };

    try {
        await pool.query(
            `INSERT INTO progress (id, enrollment_id, lesson_id, status, time_spent, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                newProgress.id, newProgress.enrollment_id, newProgress.lesson_id,
                newProgress.status, newProgress.time_spent ?? 0, 
                newProgress.created_at, newProgress.updated_at
            ]
        );
        return newProgress;
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            console.warn(`Duplicate entry detected for enrollment ${enrollmentId}, lesson ${lessonId}. Retrying find.`);
             const [retryRows] = await pool.query(
                `SELECT id, enrollment_id, lesson_id, status, start_date, completion_date, last_access_date, time_spent, created_at, updated_at
                 FROM progress
                 WHERE enrollment_id = ? AND lesson_id = ?`,
                [enrollmentId, lessonId]
            );
             const retryProgress = (retryRows as any[])[0];
             if(retryProgress) {
                  retryProgress.start_date = retryProgress.start_date ? new Date(retryProgress.start_date) : null;
                  retryProgress.completion_date = retryProgress.completion_date ? new Date(retryProgress.completion_date) : null;
                  retryProgress.last_access_date = retryProgress.last_access_date ? new Date(retryProgress.last_access_date) : null;
                  retryProgress.created_at = retryProgress.created_at ? new Date(retryProgress.created_at) : null;
                  retryProgress.updated_at = retryProgress.updated_at ? new Date(retryProgress.updated_at) : null;
                  return retryProgress as Progress;
             }
        }
        console.error("Error creating progress record:", error);
        throw new Error('Failed to create progress record.');
    }
}

export async function updateProgress(id: string, updates: Partial<Omit<Progress, 'id' | 'created_at' | 'enrollment_id' | 'lesson_id'>>): Promise<boolean> {
     updates.updated_at = new Date(); 

    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);

    if (values.length === 0) {
        return true; 
    }

    const query = `UPDATE progress SET ${fields} WHERE id = ?`;
    const queryParams = [...values, id];

    const [result] = await pool.query(query, queryParams);
    return (result as any).affectedRows > 0;
}

export async function getProgressByEnrollment(enrollmentId: string): Promise<Progress[]> {
    const [rows] = await pool.query(
        `SELECT id, enrollment_id, lesson_id, status, start_date, completion_date, last_access_date, time_spent, created_at, updated_at
         FROM progress
         WHERE enrollment_id = ?`,
        [enrollmentId]
    );
     return (rows as any[]).map(row => ({
        ...row,
        start_date: row.start_date ? new Date(row.start_date) : null,
        completion_date: row.completion_date ? new Date(row.completion_date) : null,
        last_access_date: row.last_access_date ? new Date(row.last_access_date) : null,
        created_at: row.created_at ? new Date(row.created_at) : null,
        updated_at: row.updated_at ? new Date(row.updated_at) : null,
    })) as Progress[];
}

export async function countCompletedLessons(enrollmentId: string): Promise<number> {
    const [rows] = await pool.query(
        'SELECT COUNT(*) as count FROM progress WHERE enrollment_id = ? AND status = ?',
        [enrollmentId, ProgressStatus.Completed]
    );
    return (rows as any[])[0]?.count || 0;
}

export async function countInProgressLessons(enrollmentId: string): Promise<number> {
    const [rows] = await pool.query(
        'SELECT COUNT(*) as count FROM progress WHERE enrollment_id = ? AND status = ?',
        [enrollmentId, ProgressStatus.InProgress]
    );
    return (rows as any[])[0]?.count || 0;
}


export async function getMaxLastAccessDate(enrollmentId: string): Promise<Date | null> {
     const [rows] = await pool.query(
        'SELECT MAX(last_access_date) as max_date FROM progress WHERE enrollment_id = ?',
        [enrollmentId]
    );
    const maxDate = (rows as any[])[0]?.max_date;
    return maxDate ? new Date(maxDate) : null;
}