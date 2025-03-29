import { Metadata } from "next";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { supabase } from "@/lib/supabase/client";

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
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Проекты</h1>
        <Link href="/projects/new">
          <Button>Создать проект</Button>
        </Link>
      </div>
      
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium mb-2">У вас пока нет проектов</h2>
          <p className="text-muted-foreground mb-6">
            Создайте свой первый проект, чтобы начать работу
          </p>
          <Link href="/projects/new">
            <Button>Создать проект</Button>
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
  );
}