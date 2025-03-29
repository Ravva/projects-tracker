import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="page-container">
      <section className="page-section min-h-screen flex items-center justify-center">
        {/* Фоновый узор */}
        <div className="bg-grid"></div>
        
        {/* Зеленое свечение */}
        <div className="bg-glow-1"></div>
        <div className="bg-glow-2"></div>
        
        {/* Линии соединения */}
        <div className="bg-lines">
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,50 L100,50" stroke="#1E3A29" strokeWidth="0.2" />
            <path d="M50,0 L50,100" stroke="#1E3A29" strokeWidth="0.2" />
            <path d="M0,0 L100,100" stroke="#1E3A29" strokeWidth="0.2" />
            <path d="M100,0 L0,100" stroke="#1E3A29" strokeWidth="0.2" />
          </svg>
        </div>
        
        <div className="w-full max-w-md mx-auto p-6 relative z-10">
          <div className="card text-center">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">
                <span className="gradient-text">Регистрация</span> аккаунта
              </h1>
              <p className="text-[#ABABAB] mt-2">
                Создайте новый аккаунт для доступа к платформе
              </p>
            </div>
            
            <form className="space-y-4 text-left">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Имя и фамилия</Label>
                <Input 
                  id="name" 
                  type="text" 
                  placeholder="Иван Иванов" 
                  className="bg-[#0A0A0A] border-[#1E3A29] text-white focus:border-[#00BD74] focus:ring-[#00BD74]/20"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="example@school.ru" 
                  className="bg-[#0A0A0A] border-[#1E3A29] text-white focus:border-[#00BD74] focus:ring-[#00BD74]/20"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Пароль</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="bg-[#0A0A0A] border-[#1E3A29] text-white focus:border-[#00BD74] focus:ring-[#00BD74]/20"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">Подтверждение пароля</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  placeholder="••••••••" 
                  className="bg-[#0A0A0A] border-[#1E3A29] text-white focus:border-[#00BD74] focus:ring-[#00BD74]/20"
                />
              </div>
              
              <Button type="submit" className="w-full btn-primary mt-2">
                Зарегистрироваться
              </Button>
              
              <div className="mt-4 text-center">
                <p className="text-[#ABABAB] text-sm">
                  Уже есть аккаунт?{" "}
                  <Link href="/auth/login" className="text-[#00BD74] hover:underline">
                    Войти
                  </Link>
                </p>
              </div>
            </form>
          </div>
          
          <div className="mt-6 text-center">
            <Link href="/" className="text-[#ABABAB] text-sm hover:text-white">
              &larr; Вернуться на главную
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}