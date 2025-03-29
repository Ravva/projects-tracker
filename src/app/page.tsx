import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

export default async function Home() {
  // Временно закомментируем проверку сессии, чтобы избежать ошибок JWT
  // const session = await getServerSession();
  
  // if (session?.user) {
  //   redirect("/dashboard");
  // }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
            Digital Projects Tracker
          </h1>
          <p className="text-xl text-muted-foreground">
            Платформа для управления школьными IT-проектами
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-3xl mx-auto">
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-medium mb-2">Управление проектами</h3>
            <p className="text-muted-foreground">Создавайте и отслеживайте прогресс ваших проектов</p>
          </div>
          
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-medium mb-2">Kanban-доска</h3>
            <p className="text-muted-foreground">Организуйте задачи с помощью удобной доски</p>
          </div>
          
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-medium mb-2">Интеграция с GitHub</h3>
            <p className="text-muted-foreground">Подключайте репозитории и отслеживайте активность</p>
          </div>
        </div>
        
        <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/login">
            <Button size="lg" className="w-full sm:w-auto">
              Войти в систему
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Зарегистрироваться
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
