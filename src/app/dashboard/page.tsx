import { Metadata } from "next";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { supabase } from "@/lib/supabase/client";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardIcon, CalendarIcon, GitHubLogoIcon, PersonIcon } from "@radix-ui/react-icons";

export const metadata: Metadata = {
  title: "Дашборд | Digital Projects Tracker",
  description: "Управление школьными IT-проектами",
};

async function getProjects() {
  const session = await getServerSession();
  
  if (!session?.user) {
    return [];
  }
  
  // Получаем проекты в зависимости от роли пользователя
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .single();
    
  const isAdmin = userData?.role === "admin";
  
  if (isAdmin) {
    // Администраторы видят все проекты
    const { data } = await supabase
      .from("projects")
      .select(`
        *,
        team_members:project_members(count)
      `)
      .order("created_at", { ascending: false });
      
    return data || [];
  } else {
    // Ученики видят только свои проекты и проекты, где они участники
    const { data } = await supabase
      .from("projects")
      .select(`
        *,
        team_members:project_members(count)
      `)
      .or(`owner_id.eq.${session.user.id},project_members.user_id.eq.${session.user.id}`)
      .order("created_at", { ascending: false });
      
    return data || [];
  }
}

export default async function DashboardPage() {
  const projects = await getProjects();
  
  return (
    <PageLayout 
      title="Панель управления"
      subtitle="Обзор ваших проектов и активностей"
    >
      {/* Статистические карточки */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <Card className="card">
          <CardHeader className="p-0 pb-3 space-y-0 flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-white">Активные проекты</CardTitle>
            <div className="icon-container">
              <DashboardIcon className="icon" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-bold text-white">{projects.length}</div>
            <p className="text-[#ABABAB] text-sm mt-1">+2 за последний месяц</p>
          </CardContent>
        </Card>
        
        <Card className="card">
          <CardHeader className="p-0 pb-3 space-y-0 flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-white">Задачи</CardTitle>
            <div className="icon-container">
              <CalendarIcon className="icon" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-bold text-white">36</div>
            <p className="text-[#ABABAB] text-sm mt-1">8 требуют внимания</p>
          </CardContent>
        </Card>
        
        <Card className="card">
          <CardHeader className="p-0 pb-3 space-y-0 flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-white">Участники</CardTitle>
            <div className="icon-container">
              <PersonIcon className="icon" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-bold text-white">24</div>
            <p className="text-[#ABABAB] text-sm mt-1">В 5 проектах</p>
          </CardContent>
        </Card>
        
        <Card className="card">
          <CardHeader className="p-0 pb-3 space-y-0 flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-white">Репозитории</CardTitle>
            <div className="icon-container">
              <GitHubLogoIcon className="icon" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-bold text-white">18</div>
            <p className="text-[#ABABAB] text-sm mt-1">42 коммита за неделю</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Активности и дедлайны */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card className="card">
          <CardHeader className="p-0 pb-3 space-y-0">
            <CardTitle className="text-lg font-medium text-white">Последние активности</CardTitle>
          </CardHeader>
          <CardContent className="p-0 mt-4">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 border-b border-[#1E3A29] pb-3">
                  <div className="rounded-full bg-[#00FF9D]/5 p-2 border border-[#1E3A29]">
                    <CalendarIcon className="h-4 w-4 text-[#00FF9D]" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-white">Обновлен проект "Школьный портал"</p>
                    <p className="text-xs text-[#ABABAB]">2 часа назад</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="card">
          <CardHeader className="p-0 pb-3 space-y-0">
            <CardTitle className="text-lg font-medium text-white">Предстоящие дедлайны</CardTitle>
          </CardHeader>
          <CardContent className="p-0 mt-4">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 border-b border-[#1E3A29] pb-3">
                  <div className="rounded-full bg-[#00FF9D]/5 p-2 border border-[#1E3A29]">
                    <CalendarIcon className="h-4 w-4 text-[#00FF9D]" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-white">Завершение первого этапа</p>
                    <p className="text-xs text-[#ABABAB]">через 3 дня</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Список проектов */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Ваши проекты</h2>
          <Link href="/projects/new">
            <Button className="btn-primary">Создать проект</Button>
          </Link>
        </div>
        
        {projects.length === 0 ? (
          <div className="text-center py-12 card">
            <h3 className="text-xl font-medium mb-2 text-white">У вас пока нет проектов</h3>
            <p className="text-[#ABABAB] mb-6">
              Создайте свой первый проект, чтобы начать работу
            </p>
            <Link href="/projects/new">
              <Button className="btn-primary">Создать проект</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: any) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                title={project.title}
                description={project.description}
                status={project.status}
                progress={project.progress || 0}
                deadline={project.deadline}
                teamMembers={project.team_members[0]?.count || 1}
                githubUrl={project.github_url}
              />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}