"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format, parse } from "date-fns";
import { CalendarIcon, RocketIcon, FileIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { marked } from 'marked';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ru } from 'date-fns/locale';

// Обновляем схему формы, добавляя поля для исполнителей и этапов
const formSchema = z.object({
  title: z.string().min(3, "Название должно содержать минимум 3 символа"),
  description: z.string().min(10, "Описание должно содержать минимум 10 символов"),
  github_url: z.string().url("Введите корректный URL").optional().or(z.literal("")),
  demo_url: z.string().url("Введите корректный URL").optional().or(z.literal("")),
  prd_url: z.string().url("Введите корректный URL").optional().or(z.literal("")),
  team_members: z.array(z.object({
    name: z.string(),
    class: z.string(),
    isLeader: z.boolean().default(false)
  })).default([]),
  stages: z.array(z.object({
    name: z.string(),
    deadline: z.string().optional(),
    completed: z.boolean().default(false)
  })).default([])
});

type FormValues = z.infer<typeof formSchema>;
// Определяем тип для члена команды на основе схемы Zod
type TeamMember = FormValues['team_members'][number];

export default function NewProjectPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      github_url: "",
      demo_url: "",
      prd_url: "",
      team_members: [],
      stages: []
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!session?.user?.id) {
      setError("Вы должны быть авторизованы для создания проекта");
      return;
    }

    setIsSubmitting(true);
    setError("");

    console.log("Session status:", status);
    console.log("Session data:", session);
    console.log("Attempting insert with owner_id:", session?.user?.id);

    if (status !== 'authenticated' || !session?.user?.id) {
      setError("Ошибка: Сессия пользователя не аутентифицирована или ID недоступен.");
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Создаем запись в таблице 'projects'
      const { data: project, error: projectError } = await supabase
          .from("projects")
          .insert({
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          title: data.title,
          description: data.description,
          github_url: data.github_url || null,
          demo_url: data.demo_url || null,
          prd_url: data.prd_url || null,
          owner_id: session.user.id, // Используем проверенный ID
          status: "pending",
          progress: 0,
          stages: data.stages,
        })
        
          .select()
          .single();

      if (projectError) {
        // Проверяем специфичную ошибку для stages, если она возникнет
        if (projectError.message.includes('type "jsonb[]"')) { // Пример проверки, текст ошибки может отличаться
             setError(`Ошибка при сохранении этапов. Возможно, тип колонки 'stages' в таблице 'projects' должен быть 'jsonb' или 'jsonb[]'. Ошибка: ${projectError.message}`);
        } else {
            setError(`Ошибка при создании проекта: ${projectError.message}`);
        }
        throw projectError; // Прерываем выполнение
      }

      // 2. Получаем ID созданного проекта
      const projectId = project.id;

      // 3. Подготавливаем данные для 'project_members'
      if (data.team_members && data.team_members.length > 0) {
        const membersToInsert = data.team_members.map(member => {
          // Определяем роль
          const role = member.isLeader ? 'Лидер' : 'Участник'; // Новый вариант (если 'Участник' разрешен)

          // !!! ВАЖНО: Заглушка для user_id !!!
          const memberUserId = session.user.id; // ЗАМЕНИТЬ НА РЕАЛЬНЫЙ user_id

          return {
            project_id: projectId,
            user_id: memberUserId, // <-- ЗАГЛУШКА!
            role: role, // Роль теперь только "Лидер" или "Участник"
            class: member.class || null, // Сохраняем класс в отдельное поле
          };
        });

        // 4. Вставляем записи в 'project_members'
        const { error: membersError } = await supabase
          .from("project_members")
          .insert(membersToInsert);

        if (membersError) {
          // Если произошла ошибка при добавлении участников, проект уже создан.
          // Можно либо попытаться удалить проект, либо просто сообщить об ошибке.
          setError(`Проект создан (ID: ${projectId}), но произошла ошибка при добавлении участников: ${membersError.message}. Возможно, указан неверный user_id или отсутствует колонка 'class'.`);
          // Не прерываем выполнение, чтобы пользователь мог перейти к проекту, но с ошибкой.
          console.error("Error inserting project members:", membersError);
           // throw membersError; // Раскомментируйте, если хотите прервать переход к проекту
        }
      }

      // 5. Перенаправляем на страницу проекта
      router.push(`/projects/${projectId}`);
      router.refresh();

    } catch (err: any) {
      console.error("Error creating project process:", err);
      // Ошибка уже должна быть установлена внутри try, но на всякий случай
      if (!error) {
          setError(err.message || "Произошла неизвестная ошибка при создании проекта");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setError("Пожалуйста, выберите файл");
      return;
    }

    setIsImporting(true);
    setError("");

    try {
      const content = await file.text();
      
      // Парсинг названия проекта
      const titleSection = content.match(/# Название проекта\s+([\s\S]*?)(?=#|$)/);
      let title = "";
      if (titleSection && titleSection[1]) {
        // Извлекаем название проекта, удаляя маркеры списка и лишние пробелы
        const titleLines = titleSection[1].trim().split('\n');
        if (titleLines.length > 0) {
          // Если название в формате списка "- Название"
          if (titleLines[0].startsWith('- ')) {
            title = titleLines[0].substring(2).trim();
          } else {
            title = titleLines[0].trim();
          }
        }
      }
      
      // Парсинг исполнителей
      const teamSection = content.match(/# Исполнители\s+([\s\S]*?)(?=#|$)/);
      const teamMembers = [];
      
      if (teamSection && teamSection[1]) {
        const teamLines = teamSection[1].trim().split('\n');
        for (const line of teamLines) {
          if (line.startsWith('- ')) {
            const memberText = line.substring(2).trim();
            const isLeader = memberText.toLowerCase().includes('(лидер)');
            // Извлекаем имя и класс, удаляя пометку о лидере и квадратные скобки
            let nameAndClass = memberText.replace(/\(лидер\)/i, '').trim();
            nameAndClass = nameAndClass.replace(/\[(.*?)\]/, '$1').trim();
            
            let name = nameAndClass;
            let classValue = "";
            
            // Разделяем имя и класс, если они в формате "Имя, Класс"
            if (nameAndClass.includes(',')) {
              const parts = nameAndClass.split(',');
              name = parts[0].trim();
              classValue = parts[1].trim();
            }
            
            if (name) {
              teamMembers.push({ name, class: classValue, isLeader });
            }
          }
        }
      }
      
      // Парсинг описания
      const descriptionMatch = content.match(/# Описание\s+([\s\S]*?)(?=#|$)/);
      let description = "";
      if (descriptionMatch && descriptionMatch[1]) {
        description = descriptionMatch[1].trim();
      }
      
      // Парсинг ссылок
      const linksSection = content.match(/# Ссылки\s+([\s\S]*?)(?=#|$)/);
      let githubUrl = "";
      let demoUrl = "";
      
      if (linksSection && linksSection[1]) {
        const linkLines = linksSection[1].trim().split('\n');
        for (const line of linkLines) {
          if (line.toLowerCase().includes('репозиторий:')) {
            const match = line.match(/\[(.*?)\]/);
            if (match && match[1]) {
              githubUrl = match[1].trim();
            } else {
              githubUrl = line.split(':')[1]?.trim() || "";
            }
          } else if (line.toLowerCase().includes('демо:')) {
            const match = line.match(/\[(.*?)\]/);
            if (match && match[1]) {
              demoUrl = match[1].trim();
            } else {
              demoUrl = line.split(':')[1]?.trim() || "";
            }
          }
        }
      }
      
      // Парсинг этапов
      const stagesSection = content.match(/# Этапы\s+([\s\S]*?)(?=#|$)/);
      const stages = [];
      
      if (stagesSection && stagesSection[1]) {
        const stageLines = stagesSection[1].trim().split('\n');
        for (const line of stageLines) {
          if (line.startsWith('- ')) {
            const stageText = line.substring(2).trim();
            const completed = stageText.startsWith('[x]');
            
            let stageName = stageText.replace(/\[\s*x?\s*\]/, '').trim();
            let deadline = "";
            
            const dateMatch = stageName.match(/\((\d{2})\.(\d{2})\.(\d{2})\)/);
            if (dateMatch) {
              // Конвертируем DD.MM.YY в dd.MM.yy (оставляем как есть)
              const day = dateMatch[1];
              const month = dateMatch[2];
              const yearSuffix = dateMatch[3]; // гг
              // Сохраняем в формате dd.MM.yy
              deadline = `${day}.${month}.${yearSuffix}`;
              stageName = stageName.replace(/\(.*?\)/, '').trim();
            }
            
            if (stageName) {
              stages.push({ name: stageName, deadline, completed });
            }
          }
        }
      }
      
      // Заполнение формы данными из файла
      if (title) {
        form.setValue('title', title);
      }
      
      if (description) {
        form.setValue('description', description);
      }
      
      if (githubUrl) {
        form.setValue('github_url', githubUrl);
      }
      
      if (demoUrl) {
        form.setValue('demo_url', demoUrl);
      }
      
      if (teamMembers.length > 0) {
        form.setValue('team_members', teamMembers);
      }
      
      if (stages.length > 0) {
        form.setValue('stages', stages);
      }
      
    } catch (err: any) {
      console.error("Error parsing PRD file:", err);
      setError("Ошибка при обработке файла PRD");
    } finally {
      setIsImporting(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleAddPerformer = () => {
    // Logic to add a new performer structure to the state
    form.setValue('team_members', [...form.getValues('team_members'), { name: '', class: '', isLeader: false }]);
  };

  const handleRemovePerformer = (index: number) => {
    const currentMembers = [...form.getValues('team_members')];
    currentMembers.splice(index, 1);
    form.setValue('team_members', currentMembers);
  };

  const handlePerformerChange = (index: number, field: keyof TeamMember, value: string | boolean) => {
    const currentMembers = [...form.getValues('team_members')];
    const memberToUpdate = currentMembers[index];

    // Проверяем тип значения в зависимости от поля
    if (field === 'isLeader') {
      if (typeof value === 'boolean') {
        memberToUpdate[field] = value;
      } else {
        console.error(`Invalid value type for field ${field}: expected boolean, got ${typeof value}`);
        return; // Прерываем выполнение, если тип неверный
      }
    } else { // Поля 'name' или 'class'
      if (typeof value === 'string') {
        memberToUpdate[field] = value;
      } else {
        console.error(`Invalid value type for field ${field}: expected string, got ${typeof value}`);
        return; // Прерываем выполнение, если тип неверный
      }
    }

    form.setValue('team_members', currentMembers);
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
        
        <div className="w-full max-w-3xl mx-auto p-6 relative z-10">
          <Card className="border-[#1E3A29] bg-[#0F1F17]/80 backdrop-blur-sm shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 rounded-full bg-[#00FF9D]/10 p-3 w-16 h-16 flex items-center justify-center border border-[#1E3A29]">
                <RocketIcon className="h-8 w-8 text-[#00FF9D]" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Создание <span className="gradient-text">нового проекта</span>
              </CardTitle>
              <CardDescription className="text-[#ABABAB]">
                Заполните информацию о вашем новом проекте
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-md mb-6">
                  {error}
                </div>
              )}
              
              {/* PRD import button */}
              <div className="mb-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full border-dashed border-[#1E3A29] bg-[#0A0A0A]/50 text-white hover:bg-[#1E3A29]/20 flex items-center justify-center gap-2 py-6"
                  onClick={triggerFileInput}
                  disabled={isImporting}
                >
                  {isImporting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-[#00FF9D] border-t-transparent rounded-full mr-2"></div>
                      Импорт PRD...
                    </>
                  ) : (
                    <>
                      <FileIcon className="h-5 w-5 text-[#00FF9D]" />
                      Импортировать PRD.md
                    </>
                  )}
                </Button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".md" 
                  onChange={handleFileImport}
                />
                <p className="text-xs text-[#ABABAB] mt-2 text-center">
                  Импортируйте файл PRD.md для автоматического заполнения формы
                </p>
              </div>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Название проекта</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Введите название проекта" 
                            {...field} 
                            className="bg-[#0A0A0A] border-[#1E3A29] text-white focus:border-[#00BD74] focus:ring-[#00BD74]/20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Исполнители (перенесено сюда) */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-white">Исполнители</FormLabel>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        className="h-8 border-[#1E3A29] bg-[#0A0A0A]/50 text-white hover:bg-[#1E3A29]/20"
                        onClick={handleAddPerformer}
                      >
                        Добавить
                      </Button>
                    </div>
                    
                    {form.watch('team_members').map((_, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          placeholder="Иванов Иван"
                          className="bg-[#0A0A0A] border-[#1E3A29] text-white focus:border-[#00BD74] focus:ring-[#00BD74]/20 flex-grow"
                          value={form.watch(`team_members.${index}.name`)}
                          onChange={(e) => {
                            handlePerformerChange(index, 'name', e.target.value);
                          }}
                        />
                        <Input
                          placeholder="7Ю"
                          className="bg-[#0A0A0A] border-[#1E3A29] text-white focus:border-[#00BD74] focus:ring-[#00BD74]/20 w-20"
                          value={form.watch(`team_members.${index}.class`)}
                          onChange={(e) => {
                            handlePerformerChange(index, 'class', e.target.value);
                          }}
                        />
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`leader-${index}`}
                            className="mr-2 h-4 w-4 accent-[#00BD74]"
                            checked={form.watch(`team_members.${index}.isLeader`)}
                            onChange={(e) => {
                              handlePerformerChange(index, 'isLeader', e.target.checked);
                            }}
                          />
                          <label htmlFor={`leader-${index}`} className="text-white text-sm">Лидер</label>
                        </div>
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-500/10"
                            onClick={() => {
                              handleRemovePerformer(index);
                            }}
                          >
                            Удалить
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Описание</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Опишите ваш проект" 
                            {...field} 
                            className="bg-[#0A0A0A] border-[#1E3A29] text-white focus:border-[#00BD74] focus:ring-[#00BD74]/20 min-h-[120px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Блок Этапы проекта (перемещен сюда) */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-white">Этапы проекта</FormLabel>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        className="h-8 border-[#1E3A29] bg-[#0A0A0A]/50 text-white hover:bg-[#1E3A29]/20"
                        onClick={() => {
                          const currentStages = form.getValues('stages');
                          form.setValue('stages', [...currentStages, { name: '', deadline: '', completed: false }]);
                        }}
                      >
                        Добавить этап
                      </Button>
                    </div>
                    
                    {form.watch('stages').map((_, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-1">
                          <input
                            type="checkbox"
                            id={`completed-${index}`}
                            className="h-4 w-4 accent-[#00BD74]"
                            checked={form.watch(`stages.${index}.completed`)}
                            onChange={(e) => {
                              const currentStages = [...form.getValues('stages')];
                              currentStages[index].completed = e.target.checked;
                              form.setValue('stages', currentStages);
                            }}
                          />
                        </div>
                        <div className="col-span-6">
                          <Input
                            placeholder="Название этапа"
                            className="bg-[#0A0A0A] border-[#1E3A29] text-white focus:border-[#00BD74] focus:ring-[#00BD74]/20"
                            value={form.watch(`stages.${index}.name`)}
                            onChange={(e) => {
                              const currentStages = [...form.getValues('stages')];
                              currentStages[index].name = e.target.value;
                              form.setValue('stages', currentStages);
                            }}
                          />
                        </div>
                        <div className="col-span-3">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal bg-[#0A0A0A] border-[#1E3A29] text-white hover:bg-[#1E3A29]/20 hover:text-white",
                                  !form.watch(`stages.${index}.deadline`) && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4 text-[#00BD74]" />
                                {(() => {
                                  const deadlineValue = form.watch(`stages.${index}.deadline`);
                                  if (deadlineValue) {
                                    try {
                                      // Парсим строку dd.MM.yy
                                      const date = parse(deadlineValue as string, "dd.MM.yy", new Date());
                                      if (!isNaN(date.getTime())) {
                                        // Форматируем в dd.MM.yy с русской локалью
                                        return format(date, "dd.MM.yy", { locale: ru });
                                      }
                                    } catch (e) {
                                      console.error("Error formatting date:", e);
                                    }
                                  }
                                  return <span>Выберите дату</span>;
                                })()}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-[#0A0A0A] border-[#1E3A29]">
                              <Calendar
                                mode="single"
                                // Передаем русскую локаль в календарь
                                locale={ru}
                                selected={(() => {
                                  const deadlineValue = form.watch(`stages.${index}.deadline`);
                                  if (deadlineValue) {
                                    try {
                                      // Парсим строку dd.MM.yy для выбора даты в календаре
                                      const date = parse(deadlineValue as string, "dd.MM.yy", new Date());
                                      if (!isNaN(date.getTime())) {
                                        return date;
                                      }
                                    } catch (e) {
                                      console.error("Error parsing date for calendar:", e);
                                    }
                                  }
                                  return undefined;
                                })()}
                                onSelect={(date) => {
                                  const currentStages = [...form.getValues('stages')];
                                  // Сохраняем дату в формате dd.MM.yy
                                  currentStages[index].deadline = date ? format(date, "dd.MM.yy", { locale: ru }) : '';
                                  form.setValue('stages', currentStages);
                                }}
                                initialFocus
                                className="bg-[#0A0A0A] text-white"
                                classNames={{
                                  day_selected: "bg-[#00BD74] text-white hover:bg-[#00A868] hover:text-white focus:bg-[#00A868] focus:text-white",
                                  day_today: "bg-[#1E3A29] text-white",
                                  day_range_middle: "bg-[#1E3A29]/50",
                                  day_disabled: "text-gray-500",
                                  day_range_end: "bg-[#00BD74] text-white",
                                  day_range_start: "bg-[#00BD74] text-white",
                                  day_outside: "text-gray-500 opacity-50",
                                  nav_button: "text-[#00BD74] hover:bg-[#1E3A29]",
                                  nav_button_previous: "text-[#00BD74]",
                                  nav_button_next: "text-[#00BD74]",
                                  caption: "text-white capitalize" // Добавим capitalize для месяца
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="col-span-2 flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-500/10"
                            onClick={() => {
                              const currentStages = form.getValues('stages').filter((_, i) => i !== index);
                              form.setValue('stages', currentStages);
                            }}
                          >
                            Удалить
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Блок Ссылки (GitHub и Демо) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="github_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">GitHub репозиторий</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://github.com/username/repo" 
                              {...field} 
                              className="bg-[#0A0A0A] border-[#1E3A29] text-white focus:border-[#00BD74] focus:ring-[#00BD74]/20"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="demo_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Демо-версия</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://your-demo.vercel.app" 
                              {...field} 
                              className="bg-[#0A0A0A] border-[#1E3A29] text-white focus:border-[#00BD74] focus:ring-[#00BD74]/20"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-center pt-4">
                    <Button 
                      type="submit" 
                      className="w-full md:w-1/2 bg-[#00BD74] hover:bg-[#00A868] text-white"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Создание..." : "Создать проект"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}