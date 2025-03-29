import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarIcon, PersonIcon, GitHubLogoIcon } from "@radix-ui/react-icons";

type ProjectStatus = "pending" | "active" | "completed" | "rejected";

interface ProjectCardProps {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  deadline?: string;
  teamMembers: number;
  githubUrl?: string;
}

const statusConfig = {
  pending: { label: "На рассмотрении", variant: "outline" as const },
  active: { label: "Активный", variant: "default" as const },
  completed: { label: "Завершен", variant: "secondary" as const },
  rejected: { label: "Отклонен", variant: "destructive" as const },
};

export function ProjectCard({
  id,
  title,
  description,
  status,
  progress,
  deadline,
  teamMembers,
  githubUrl,
}: ProjectCardProps) {
  const { label, variant } = statusConfig[status];

  return (
    <Card className="h-full flex flex-col overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-xl line-clamp-1">{title}</CardTitle>
          <Badge variant={variant}>{label}</Badge>
        </div>
        <CardDescription className="line-clamp-2 mt-1">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4 pb-0">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Прогресс</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {deadline && (
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              <span>{deadline}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <PersonIcon className="h-4 w-4" />
            <span>{teamMembers} {teamMembers === 1 ? 'участник' : 'участников'}</span>
          </div>
          {githubUrl && (
            <div className="flex items-center gap-1">
              <GitHubLogoIcon className="h-4 w-4" />
              <span>GitHub</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-4 pb-4">
        <Link 
          href={`/projects/${id}`} 
          className="w-full inline-flex items-center justify-center rounded-md bg-primary/10 hover:bg-primary/20 px-4 py-2 text-sm font-medium text-primary transition-colors"
        >
          Открыть проект
        </Link>
      </CardFooter>
    </Card>
  );
}