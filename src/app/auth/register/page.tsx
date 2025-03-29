import { RegisterForm } from "@/components/auth/RegisterForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Регистрация | Digital Projects Tracker",
  description: "Регистрация в системе управления школьными IT-проектами",
};

export default function RegisterPage() {
  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <RegisterForm />
    </div>
  );
}