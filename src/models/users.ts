export interface User {
    id: string;
    name: string;
    email?: string;
    email_verified_at?: Date;
    avatar?: string;
    password?: string;
    remember_token?: string;
    created_at?: Date;
    updated_at?: Date;
  }
  