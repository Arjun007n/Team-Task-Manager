import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  createTask,
  deleteTask,
  getProjects,
  getTasks,
  updateTask,
} from '../utils/api';
import { Task, Project } from '../utils/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Plus, Trash2, Edit, Filter } from 'lucide-react';

export default function Tasks() {
  const { user } = useAuth();
  const actorId = user?.id ?? 'system';
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    priority: 'medium' as const,
    dueDate: '',
    status: 'pending' as const
  });

  useEffect(() => {
    Promise.all([getTasks(), getProjects()])
      .then(([taskData, projectData]) => {
        setTasks(taskData);
        setProjects(projectData);
      })
      .catch(() => setError('Failed to load tasks or projects'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (editingId) {
      const taskToUpdate = tasks.find((t) => t.id === editingId);
      if (!taskToUpdate) return;
      try {
        const updatedTask = await updateTask(editingId, { ...taskToUpdate, ...formData });
        setTasks(tasks.map((t) => (t.id === editingId ? updatedTask : t)));
      } catch {
        setError('Failed to update task');
        return;
      }
      setEditingId(null);
    } else {
      try {
        const newTask = await createTask({
          ...formData,
          assignedTo: null,
          createdBy: actorId,
        });
        setTasks([...tasks, newTask]);
      } catch {
        setError('Failed to create task');
        return;
      }
      setIsCreating(false);
    }

    setFormData({
      title: '',
      description: '',
      projectId: '',
      priority: 'medium',
      dueDate: '',
      status: 'pending'
    });
  };

  const handleEdit = (task: Task) => {
    setFormData({
      title: task.title,
      description: task.description,
      projectId: task.projectId,
      priority: task.priority,
      dueDate: task.dueDate,
      status: task.status
    });
    setEditingId(task.id);
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id);
      setTasks(tasks.filter((t) => t.id !== id));
    } catch {
      setError('Failed to delete task');
    }
  };

  const handleAssign = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    try {
      const updatedTask = await updateTask(taskId, { ...task, assignedTo: actorId });
      setTasks(tasks.map((t) => (t.id === taskId ? updatedTask : t)));
    } catch {
      setError('Failed to assign task');
    }
  };

  const handleUnassign = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    try {
      const updatedTask = await updateTask(taskId, { ...task, assignedTo: null });
      setTasks(tasks.map((t) => (t.id === taskId ? updatedTask : t)));
    } catch {
      setError('Failed to unassign task');
    }
  };

  const handleStatusChange = async (taskId: string, status: Task['status']) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    try {
      const updatedTask = await updateTask(taskId, { ...task, status });
      setTasks(tasks.map((t) => (t.id === taskId ? updatedTask : t)));
    } catch {
      setError('Failed to update task status');
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      projectId: '',
      priority: 'medium',
      dueDate: '',
      status: 'pending'
    });
  };

  const filteredTasks = filterStatus === 'all'
    ? tasks
    : tasks.filter(t => t.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-gray-600 mt-1">Manage and track all tasks</p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="size-4" />
            New Task
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-2">
        <Filter className="size-4 text-gray-500" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">All Tasks</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Task' : 'Create New Task'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectId">Project</Label>
                  <select
                    id="projectId"
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="">Select project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {filteredTasks.map((task) => {
          const project = projects.find(p => p.id === task.projectId);
          return (
            <Card key={task.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{task.title}</CardTitle>
                    <CardDescription>{task.description}</CardDescription>
                    {project && (
                      <p className="text-sm text-gray-500 mt-1">Project: {project.name}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(task)}
                    >
                      <Edit className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(task.id)}
                    >
                      <Trash2 className="size-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      task.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : task.status === 'in-progress'
                        ? 'bg-blue-100 text-blue-700'
                        : task.status === 'overdue'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {task.status}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      task.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : task.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {task.priority}
                  </span>
                  <span className="text-sm text-gray-500">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  {task.assignedTo === user?.id ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleUnassign(task.id)}>
                        Unassign Me
                      </Button>
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value as any)}
                        className="px-3 py-1 text-sm border rounded-md"
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="overdue">Overdue</option>
                      </select>
                    </>
                  ) : task.assignedTo === null ? (
                    <Button size="sm" onClick={() => handleAssign(task.id)}>
                      Assign to Me
                    </Button>
                  ) : (
                    <span className="text-sm text-gray-500">Assigned to another user</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
