import { Metadata } from "next";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

export const metadata: Metadata = {
  title: "Создание проекта | Digital Projects Tracker",
  description: "Создание нового школьного IT-проекта",
};

export default async function NewProjectPage() {
  const session = await getServerSession();
  
  if (!session?.user) {
    redirect("/auth/login");
  }
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Создание нового проекта</h1>
      <ProjectForm />
    </div>
  );
}