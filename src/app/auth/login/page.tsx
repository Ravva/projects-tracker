import { LoginForm } from "@/components/auth/LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Вход | Digital Projects Tracker",
  description: "Вход в систему управления школьными IT-проектами",
};

export default function LoginPage() {
  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <LoginForm />
    </div>
  );
}