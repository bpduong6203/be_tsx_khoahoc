import * as progressModel from '../models/progress';
import * as enrollmentModel from '../models/enrollment';
import * as lessonModel from '../models/lesson';
import { Progress, ProgressStatus, EnrollmentProgressDetail, UserCourseProgressSummary, LessonProgressInfo, Enrollment, Lesson  } from '../types';
import { AuthenticatedRequest } from '../middleware/auth'; 


export async function getEnrollmentProgressService(enrollmentId: string, userId: string): Promise<EnrollmentProgressDetail> {
    const enrollment = await enrollmentModel.verifyEnrollmentOwner(enrollmentId, userId, false); 
    if (!enrollment) {
        throw createError(404, 'Enrollment not found or access denied.');
    }

    const courseId = enrollment.course_id;

  
    const lessons = await lessonModel.getLessonsByCourseId(courseId); 
    const totalLessons = lessons.length;


    const progressRecords = await progressModel.getProgressByEnrollment(enrollmentId);
    const progressMap = new Map(progressRecords.map(p => [p.lesson_id, p]));


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

     const courseInfo = await enrollmentModel.getCourseForEnrollment(courseId);

    return {
        enrollment_id: enrollmentId,
        course_id: courseId,
        course_title: courseInfo?.title,
        total_lessons: totalLessons,
        completed_lessons: completedLessons,
        in_progress_lessons: inProgressLessons, 
        completion_percentage: completionPercentage,
        lessons: lessonsWithProgress,
    };
}


export async function updateLessonProgressService(
    enrollmentId: string,
    lessonId: string,
    userId: string,
    data: { status?: ProgressStatus; time_spent?: number }
): Promise<Progress> {
    const enrollment = await enrollmentModel.verifyEnrollmentOwner(enrollmentId, userId, true);
    if (!enrollment) {
        throw createError(404, 'Active enrollment not found or access denied.');
    }

    const isValidLesson = await lessonModel.verifyLessonInCourse(lessonId, enrollment.course_id);
    if (!isValidLesson) {
        throw createError(404, 'Lesson not found in this course.');
    }

    const progress = await progressModel.findOrCreateProgress(enrollmentId, lessonId);

    const updates: Partial<Omit<Progress, 'id' | 'created_at' | 'enrollment_id' | 'lesson_id'>> = {};
    let needsSave = false;

    if (data.status && data.status !== progress.status && Object.values(ProgressStatus).includes(data.status)) {
        updates.status = data.status;
        if (data.status === ProgressStatus.InProgress && !progress.start_date) {
            updates.start_date = new Date();
        } else if (data.status === ProgressStatus.Completed && !progress.completion_date) {
            updates.completion_date = new Date();
            if (!progress.start_date) updates.start_date = updates.completion_date;
        }
         needsSave = true;
    }

    if (data.time_spent !== undefined && typeof data.time_spent === 'number' && data.time_spent >= 0) {
        updates.time_spent = data.time_spent; 
         needsSave = true;
    }


    if (needsSave) {
       updates.last_access_date = new Date();
       await progressModel.updateProgress(progress.id, updates);
    } else {
        if (!progress.last_access_date || (new Date().getTime() - progress.last_access_date.getTime() > 60000) ) { // Ví dụ: chỉ update sau 1 phút
             updates.last_access_date = new Date();
             await progressModel.updateProgress(progress.id, updates);
        }
    }
     if (updates.status === ProgressStatus.Completed) {
        await checkCourseCompletion(enrollmentId);
     }
    const updatedProgress = await progressModel.findOrCreateProgress(enrollmentId, lessonId);
    return updatedProgress;
}

async function checkCourseCompletion(enrollmentId: string): Promise<void> {
    try {
        const enrollment = await enrollmentModel.getEnrollmentById(enrollmentId); // Lấy enrollment đầy đủ
        if (!enrollment || enrollment.status === 'Completed') {
            return; 
        }

        const totalLessons = await lessonModel.countLessonsByCourseId(enrollment.course_id);
        const completedLessons = await progressModel.countCompletedLessons(enrollmentId);

        if (totalLessons > 0 && totalLessons === completedLessons) {
            await enrollmentModel.updateEnrollmentCompletionStatus(enrollmentId, 'Completed', new Date());
             console.log(`Enrollment ${enrollmentId} marked as completed.`);
        }
    } catch (error) {
        console.error(`Error checking course completion for enrollment ${enrollmentId}:`, error);
    }
}

export async function startLessonService(enrollmentId: string, lessonId: string, userId: string): Promise<Progress> {
     const progress = await progressModel.findOrCreateProgress(enrollmentId, lessonId);
      const updates: Partial<Omit<Progress, 'id' | 'created_at' | 'enrollment_id' | 'lesson_id'>> = {
           last_access_date: new Date()
      };
      if (progress.status === ProgressStatus.NotStarted) {
           updates.status = ProgressStatus.InProgress;
           updates.start_date = new Date();
      }

    await updateLessonProgressService(enrollmentId, lessonId, userId, { status: ProgressStatus.InProgress });
    return progressModel.findOrCreateProgress(enrollmentId, lessonId);
}


export async function completeLessonService(enrollmentId: string, lessonId: string, userId: string): Promise<Progress> {
    return updateLessonProgressService(enrollmentId, lessonId, userId, {
        status: ProgressStatus.Completed
    });
}


export async function getUserCoursesProgressService(userId: string): Promise<UserCourseProgressSummary[]> {
    const enrollments = await enrollmentModel.getEnrollmentsByUserIdWithCourse(userId, 'Active');

    const coursesProgress: UserCourseProgressSummary[] = [];

    for (const enrollment of enrollments) {
        if (!enrollment.course) continue; 

        const courseId = enrollment.course_id;
        const totalLessons = await lessonModel.countLessonsByCourseId(courseId);
        const completedLessons = await progressModel.countCompletedLessons(enrollment.id);
        const lastAccessed = await progressModel.getMaxLastAccessDate(enrollment.id);

        const completionPercentage = totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : (enrollment.status === 'Completed' ? 100 : 0); 

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

function createError(status: number, message: string): Error {
     const error = new Error(message);
    (error as any).status = status;
     return error;
}