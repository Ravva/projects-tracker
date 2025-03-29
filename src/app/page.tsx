import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { CalendarIcon, GitHubLogoIcon, DashboardIcon } from "@radix-ui/react-icons";

export default async function Home() {
  // Временно закомментируем проверку сессии, чтобы избежать ошибок JWT
  // const session = await getServerSession();
  
  // if (session?.user) {
  //   redirect("/dashboard");
  // }
  
  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white">
      {/* Hero секция */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-[#0A0A0A] to-[#111111] relative overflow-hidden">
        {/* Фоновый узор */}
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5"></div>
        
        {/* Зеленое свечение */}
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-[#00FF9D]/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-[#00FF9D]/5 blur-[100px] rounded-full"></div>
        
        {/* Линии соединения (имитация сетки из образца) */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,50 L100,50" stroke="#1E3A29" strokeWidth="0.2" />
            <path d="M50,0 L50,100" stroke="#1E3A29" strokeWidth="0.2" />
            <path d="M0,0 L100,100" stroke="#1E3A29" strokeWidth="0.2" />
            <path d="M100,0 L0,100" stroke="#1E3A29" strokeWidth="0.2" />
          </svg>
        </div>
        
        <div className="container px-4 md:px-6 mx-auto text-center relative z-10">
          <div className="flex flex-col items-center justify-center gap-8">
            <div className="space-y-4 max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                Digital <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00FF9D] to-[#00BD74]">Projects</span> Tracker
              </h1>
              <p className="text-[#ABABAB] md:text-xl max-w-2xl mx-auto">
                Современная платформа для управления школьными IT-проектами. Отслеживайте прогресс, управляйте задачами и документацией.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/auth/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full bg-[#00BD74] hover:bg-[#00A868] text-white border-0 rounded-md">
                  <span>Войти в систему</span>
                  <svg className="ml-2 h-4 w-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.33337 8H12.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 3.33331L12.6667 7.99998L8 12.6666" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Button>
              </Link>
              <Link href="/auth/register" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full border-[#1E3A29] text-white hover:bg-[#1E3A29]/30 rounded-md">
                  Регистрация
                </Button>
              </Link>
            </div>
            
            <div className="mt-12 w-full max-w-[500px] mx-auto">
              <div className="relative aspect-square rounded-xl bg-[#111111]/80 backdrop-blur-sm p-6 shadow-lg border border-[#1E3A29]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3/4 h-3/4 bg-[#0F1F17] rounded-lg shadow-md p-4 flex flex-col border border-[#1E3A29]">
                    <div className="h-6 w-full bg-[#1E3A29]/30 rounded mb-3"></div>
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <div className="bg-[#00FF9D]/5 rounded"></div>
                      <div className="bg-[#00FF9D]/10 rounded"></div>
                      <div className="bg-[#00FF9D]/15 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Секция возможностей */}
      <section className="w-full py-12 md:py-24 bg-[#111111] relative">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5"></div>
        <div className="container px-4 md:px-6 mx-auto text-center relative z-10">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="space-y-2 max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Возможности <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00FF9D] to-[#00BD74]">платформы</span>
              </h2>
              <p className="text-[#ABABAB] md:text-xl max-w-2xl mx-auto">
                Все необходимые инструменты для эффективного управления проектами
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8 mt-12">
            <div className="flex flex-col items-center space-y-3 rounded-lg border border-[#1E3A29] bg-[#0F1F17]/80 p-6 shadow-lg backdrop-blur-sm transition-all hover:border-[#00BD74]/50">
              <div className="rounded-full bg-[#00FF9D]/5 p-3 border border-[#1E3A29]">
                <DashboardIcon className="h-6 w-6 text-[#00FF9D]" />
              </div>
              <h3 className="text-xl font-bold text-white">Управление проектами</h3>
              <p className="text-center text-[#ABABAB]">
                Создавайте и отслеживайте прогресс ваших проектов с помощью удобного интерфейса
              </p>
            </div>
            <div className="flex flex-col items-center space-y-3 rounded-lg border border-[#1E3A29] bg-[#0F1F17]/80 p-6 shadow-lg backdrop-blur-sm transition-all hover:border-[#00BD74]/50">
              <div className="rounded-full bg-[#00FF9D]/5 p-3 border border-[#1E3A29]">
                <CalendarIcon className="h-6 w-6 text-[#00FF9D]" />
              </div>
              <h3 className="text-xl font-bold text-white">Kanban-доска</h3>
              <p className="text-center text-[#ABABAB]">
                Организуйте задачи с помощью удобной доски и отслеживайте их выполнение
              </p>
            </div>
            <div className="flex flex-col items-center space-y-3 rounded-lg border border-[#1E3A29] bg-[#0F1F17]/80 p-6 shadow-lg backdrop-blur-sm transition-all hover:border-[#00BD74]/50">
              <div className="rounded-full bg-[#00FF9D]/5 p-3 border border-[#1E3A29]">
                <GitHubLogoIcon className="h-6 w-6 text-[#00FF9D]" />
              </div>
              <h3 className="text-xl font-bold text-white">Интеграция с GitHub</h3>
              <p className="text-center text-[#ABABAB]">
                Подключайте репозитории и отслеживайте активность разработки
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Футер */}
      <footer className="w-full py-6 bg-[#0A0A0A] border-t border-[#1E3A29] mt-auto">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center gap-4">
            <p className="text-center text-sm text-[#ABABAB]">
              © 2025 Digital Projects Tracker. Все права защищены.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
