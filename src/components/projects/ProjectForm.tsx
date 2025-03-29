"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase/client";
import { useSession } from "next-auth/react";

interface ProjectFormProps {
  editMode?: boolean;
  projectId?: string;
  initialData?: {
    title: string;
    description: string;
    githubUrl?: string;
    demoUrl?: string;
    deadline?: string;
  };
}

export function ProjectForm({ editMode = false, projectId, initialData }: ProjectFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [githubUrl, setGithubUrl] = useState(initialData?.githubUrl || "");
  const [demoUrl, setDemoUrl] = useState(initialData?.demoUrl || "");
  const [deadline, setDeadline] = useState(initialData?.deadline || "");
  const [prdFile, setPrdFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.md')) {
        setPrdFile(file);
        setError("");
      } else {
        setError("Пожалуйста, загрузите файл в формате Markdown (.md)");
        setPrdFile(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!session?.user?.id) {
      setError("Необходимо авторизоваться");
      setIsLoading(false);
      return;
    }

    try {
      let prdUrl = "";

      // Если есть файл PRD, загружаем его в Storage
      if (prdFile) {
        const fileName = `prd/${session.user.id}/${Date.now()}_${prdFile.name}`;
        const { data: fileData, error: fileError } = await supabase.storage
          .from("project-files")
          .upload(fileName, prdFile);

        if (fileError) throw fileError;
        
        // Получаем публичную ссылку на файл
        const { data: urlData } = await supabase.storage
          .from("project-files")
          .getPublicUrl(fileName);
          
        prdUrl = urlData.publicUrl;
      }

      if (editMode && projectId) {
        // Обновление существующего проекта
        const { error: updateError } = await supabase
          .from("projects")
          .update({
            title,
            description,
            github_url: githubUrl,
            demo_url: demoUrl,
            deadline: deadline || null,
            ...(prdUrl ? { prd_url: prdUrl } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq("id", projectId);

        if (updateError) throw updateError;
      } else {
        // Создание нового проекта
        const { error: insertError } = await supabase
          .from("projects")
          .insert([
            {
              title,
              description,
              github_url: githubUrl,
              demo_url: demoUrl,
              deadline: deadline || null,
              prd_url: prdUrl,
              status: "pending",
              owner_id: session.user.id,
            },
          ]);

        if (insertError) throw insertError;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error: any) {
      setError(error.message || "Произошла ошибка при сохранении проекта");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{editMode ? "Редактирование проекта" : "Создание нового проекта"}</CardTitle>
        <CardDescription>
          {editMode 
            ? "Измените информацию о вашем проекте" 
            : "Заполните информацию о вашем новом проекте"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="title">Название проекта</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="githubUrl">GitHub URL</Label>
            <Input
              id="githubUrl"
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username/repo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="demoUrl">Demo URL</Label>
            <Input
              id="demoUrl"
              type="url"
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
              placeholder="https://your-demo-site.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Дедлайн</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prdFile">PRD файл (Markdown)</Label>
            <Input
              id="prdFile"
              type="file"
              accept=".md"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            <p className="text-sm text-muted-foreground">
              Загрузите файл PRD.md с описанием вашего проекта
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Отмена
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Сохранение..." : (editMode ? "Сохранить изменения" : "Создать проект")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}