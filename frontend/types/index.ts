export type UserRole = 'Admin' | 'Practice Head' | 'PDM';

export type ProjectStatus = 'Active' | 'On Hold' | 'Completed';

export type StatusColor = 'Green' | 'Amber' | 'Red';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  startDate: Date;
  status: ProjectStatus;
  assignedPDM?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeeklyStatus {
  id: string;
  projectId: string;
  weekEndingDate: Date;
  overallStatus: StatusColor;
  allIsWell: string;
  risks?: string;
  opportunities?: string;
  valueProjects?: string;
  actionItems?: string;
  submittedBy: string;
  submittedAt: Date;
  isDraft: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  statusId: string;
  userId: string;
  comment: string;
  createdAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
