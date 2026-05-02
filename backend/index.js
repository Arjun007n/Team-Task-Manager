import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { initDb } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, "..", "dist");
const indexHtmlPath = path.join(distDir, "index.html");

const app = express();
const START_PORT = Number(process.env.PORT) || 3001;
const MAX_PORT_TRIES = 10;

app.use(cors());
app.use(express.json());
const db = await initDb();
app.use((req, _res, next) => {
  req.db = db;
  next();
});

function toPublicUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
  const { email, password } = req.body ?? {};
  const user = await req.db.get(
    "SELECT id, email, password, name, role FROM users WHERE email = ? AND password = ?",
    email,
    password
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  return res.json({ user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/register", async (req, res, next) => {
  try {
  const { email, password, name } = req.body ?? {};

  if (!email || !password || !name) {
    return res.status(400).json({ message: "Email, password, and name are required" });
  }

  const exists = await req.db.get("SELECT id FROM users WHERE email = ?", email);
  if (exists) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const countRow = await req.db.get("SELECT COUNT(*) AS count FROM users");
  const newUser = {
    id: Date.now().toString(),
    email,
    password,
    name,
    role: (countRow?.count ?? 0) === 0 ? "admin" : "member",
  };

  await req.db.run(
    "INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)",
    newUser.id,
    newUser.email,
    newUser.password,
    newUser.name,
    newUser.role
  );
  return res.status(201).json({ user: toPublicUser(newUser) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/users", async (req, res, next) => {
  try {
    const users = await req.db.all("SELECT id, email, name, role FROM users ORDER BY id ASC");
    res.json(users);
  } catch (error) {
    next(error);
  }
});

app.get("/api/debug/db", async (req, res, next) => {
  try {
    const [users, projects, tasks] = await Promise.all([
      req.db.all("SELECT id, email, name, role FROM users ORDER BY id ASC"),
      req.db.all("SELECT * FROM projects ORDER BY createdAt DESC, id DESC"),
      req.db.all("SELECT * FROM tasks ORDER BY createdAt DESC, id DESC"),
    ]);

    res.json({
      counts: {
        users: users.length,
        projects: projects.length,
        tasks: tasks.length,
      },
      users,
      projects,
      tasks,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/projects", async (req, res, next) => {
  try {
    const projects = await req.db.all("SELECT * FROM projects ORDER BY createdAt DESC, id DESC");
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

app.post("/api/projects", async (req, res, next) => {
  try {
  const project = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: getTodayDate(),
  };

  await req.db.run(
    "INSERT INTO projects (id, name, description, createdBy, createdAt, status) VALUES (?, ?, ?, ?, ?, ?)",
    project.id,
    project.name,
    project.description ?? "",
    project.createdBy ?? "system",
    project.createdAt,
    project.status ?? "active"
  );
  res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

app.put("/api/projects/:id", async (req, res, next) => {
  try {
  const existing = await req.db.get("SELECT * FROM projects WHERE id = ?", req.params.id);
  if (!existing) {
    return res.status(404).json({ message: "Project not found" });
  }

  const updated = { ...existing, ...req.body, id: req.params.id };
  await req.db.run(
    "UPDATE projects SET name = ?, description = ?, createdBy = ?, createdAt = ?, status = ? WHERE id = ?",
    updated.name,
    updated.description ?? "",
    updated.createdBy ?? "system",
    updated.createdAt ?? existing.createdAt,
    updated.status ?? "active",
    req.params.id
  );
  return res.json(updated);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/projects/:id", async (req, res, next) => {
  try {
  const result = await req.db.run("DELETE FROM projects WHERE id = ?", req.params.id);
  if ((result?.changes ?? 0) === 0) {
    return res.status(404).json({ message: "Project not found" });
  }
  return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.get("/api/tasks", async (req, res, next) => {
  try {
    const tasks = await req.db.all("SELECT * FROM tasks ORDER BY createdAt DESC, id DESC");
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

app.post("/api/tasks", async (req, res, next) => {
  try {
  const task = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: getTodayDate(),
  };
  await req.db.run(
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
    task.createdAt
  );
  res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

app.put("/api/tasks/:id", async (req, res, next) => {
  try {
  const existing = await req.db.get("SELECT * FROM tasks WHERE id = ?", req.params.id);
  if (!existing) {
    return res.status(404).json({ message: "Task not found" });
  }

  const updated = { ...existing, ...req.body, id: req.params.id };
  await req.db.run(
    "UPDATE tasks SET title = ?, description = ?, projectId = ?, assignedTo = ?, status = ?, priority = ?, dueDate = ?, createdBy = ?, createdAt = ? WHERE id = ?",
    updated.title,
    updated.description ?? "",
    updated.projectId,
    updated.assignedTo ?? null,
    updated.status ?? "pending",
    updated.priority ?? "medium",
    updated.dueDate ?? getTodayDate(),
    updated.createdBy ?? "system",
    updated.createdAt ?? existing.createdAt,
    req.params.id
  );
  return res.json(updated);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/tasks/:id", async (req, res, next) => {
  try {
  const result = await req.db.run("DELETE FROM tasks WHERE id = ?", req.params.id);
  if ((result?.changes ?? 0) === 0) {
    return res.status(404).json({ message: "Task not found" });
  }
  return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.use("/api", (_req, res) => {
  res.status(404).json({ message: "Not found" });
});

if (fs.existsSync(indexHtmlPath)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return next();
    }
    res.sendFile(indexHtmlPath, (err) => {
      if (err) next(err);
    });
  });
} else {
  console.warn(
    "No production build found at dist/. Run `npm run build` to serve the React app from this server."
  );
}

app.use((error, _req, res, _next) => {
  console.error("API error:", error);
  res.status(500).json({ message: "Internal server error" });
});

function startServer(port, triesLeft) {
  const server = app.listen(port, () => {
    console.log(`Backend server is started on http://localhost:${port}`);
    console.log(`Connected to SQLite DB at backend/database.sqlite`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && !process.env.PORT && triesLeft > 1) {
      const nextPort = port + 1;
      console.warn(`Port ${port} is busy, trying ${nextPort}...`);
      startServer(nextPort, triesLeft - 1);
      return;
    }

    if (error.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use. Stop the existing server or change PORT.`);
      return;
    }

    console.error("Failed to start backend server:", error);
  });
}

startServer(START_PORT, MAX_PORT_TRIES);
