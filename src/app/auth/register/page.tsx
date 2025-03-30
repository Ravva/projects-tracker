"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Проверка совпадения паролей
    if (formData.password !== formData.confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }
    
    // Проверка длины пароля
    if (formData.password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      return;
    }

    setIsLoading(true);

    try {
      // Import the server action dynamically to avoid issues with SSR
      const { registerUser } = await import('@/app/actions/auth');
      
      // Call the server action
      const result = await registerUser(
        formData.email,
        formData.password,
        formData.name
      );
      
      if (!result.success) {
        throw new Error(result.error || "Registration failed");
      }
      
      // If registration was successful, sign in the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });
      
      if (signInError) {
        console.error("Error signing in after registration:", signInError);
        // Redirect to login page if sign-in fails
        router.push("/auth/login?registered=true");
      } else {
        // Redirect to dashboard on successful sign-in
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Ошибка при регистрации");
    } finally {
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
                <span className="gradient-text">Регистрация</span> аккаунта
              </h1>
              <p className="text-[#ABABAB] mt-2">
                Создайте новый аккаунт для доступа к платформе
              </p>
            </div>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-md mb-4">
                {error}
              </div>
            )}
            
            <form className="space-y-4 text-left" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Фамилия и имя</Label>
                <Input 
                  id="name" 
                  type="text" 
                  placeholder="Иванов Иван" 
                  className="bg-[#0A0A0A] border-[#1E3A29] text-white focus:border-[#00BD74] focus:ring-[#00BD74]/20"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="example@school.ru" 
                  className="bg-[#0A0A0A] border-[#1E3A29] text-white focus:border-[#00BD74] focus:ring-[#00BD74]/20"
                  value={formData.email}
                  onChange={handleChange}
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
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">Подтверждение пароля</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  placeholder="••••••••" 
                  className="bg-[#0A0A0A] border-[#1E3A29] text-white focus:border-[#00BD74] focus:ring-[#00BD74]/20"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full btn-primary mt-2"
                disabled={isLoading}
              >
                {isLoading ? "Регистрация..." : "Зарегистрироваться"}
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
