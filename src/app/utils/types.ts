export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
  status: 'active' | 'completed' | 'archived';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assignedTo: string | null;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  createdBy: string;
  createdAt: string;
}
