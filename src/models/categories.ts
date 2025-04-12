export interface Category {
    id: string; 
    name: string; 
    description?: string; 
    parent_id?: string; 
    created_by?: string; 
    status: "Active" | "Inactive"; 
    created_at?: Date; 
    updated_at?: Date; 
  }
  