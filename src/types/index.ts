export interface User {
    id: string;
    name: string;
    email: string | null;
    password: string | null;
    avatar: string | null;
    created_at: Date;
    updated_at: Date;
    roles: Role[];
}

export interface Role {
    id: string;
    name: 'admin' | 'user';
}

export interface Category {
    id: string;
    name: string;
    status: 'Active' | 'Inactive';
    courses?: Course[];
}

export interface Lesson {
    id: string;
    course_id: string;
    title: string;
    description: string | null;
    content: string | null;
    video_url: string | null;
    duration: number | null;
    order_number: number;
    status: 'Published' | 'Draft';
    created_at: Date;
    updated_at: Date;
}

export interface Course {
    id: string;
    title: string;
    description: string | null;
    category_id: string | null;
    user_id: string;
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
    created_at: Date;
    category: { id: string; name: string } | null;
    user: { id: string; name: string } | null;
    lessons: Lesson[];
}

export interface Enrollment {
    id: string;
    user_id: string;
    course_id: string;
    expiry_date: Date | null;
    payment_status: 'Pending' | 'Completed' | 'Failed';
    payment_method: 'Momo' | 'Bank' | 'Paypal' | 'Cash' | null;
    transaction_id: string | null;
    price: number;
    status: 'Pending' | 'Active' | 'Expired';
    completion_date: Date | null;
    created_at: Date;
    updated_at: Date;
}
export interface Payment {
    id: string;
    invoice_code: string;
    enrollment_id: string | null;
    user_id: string;
    amount: number;
    payment_method: 'Momo' | 'Bank' | 'Paypal' | 'Cash';
    transaction_id: string | null;
    status: 'Pending' | 'Completed' | 'Failed' | 'Refunded';
    billing_info: string | null;
    created_at: Date;
    updated_at: Date;
}