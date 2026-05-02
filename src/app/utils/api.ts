import { Project, Task, User } from "./types";

type AuthPayload = { email: string; password: string };
type RegisterPayload = AuthPayload & { name: string };
const apiOriginCandidates = [
  "",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://localhost:3004",
  "http://localhost:3005",
];
let resolvedApiOrigin: string | null = null;

async function resolveApiOrigin(): Promise<string> {
  if (resolvedApiOrigin !== null) {
    return resolvedApiOrigin;
  }

  for (const origin of apiOriginCandidates) {
    try {
      const healthUrl = `${origin}/api/health`;
      const response = await fetch(healthUrl, { method: "GET" });
      if (response.ok) {
        resolvedApiOrigin = origin;
        return origin;
      }
    } catch {
      // Try next candidate.
    }
  }

  // Fallback for first-run race conditions; request() will surface real errors.
  resolvedApiOrigin = "";
  return resolvedApiOrigin;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const origin = await resolveApiOrigin();
  const response = await fetch(`${origin}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    let message = "Request failed";
    try {
      const payload = await response.json();
      message = payload.message ?? message;
    } catch {
      // Fall back to a generic message when backend body is missing.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function login(payload: AuthPayload): Promise<User> {
  const data = await request<{ user: User }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.user;
}

export async function register(payload: RegisterPayload): Promise<User> {
  const data = await request<{ user: User }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.user;
}

export function getUsers(): Promise<User[]> {
  return request<User[]>("/api/users");
}

export function getProjects(): Promise<Project[]> {
  return request<Project[]>("/api/projects");
}

export function createProject(payload: Omit<Project, "id" | "createdAt">): Promise<Project> {
  return request<Project>("/api/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateProject(id: string, payload: Partial<Project>): Promise<Project> {
  return request<Project>(`/api/projects/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteProject(id: string): Promise<void> {
  return request<void>(`/api/projects/${id}`, { method: "DELETE" });
}

export function getTasks(): Promise<Task[]> {
  return request<Task[]>("/api/tasks");
}

export function createTask(payload: Omit<Task, "id" | "createdAt">): Promise<Task> {
  return request<Task>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTask(id: string, payload: Partial<Task>): Promise<Task> {
  return request<Task>(`/api/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteTask(id: string): Promise<void> {
  return request<void>(`/api/tasks/${id}`, { method: "DELETE" });
}
