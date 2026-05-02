import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTasks } from '../utils/api';
import { Task } from '../utils/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { CheckCircle2, Clock, AlertCircle, ListTodo } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    let mounted = true;
    getTasks().then((data) => {
      if (mounted) {
        setTasks(data);
      }
    }).catch(() => {
      if (mounted) {
        setTasks([]);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const visibleTasks = user
    ? tasks.filter((task) => task.assignedTo === user.id || task.createdBy === user.id)
    : tasks;
  const totalTasks = visibleTasks.length;
  const completedTasks = visibleTasks.filter(t => t.status === 'completed').length;
  const pendingTasks = visibleTasks.filter(t => t.status === 'pending').length;
  const overdueTasks = visibleTasks.filter(t => t.status === 'overdue').length;

  const stats = [
    {
      title: 'Total Tasks',
      value: totalTasks,
      icon: ListTodo,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Completed',
      value: completedTasks,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Pending',
      value: pendingTasks,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Overdue',
      value: overdueTasks,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.name ?? 'Guest'}!</h1>
        <p className="text-gray-600 mt-1">Here's an overview of your tasks</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`size-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
          <CardDescription>Your most recent tasks</CardDescription>
        </CardHeader>
        <CardContent>
          {visibleTasks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No visible tasks yet</p>
          ) : (
            <div className="space-y-3">
              {visibleTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{task.title}</h4>
                    <p className="text-sm text-gray-600">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                  </div>
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
