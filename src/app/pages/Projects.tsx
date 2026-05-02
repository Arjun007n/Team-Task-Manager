import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createProject, deleteProject, getProjects, updateProject } from '../utils/api';
import { Project } from '../utils/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Plus, Trash2, Edit } from 'lucide-react';

export default function Projects() {
  const { user } = useAuth();
  const actorId = user?.id ?? 'system';
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active' as const
  });

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(() => setError('Failed to load projects'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (editingId) {
      try {
        const updatedProject = await updateProject(editingId, formData);
        setProjects(projects.map((p) => (p.id === editingId ? updatedProject : p)));
      } catch {
        setError('Failed to update project');
        return;
      }
      setEditingId(null);
    } else {
      try {
        const newProject = await createProject({
          ...formData,
          createdBy: actorId,
        });
        setProjects([...projects, newProject]);
      } catch {
        setError('Failed to create project');
        return;
      }
      setIsCreating(false);
    }

    setFormData({ name: '', description: '', status: 'active' });
  };

  const handleEdit = (project: Project) => {
    setFormData({
      name: project.name,
      description: project.description,
      status: project.status
    });
    setEditingId(project.id);
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProject(id);
      setProjects(projects.filter((p) => p.id !== id));
    } catch {
      setError('Failed to delete project');
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({ name: '', description: '', status: 'active' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-gray-600 mt-1">Manage your team projects</p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="size-4" />
            New Project
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Project' : 'Create New Project'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(project)}
                  >
                    <Edit className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(project.id)}
                  >
                    <Trash2 className="size-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    project.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : project.status === 'completed'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {project.status}
                </span>
                <span className="text-sm text-gray-500">{project.createdAt}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
