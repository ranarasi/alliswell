// Note: PDM role represents Delivery Director (DD) - kept as PDM in code for backwards compatibility
export type UserRole = 'Admin' | 'Practice Head' | 'PDM';
export type ProjectStatus = 'Active' | 'On Hold' | 'Completed';
export type StatusColor = 'Green' | 'Amber' | 'Red';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  last_login?: Date;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  start_date: Date;
  status: ProjectStatus;
  assigned_pdm?: string; // Delivery Director (DD) assigned to project
  created_at: Date;
  updated_at: Date;
}

export interface WeeklyStatus {
  id: string;
  project_id: string;
  week_ending_date: Date;
  overall_status: StatusColor;
  all_is_well: string;
  risks?: string;
  opportunities?: string;
  value_projects?: string;
  action_items?: string;
  submitted_by: string;
  submitted_at: Date;
  is_draft: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AuthRequest extends Request {
  user?: User;
}
