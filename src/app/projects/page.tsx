import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@radix-ui/react-icons";
import Link from "next/link";

export default function ProjectsPage() {
  // Пример данных проектов
  const projects = [
    {
      id: "1",
      title: "Школьный портал",
      description: "Веб-приложение для управления учебным процессом и коммуникации между учителями и учениками",
      status: "active",
      progress: 65,
      deadline: "15 мая 2025",
      teamMembers: 5
    },
    {
      id: "2",
      title: "Мобильное приложение для библиотеки",
      description: "Приложение для поиска и бронирования книг в школьной библиотеке",
      status: "pending",
      progress: 30,
      deadline: "1 июня 2025",
      teamMembers: 3
    },
    {
      id: "3",
      title: "Система учета посещаемости",
      description: "Автоматизированная система для отслеживания посещаемости учеников с использованием RFID-карт",
      status: "completed",
      progress: 100,
      deadline: "10 апреля 2025",
      teamMembers: 4
    }
  ];

  const statusLabels = {
    active: "Активный",
    pending: "На рассмотрении",
    completed: "Завершен"
  };

  const statusColors = {
    active: "bg-[#00BD74]",
    pending: "bg-[#ABABAB]",
    completed: "bg-[#1E3A29]"
  };

  return (
    <PageLayout 
      title="Проекты"
      subtitle="Управление и мониторинг ваших IT-проектов"
    >
      <div className="flex justify-center mb-8">
        <Link href="/projects/new">
          <Button className="btn-primary">
            <PlusIcon className="mr-2 h-4 w-4" />
            Создать проект
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Link href={`/projects/${project.id}`} key={project.id}>
            <div className="card text-left h-full flex flex-col hover:transform hover:scale-[1.02] transition-all">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-white">{project.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColors[project.status as keyof typeof statusColors]} text-white`}>
                  {statusLabels[project.status as keyof typeof statusLabels]}
                </span>
              </div>
              <p className="text-[#ABABAB] text-sm flex-grow mb-4">{project.description}</p>
              
              <div className="mt-auto">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#ABABAB]">Прогресс</span>
                  <span className="text-white">{project.progress}%</span>
                </div>
                <div className="w-full h-2 bg-[#1E3A29] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#00FF9D] to-[#00BD74]" 
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between mt-4 text-xs text-[#ABABAB]">
                  <span>Дедлайн: {project.deadline}</span>
                  <span>{project.teamMembers} участников</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </PageLayout>
  );
}