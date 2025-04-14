// src/services/progressService.ts
import * as progressModel from '../models/progress';
import * as enrollmentModel from '../models/enrollment';
import * as lessonModel from '../models/lesson';
import { Progress, ProgressStatus, EnrollmentProgressDetail, UserCourseProgressSummary, LessonProgressInfo, Enrollment, Lesson  } from '../types';
import { AuthenticatedRequest } from '../middleware/auth'; // Để lấy user ID

// Lấy chi tiết tiến độ của một enrollment cụ thể
export async function getEnrollmentProgressService(enrollmentId: string, userId: string): Promise<EnrollmentProgressDetail> {
    // 1. Xác thực enrollment thuộc về user và lấy course_id
    const enrollment = await enrollmentModel.verifyEnrollmentOwner(enrollmentId, userId, false); // Không yêu cầu active, có thể xem cả completed/expired
    if (!enrollment) {
        throw createError(404, 'Enrollment not found or access denied.');
    }

    const courseId = enrollment.course_id;

    // 2. Lấy tất cả bài học của khóa học đó
    const lessons = await lessonModel.getLessonsByCourseId(courseId); // Hàm này đã có sẵn, lấy lesson đã Published
    const totalLessons = lessons.length;

    // 3. Lấy tất cả bản ghi progress của enrollment này
    const progressRecords = await progressModel.getProgressByEnrollment(enrollmentId);
    const progressMap = new Map(progressRecords.map(p => [p.lesson_id, p]));

    // 4. Tính toán số liệu tổng quan
    let completedLessons = 0;
    let inProgressLessons = 0;
    progressRecords.forEach(p => {
        if (p.status === ProgressStatus.Completed) {
            completedLessons++;
        } else if (p.status === ProgressStatus.InProgress) {
             inProgressLessons++;
        }
    });

    const completionPercentage = totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

    // 5. Tạo danh sách bài học kèm tiến độ
    const lessonsWithProgress: LessonProgressInfo[] = lessons.map((lesson: Lesson) => {
        const progress = progressMap.get(lesson.id);
        return {
            lesson_id: lesson.id,
            title: lesson.title,
            order_number: lesson.order_number,
            duration: lesson.duration,
            status: progress ? progress.status : ProgressStatus.NotStarted,
            start_date: progress ? progress.start_date : null,
            completion_date: progress ? progress.completion_date : null,
            last_access_date: progress ? progress.last_access_date : null,
            time_spent: progress ? progress.time_spent : 0,
        };
    });

     // Lấy thông tin course title (ví dụ)
     const courseInfo = await enrollmentModel.getCourseForEnrollment(courseId);

    return {
        enrollment_id: enrollmentId,
        course_id: courseId,
        course_title: courseInfo?.title,
        total_lessons: totalLessons,
        completed_lessons: completedLessons,
        in_progress_lessons: inProgressLessons, // Thêm số bài đang học
        completion_percentage: completionPercentage,
        lessons: lessonsWithProgress,
    };
}

// Cập nhật tiến độ cho một bài học cụ thể
export async function updateLessonProgressService(
    enrollmentId: string,
    lessonId: string,
    userId: string,
    data: { status?: ProgressStatus; time_spent?: number }
): Promise<Progress> {
    // 1. Xác thực enrollment thuộc về user và đang active
    const enrollment = await enrollmentModel.verifyEnrollmentOwner(enrollmentId, userId, true);
    if (!enrollment) {
        throw createError(404, 'Active enrollment not found or access denied.');
    }

    // 2. Xác thực lesson thuộc về course của enrollment đó
    const isValidLesson = await lessonModel.verifyLessonInCourse(lessonId, enrollment.course_id);
    if (!isValidLesson) {
        throw createError(404, 'Lesson not found in this course.');
    }

    // 3. Tìm hoặc tạo bản ghi progress
    const progress = await progressModel.findOrCreateProgress(enrollmentId, lessonId);

    // 4. Chuẩn bị dữ liệu cập nhật
    const updates: Partial<Omit<Progress, 'id' | 'created_at' | 'enrollment_id' | 'lesson_id'>> = {};
    let needsSave = false;

    // Cập nhật status và các ngày liên quan
    if (data.status && data.status !== progress.status && Object.values(ProgressStatus).includes(data.status)) {
        updates.status = data.status;
        if (data.status === ProgressStatus.InProgress && !progress.start_date) {
            updates.start_date = new Date();
        } else if (data.status === ProgressStatus.Completed && !progress.completion_date) {
            updates.completion_date = new Date();
            // Reset start_date nếu chưa có? Hoặc giữ nguyên? Tùy logic.
            if (!progress.start_date) updates.start_date = updates.completion_date;
        }
         needsSave = true;
    }

    // Cập nhật time_spent (nếu có và hợp lệ)
    // Logic time_spent có thể phức tạp hơn (tích lũy, ...)
    if (data.time_spent !== undefined && typeof data.time_spent === 'number' && data.time_spent >= 0) {
        updates.time_spent = data.time_spent; // Ghi đè hoặc cộng dồn? Hiện tại là ghi đè.
         needsSave = true;
    }

    // Luôn cập nhật last_access_date nếu có thay đổi
    if (needsSave) {
       updates.last_access_date = new Date();
       await progressModel.updateProgress(progress.id, updates);
    } else {
        // Nếu không có thay đổi status/time_spent, chỉ cập nhật last_access_date nếu cần
        if (!progress.last_access_date || (new Date().getTime() - progress.last_access_date.getTime() > 60000) ) { // Ví dụ: chỉ update sau 1 phút
             updates.last_access_date = new Date();
             await progressModel.updateProgress(progress.id, updates);
        }
    }


    // 5. Kiểm tra hoàn thành khóa học (sau khi cập nhật DB thành công)
     if (updates.status === ProgressStatus.Completed) {
        await checkCourseCompletion(enrollmentId);
     }


    // Trả về bản ghi progress đã cập nhật (hoặc vừa tìm/tạo)
    // Cần lấy lại từ DB để đảm bảo dữ liệu mới nhất
    const updatedProgress = await progressModel.findOrCreateProgress(enrollmentId, lessonId);
    return updatedProgress;
}


// Hàm helper kiểm tra và cập nhật hoàn thành khóa học
async function checkCourseCompletion(enrollmentId: string): Promise<void> {
    try {
        const enrollment = await enrollmentModel.getEnrollmentById(enrollmentId); // Lấy enrollment đầy đủ
        if (!enrollment || enrollment.status === 'Completed') {
            return; // Không tìm thấy hoặc đã hoàn thành rồi
        }

        const totalLessons = await lessonModel.countLessonsByCourseId(enrollment.course_id);
        const completedLessons = await progressModel.countCompletedLessons(enrollmentId);

        if (totalLessons > 0 && totalLessons === completedLessons) {
            await enrollmentModel.updateEnrollmentCompletionStatus(enrollmentId, 'Completed', new Date());
             console.log(`Enrollment ${enrollmentId} marked as completed.`);
        }
    } catch (error) {
        console.error(`Error checking course completion for enrollment ${enrollmentId}:`, error);
        // Không nên để lỗi này dừng luồng chính, chỉ log lại
    }
}

// Đánh dấu bắt đầu bài học
export async function startLessonService(enrollmentId: string, lessonId: string, userId: string): Promise<Progress> {
     // Chỉ cần cập nhật last_access_date và status nếu đang là Not Started
     const progress = await progressModel.findOrCreateProgress(enrollmentId, lessonId);
      const updates: Partial<Omit<Progress, 'id' | 'created_at' | 'enrollment_id' | 'lesson_id'>> = {
           last_access_date: new Date()
      };
      if (progress.status === ProgressStatus.NotStarted) {
           updates.status = ProgressStatus.InProgress;
           updates.start_date = new Date();
      }

    await updateLessonProgressService(enrollmentId, lessonId, userId, { status: ProgressStatus.InProgress });
     // Lấy lại progress sau khi đã gọi updateLessonProgressService để có dữ liệu mới nhất
    return progressModel.findOrCreateProgress(enrollmentId, lessonId);
}

// Đánh dấu hoàn thành bài học
export async function completeLessonService(enrollmentId: string, lessonId: string, userId: string): Promise<Progress> {
    return updateLessonProgressService(enrollmentId, lessonId, userId, {
        status: ProgressStatus.Completed
    });
}

// Lấy tóm tắt tiến độ các khóa học của user
export async function getUserCoursesProgressService(userId: string): Promise<UserCourseProgressSummary[]> {
    // 1. Lấy các enrollment đang active của user, kèm thông tin course
    const enrollments = await enrollmentModel.getEnrollmentsByUserIdWithCourse(userId, 'Active');

    const coursesProgress: UserCourseProgressSummary[] = [];

    // 2. Lặp qua từng enrollment để tính toán tiến độ
    for (const enrollment of enrollments) {
        if (!enrollment.course) continue; // Bỏ qua nếu không có thông tin course

        const courseId = enrollment.course_id;
        const totalLessons = await lessonModel.countLessonsByCourseId(courseId);
        const completedLessons = await progressModel.countCompletedLessons(enrollment.id);
        const lastAccessed = await progressModel.getMaxLastAccessDate(enrollment.id);

        const completionPercentage = totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : (enrollment.status === 'Completed' ? 100 : 0); // Nếu enrollment đã complete thì 100%

        coursesProgress.push({
            enrollment_id: enrollment.id,
            course_id: courseId,
            course_title: enrollment.course.title,
            course_thumbnail: enrollment.course.thumbnail_url,
            total_lessons: totalLessons,
            completed_lessons: completedLessons,
            completion_percentage: completionPercentage,
            last_accessed: lastAccessed,
        });
    }

    return coursesProgress;
}


// Helper function để tạo lỗi có status code
function createError(status: number, message: string): Error {
     const error = new Error(message);
    (error as any).status = status;
     return error;
}