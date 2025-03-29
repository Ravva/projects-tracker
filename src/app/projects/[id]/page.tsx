import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { CalendarIcon, GitHubLogoIcon, GlobeIcon, FileTextIcon } from "@radix-ui/react-icons";

interface ProjectPageProps {
  params: {
    id: string;
  };
}

const statusConfig = {
  pending: { label: "На рассмотрении", variant: "outline" as const },
  active: { label: "Активный", variant: "default" as const },
  completed: { label: "Завершен", variant: "secondary" as const }, // Changed from "success" to "secondary"
  rejected: { label: "Отклонен", variant: "destructive" as const },
};

// Добавим типы для проекта и задач
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  project_id: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

interface ProjectMember {
  user: {
    id: string;
    name: string;
    email: string;
  }
}

interface Project {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'rejected';
  progress: number;
  owner_id: string;
  github_url?: string;
  demo_url?: string;
  prd_url?: string;
  deadline?: string;
  created_at: string;
  updated_at: string;
  owner: {
    name: string;
    email: string;
  };
  members: ProjectMember[];
  tasks: Task[];
}

async function getProject(id: string): Promise<Project | null> {
  try {
    const { data: project, error } = await supabase
      .from("projects")
      .select(`
        *,
        owner:users!projects_owner_id_fkey(name, email),
        members:project_members(
          user:users(id, name, email)
        )
      `)
      .eq("id", id)
      .single();

    if (error || !project) {
      console.error("Error fetching project:", error);
      return null;
    }

    // Получаем задачи проекта
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false });

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
    }

    return {
      ...project,
      tasks: tasks || [],
    } as Project;
  } catch (error) {
    console.error("Unexpected error:", error);
    return null;
  }
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const project = await getProject(params.id);
  
  if (!project) {
    return {
      title: "Проект не найден | Digital Projects Tracker",
    };
  }
  
  return {
    title: `${project.title} | Digital Projects Tracker`,
    description: project.description,
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await getServerSession();
  
  if (!session?.user) {
    redirect("/auth/login");
  }
  
  const project = await getProject(params.id);
  
  if (!project) {
    notFound();
  }
  
  // Проверяем права пользователя на редактирование проекта
  const isOwner = project.owner_id === session.user.id;
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .single();
    
  if (userError) {
    console.error("Error fetching user role:", userError);
  }
    
  const isAdmin = userData?.role === "admin";
  const canEdit = isOwner || isAdmin;
  
  // Рассчитываем прогресс проекта на основе задач
  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter((task) => task.status === "done").length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Обработка случая, когда статус проекта не соответствует ни одному из определенных
  const defaultStatus = { label: "Неизвестный", variant: "outline" as const };
  const { label: statusLabel, variant: statusVariant } = 
    statusConfig[project.status as keyof typeof statusConfig] || defaultStatus;
  
  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{project.title}</h1>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        
        {canEdit && (
          <div className="flex gap-2">
            <Link href={`/projects/${params.id}/edit`}>
              <Button variant="outline">Редактировать</Button>
            </Link>
            {isAdmin && project.status === "pending" && (
              <Button variant="default">Утвердить проект</Button>
            )}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Прогресс</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Выполнено задач: {completedTasks}/{totalTasks}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Команда</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{project.owner.name}</p>
                  <p className="text-sm text-muted-foreground">{project.owner.email}</p>
                </div>
                <Badge>Владелец</Badge>
              </div>
              
              {project.members.map((member: any) => (
                <div key={member.user.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{member.user.name}</p>
                    <p className="text-sm text-muted-foreground">{member.user.email}</p>
                  </div>
                  <Badge variant="outline">Участник</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Ссылки</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {project.github_url && (
                <a 
                  href={project.github_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:underline"
                >
                  <GitHubLogoIcon className="h-4 w-4" />
                  <span>GitHub репозиторий</span>
                </a>
              )}
              
              {project.demo_url && (
                <a 
                  href={project.demo_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:underline"
                >
                  <GlobeIcon className="h-4 w-4" />
                  <span>Демо проекта</span>
                </a>
              )}
              
              {project.prd_url && (
                <a 
                  href={project.prd_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:underline"
                >
                  <FileTextIcon className="h-4 w-4" />
                  <span>PRD документ</span>
                </a>
              )}
              
              {project.deadline && (
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Дедлайн: {new Date(project.deadline).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList>
          <TabsTrigger value="tasks">Задачи</TabsTrigger>
          <TabsTrigger value="prd">PRD</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tasks" className="py-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Задачи проекта</h2>
            {canEdit && (
              <Link href={`/projects/${params.id}/tasks/new`}>
                <Button>Добавить задачу</Button>
              </Link>
            )}
          </div>
          
          {project.tasks.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-2">Нет задач</h3>
              <p className="text-muted-foreground mb-6">
                Добавьте задачи, чтобы отслеживать прогресс проекта
              </p>
              {canEdit && (
                <Link href={`/projects/${params.id}/tasks/new`}>
                  <Button>Добавить задачу</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Колонка To Do */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-medium mb-4">To Do</h3>
                <div className="space-y-3">
                  {project.tasks
                    .filter((task: any) => task.status === "todo")
                    .map((task: any) => (
                      <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-base">{task.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
              
              {/* Колонка In Progress */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-medium mb-4">In Progress</h3>
                <div className="space-y-3">
                  {project.tasks
                    .filter((task: any) => task.status === "in_progress")
                    .map((task: any) => (
                      <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-base">{task.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
              
              {/* Колонка Done */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-medium mb-4">Done</h3>
                <div className="space-y-3">
                  {project.tasks
                    .filter((task: any) => task.status === "done")
                    .map((task: any) => (
                      <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-base">{task.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="prd" className="py-4">
          {project.prd_url ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">PRD документ</h2>
                <a 
                  href={project.prd_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm hover:underline"
                >
                  <Button variant="outline">
                    <FileTextIcon className="h-4 w-4 mr-2" />
                    Открыть в новой вкладке
                  </Button>
                </a>
              </div>
              <Card>
                <CardContent className="p-6">
                  <iframe 
                    src={project.prd_url} 
                    className="w-full h-[600px] border-0"
                    title="PRD документ"
                  />
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-2">PRD документ не загружен</h3>
              <p className="text-muted-foreground mb-6">
                Для этого проекта не загружен PRD документ
              </p>
              {canEdit && (
                <Link href={`/projects/${params.id}/edit`}>
                  <Button>Загрузить PRD</Button>
                </Link>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}