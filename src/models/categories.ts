export interface Category {
    id: string; // Unique identifier
    name: string; // Category name
    description?: string; // Optional description
    parent_id?: string; // ID of parent category
    created_by?: string; // ID of the user who created the category
    status: "Active" | "Inactive"; // Enum for status
    created_at?: Date; // Date of creation
    updated_at?: Date; // Date of last update
  }
  