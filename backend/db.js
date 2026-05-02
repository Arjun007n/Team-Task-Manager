import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "database.sqlite");
const legacyDataPath = path.join(__dirname, "data.json");

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

async function readLegacyData() {
  try {
    const raw = await fs.readFile(legacyDataPath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
    };
  } catch {
    return { users: [], projects: [], tasks: [] };
  }
}

async function migrateLegacyDataIfNeeded(db) {
  const [userCountRow, projectCountRow, taskCountRow] = await Promise.all([
    db.get("SELECT COUNT(*) AS count FROM users"),
    db.get("SELECT COUNT(*) AS count FROM projects"),
    db.get("SELECT COUNT(*) AS count FROM tasks"),
  ]);

  const totalRows =
    (userCountRow?.count ?? 0) +
    (projectCountRow?.count ?? 0) +
    (taskCountRow?.count ?? 0);

  if (totalRows > 0) {
    return;
  }

  const legacy = await readLegacyData();
  for (const user of legacy.users) {
    await db.run(
      "INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)",
      user.id,
      user.email,
      user.password,
      user.name,
      user.role ?? "member"
    );
  }

  for (const project of legacy.projects) {
    await db.run(
      "INSERT INTO projects (id, name, description, createdBy, createdAt, status) VALUES (?, ?, ?, ?, ?, ?)",
      project.id,
      project.name,
      project.description ?? "",
      project.createdBy ?? "system",
      project.createdAt ?? getTodayDate(),
      project.status ?? "active"
    );
  }

  for (const task of legacy.tasks) {
    await db.run(
      "INSERT INTO tasks (id, title, description, projectId, assignedTo, status, priority, dueDate, createdBy, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      task.id,
      task.title,
      task.description ?? "",
      task.projectId,
      task.assignedTo ?? null,
      task.status ?? "pending",
      task.priority ?? "medium",
      task.dueDate ?? getTodayDate(),
      task.createdBy ?? "system",
      task.createdAt ?? getTodayDate()
    );
  }
}

export async function initDb() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'member'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      createdBy TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('active', 'completed', 'archived'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      projectId TEXT NOT NULL,
      assignedTo TEXT,
      status TEXT NOT NULL CHECK(status IN ('pending', 'in-progress', 'completed', 'overdue')),
      priority TEXT NOT NULL CHECK(priority IN ('low', 'medium', 'high')),
      dueDate TEXT NOT NULL,
      createdBy TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  await migrateLegacyDataIfNeeded(db);
  return db;
}
