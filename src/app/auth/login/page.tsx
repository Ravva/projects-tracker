"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Неверный email или пароль");
        setIsLoading(false);
        return;
      }

      // Успешная авторизация, перенаправляем на дашборд
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Ошибка входа:", err);
      setError("Произошла ошибка при входе");
      setIsLoading(false);
    }
  };

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
                Вход в <span className="gradient-text">систему</span>
              </h1>
              <p className="text-[#ABABAB] mt-2">
                Введите данные для входа в аккаунт
              </p>
            </div>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-md mb-4">
                {error}
              </div>
            )}
            
            <form className="space-y-4 text-left" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="example@school.ru" 
                  className="bg-[#0A0A0A] border-[#1E3A29] text-white focus:border-[#00BD74] focus:ring-[#00BD74]/20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Пароль</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="bg-[#0A0A0A] border-[#1E3A29] text-white focus:border-[#00BD74] focus:ring-[#00BD74]/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="text-right">
                <Link href="/auth/forgot-password" className="text-sm text-[#00BD74] hover:underline">
                  Забыли пароль?
                </Link>
              </div>
              
              <Button 
                type="submit" 
                className="w-full btn-primary mt-2"
                disabled={isLoading}
              >
                {isLoading ? "Вход..." : "Войти"}
              </Button>
              
              <div className="mt-4 text-center">
                <p className="text-[#ABABAB] text-sm">
                  Еще нет аккаунта?{" "}
                  <Link href="/auth/register" className="text-[#00BD74] hover:underline">
                    Зарегистрироваться
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