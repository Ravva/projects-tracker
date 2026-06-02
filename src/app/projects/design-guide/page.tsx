"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar03Icon,
  Github01Icon,
  User02Icon,
  Settings02Icon,
  StarIcon,
  Task01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

// Import 14 registry components (4 levels up since we are at src/app/projects/design-guide/)
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../../untitled2shadcn/components/ui/avatar";
import { Badge } from "../../../../untitled2shadcn/components/ui/badge";
import { Button } from "../../../../untitled2shadcn/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../../../../untitled2shadcn/components/ui/card";
import { Checkbox } from "../../../../untitled2shadcn/components/ui/checkbox";
import { Input } from "../../../../untitled2shadcn/components/ui/input";
import { Progress } from "../../../../untitled2shadcn/components/ui/progress";
import { Separator } from "../../../../untitled2shadcn/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../../../untitled2shadcn/components/ui/sheet";
import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../../../../untitled2shadcn/components/ui/sidebar";
import { Skeleton } from "../../../../untitled2shadcn/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../untitled2shadcn/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../../untitled2shadcn/components/ui/tooltip";
import { StatusPill } from "../../../../untitled2shadcn/components/app/status-pill";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function DesignGuidePage() {
  const [progressVal, setProgressVal] = useState(65);
  const [checkedBox, setCheckedBox] = useState(true);
  const [inputText, setInputText] = useState("Иван Иванов");

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
        {/* Sticky Header */}
        <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between px-6 sm:px-8">
            <div className="flex items-center gap-3">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-md">
                PT
              </span>
              <div>
                <h1 className="text-sm font-semibold tracking-tight text-foreground">
                  Projects Tracker · Design Guide
                </h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                  Untitled UI Classic (Slate Theme)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link href="/">
                <Button variant="outline" size="sm" className="gap-2">
                  <HugeiconsIcon icon={Task01Icon} size={15} />
                  Вернуться в Панель
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* main container */}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
          {/* Intro Section */}
          <div className="mb-12 border-b border-border/60 pb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Гайд по визуальным компонентам
            </h2>
            <p className="mt-2 text-sm/relaxed text-muted-foreground max-w-2xl">
              Здесь представлены все **14 обновленных компонентов**,
              спроектированных в строгом соответствии с эстетикой **Untitled UI
              Classic (Slate)**. Компоненты используют семантические переменные
              Tailwind v4 и поддерживают полную адаптивность, 8 интерактивных
              состояний, а также темную и светлую темы.
            </p>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="p-5">
                  <div className="flex size-8 items-center justify-center rounded-md bg-status-calm/10 text-status-calm border border-status-calm/20">
                    <HugeiconsIcon icon={StarIcon} size={18} />
                  </div>
                  <CardTitle className="mt-3 text-sm font-semibold">
                    Геометрия и Шрифты
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Круглые скругления 8px для кнопок (
                    <code className="text-[10px] bg-muted/60 p-0.5 rounded">
                      rounded-lg
                    </code>
                    ) и 12px для карточек (
                    <code className="text-[10px] bg-muted/60 p-0.5 rounded">
                      rounded-xl
                    </code>
                    ). Семейство шрифтов акцентировано на чистом Inter.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="p-5">
                  <div className="flex size-8 items-center justify-center rounded-md bg-status-success/10 text-status-success border border-status-success/20">
                    <HugeiconsIcon icon={Settings02Icon} size={18} />
                  </div>
                  <CardTitle className="mt-3 text-sm font-semibold">
                    Семантический Свет и Тень
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Двойные мягкие тени Untitled UI с легким полупрозрачным
                    контуром. Интеграция 4 цветовых пресетов: Slate,
                    Cyber-Emerald, Amethyst-Eclipse и Amber-Core.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="p-5">
                  <div className="flex size-8 items-center justify-center rounded-md bg-status-warning/10 text-status-warning border border-status-warning/20">
                    <HugeiconsIcon icon={AlertCircleIcon} size={18} />
                  </div>
                  <CardTitle className="mt-3 text-sm font-semibold">
                    Абсолютное отсутствие AI-slop
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Никаких искусственных смещений кнопок на hover. Мягкие,
                    интуитивно предсказуемые переходы, пастельные плашки
                    статусов, точный контраст текста в темной и светлой теме.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>

          {/* Grid of Components */}
          <div className="space-y-12">
            {/* 1. BUTTON & 2. BADGE */}
            <div className="grid gap-8 lg:grid-cols-2">
              <Card className="hover:shadow-[0_4px_12px_rgba(16,24,40,0.06)] transition-all">
                <CardHeader className="border-b border-border/40 bg-background-secondary/20 p-5">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-sm font-bold">
                        1. Button (Кнопки)
                      </CardTitle>
                      <CardDescription className="text-[11px]">
                        8 интерактивных состояний, скругления 8px
                      </CardDescription>
                    </div>
                    <Badge variant="outline">component: button</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Standard Variants */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Варианты
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="default">Default</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="destructive">Destructive</Button>
                      <Button variant="link">Link</Button>
                    </div>
                  </div>

                  {/* Sizes */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Размеры
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="lg">Large (lg)</Button>
                      <Button size="default">Default</Button>
                      <Button size="sm">Small (sm)</Button>
                      <Button size="xs">X-Small (xs)</Button>
                    </div>
                  </div>

                  {/* Interactive States */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Состояния
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button disabled>Disabled</Button>
                      <Button className="opacity-80 cursor-wait">
                        <span className="inline-block size-3 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                        Loading...
                      </Button>
                      <Button size="icon">
                        <HugeiconsIcon icon={Settings02Icon} size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 2. BADGE & 3. AVATAR */}
              <Card className="hover:shadow-[0_4px_12px_rgba(16,24,40,0.06)] transition-all">
                <CardHeader className="border-b border-border/40 bg-background-secondary/20 p-5">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-sm font-bold">
                        2. Badge & 3. Avatar
                      </CardTitle>
                      <CardDescription className="text-[11px]">
                        Бейджи и аватары в фирменной раскладке
                      </CardDescription>
                    </div>
                    <div className="flex gap-1.5">
                      <Badge variant="outline">badge</Badge>
                      <Badge variant="outline">avatar</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Badges Variants */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Бейджи (Badge)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="default">Primary Badge</Badge>
                      <Badge variant="secondary">Secondary</Badge>
                      <Badge variant="outline">Outline</Badge>
                      <Badge variant="destructive">Destructive</Badge>
                      <Badge variant="ghost">Ghost badge</Badge>
                    </div>
                  </div>

                  {/* Avatar Showcase */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Аватары (Avatar)
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center gap-1">
                        <Avatar size="sm">
                          <AvatarFallback>SM</AvatarFallback>
                        </Avatar>
                        <span className="text-[9px] text-muted-foreground">
                          sm (24px)
                        </span>
                      </div>

                      <div className="flex flex-col items-center gap-1">
                        <Avatar>
                          <AvatarImage
                            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                            alt="Avatar"
                          />
                          <AvatarFallback>RV</AvatarFallback>
                        </Avatar>
                        <span className="text-[9px] text-muted-foreground">
                          default (32px)
                        </span>
                      </div>

                      <div className="flex flex-col items-center gap-1">
                        <Avatar size="lg">
                          <AvatarFallback>LG</AvatarFallback>
                        </Avatar>
                        <span className="text-[9px] text-muted-foreground">
                          lg (40px)
                        </span>
                      </div>

                      <div className="flex flex-col items-center gap-1">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary border border-primary/20">
                            PT
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[9px] text-muted-foreground">
                          Тонированный
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 4. CHECKBOX & 5. INPUT & 6. PROGRESS */}
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Checkbox Card */}
              <Card className="hover:shadow-[0_4px_12px_rgba(16,24,40,0.06)] transition-all">
                <CardHeader className="border-b border-border/40 bg-background-secondary/20 p-5">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-bold">
                      4. Checkbox (Чекбокс)
                    </CardTitle>
                    <Badge variant="outline">checkbox</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="terms"
                      checked={checkedBox}
                      onCheckedChange={(val) => setCheckedBox(!!val)}
                    />
                    <label
                      htmlFor="terms"
                      className="text-xs font-semibold leading-none cursor-pointer"
                    >
                      Интерактивный чекбокс:{" "}
                      {checkedBox ? "Активен" : "Выключен"}
                    </label>
                  </div>

                  <div className="flex items-center gap-3 opacity-60">
                    <Checkbox id="disabled-unchecked" disabled />
                    <label className="text-xs font-medium leading-none cursor-not-allowed">
                      Отключен (Unchecked)
                    </label>
                  </div>

                  <div className="flex items-center gap-3 opacity-60">
                    <Checkbox id="disabled-checked" defaultChecked disabled />
                    <label className="text-xs font-medium leading-none cursor-not-allowed">
                      Отключен (Checked)
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Input Card */}
              <Card className="hover:shadow-[0_4px_12px_rgba(16,24,40,0.06)] transition-all">
                <CardHeader className="border-b border-border/40 bg-background-secondary/20 p-5">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-bold">
                      5. Input (Поле ввода)
                    </CardTitle>
                    <Badge variant="outline">input</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      ФИО Ученика
                    </label>
                    <Input
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Введите имя..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Отключенное состояние
                    </label>
                    <Input disabled value="readonly_email@domain.com" />
                  </div>
                </CardContent>
              </Card>

              {/* Progress Card */}
              <Card className="hover:shadow-[0_4px_12px_rgba(16,24,40,0.06)] transition-all">
                <CardHeader className="border-b border-border/40 bg-background-secondary/20 p-5">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-bold">
                      6. Progress (Шкала)
                    </CardTitle>
                    <Badge variant="outline">progress</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Интерактивный прогресс</span>
                      <span>{progressVal}%</span>
                    </div>
                    <Progress value={progressVal} />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() =>
                        setProgressVal((prev) => Math.max(0, prev - 15))
                      }
                    >
                      -15%
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() =>
                        setProgressVal((prev) => Math.min(100, prev + 15))
                      }
                    >
                      +15%
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setProgressVal(65)}
                    >
                      Сброс
                    </Button>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-muted-foreground">
                      Микро-индикаторы
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <Progress value={20} className="h-1" />
                      <Progress value={85} className="h-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 7. SEPARATOR & 8. STATUS PILL & 9. SKELETON & 10. TOOLTIP */}
            <div className="grid gap-8 lg:grid-cols-12">
              {/* Status Pill & Separator */}
              <Card className="lg:col-span-4 hover:shadow-[0_4px_12px_rgba(16,24,40,0.06)] transition-all">
                <CardHeader className="border-b border-border/40 bg-background-secondary/20 p-5">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-bold">
                      7. Separator & 8. StatusPill
                    </CardTitle>
                    <Badge variant="outline">status-pill</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  {/* Status Pills */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Статусы (StatusPill)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <StatusPill tone="success" label="Выполнено" />
                      <StatusPill tone="calm" label="В процессе" />
                      <StatusPill tone="warning" label="Внимание" />
                      <StatusPill tone="critical" label="Критично" />
                    </div>
                  </div>

                  {/* Separators */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Разделитель (Separator)
                    </p>
                    <div className="border border-border/40 rounded-lg p-3 bg-background-secondary/10">
                      <span className="text-xs font-medium block mb-1">
                        Верхняя область
                      </span>

                      <Separator className="my-2" />

                      <div className="flex h-5 items-center gap-3 text-xs">
                        <span>Слева</span>
                        <Separator orientation="vertical" />
                        <span>Середина</span>
                        <Separator orientation="vertical" />
                        <span>Справа</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Skeleton Showcase */}
              <Card className="lg:col-span-4 hover:shadow-[0_4px_12px_rgba(16,24,40,0.06)] transition-all">
                <CardHeader className="border-b border-border/40 bg-background-secondary/20 p-5">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-bold">
                      9. Skeleton (Заглушки)
                    </CardTitle>
                    <Badge variant="outline">skeleton</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-2.5 w-1/3" />
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <Skeleton className="h-16 w-full rounded-md" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tooltip Showcase */}
              <Card className="lg:col-span-4 hover:shadow-[0_4px_12px_rgba(16,24,40,0.06)] transition-all">
                <CardHeader className="border-b border-border/40 bg-background-secondary/20 p-5">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-bold">
                      10. Tooltip (Подсказка)
                    </CardTitle>
                    <Badge variant="outline">tooltip</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 flex flex-col justify-center items-center h-48 space-y-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    Наведите мышь или зажмите кнопку для показа интерактивного
                    тултипа:
                  </p>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline">Наведи на меня</Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <HugeiconsIcon
                        icon={AlertCircleIcon}
                        size={12}
                        className="text-status-warning"
                      />
                      <span>Параметры сохранены в registry!</span>
                    </TooltipContent>
                  </Tooltip>
                </CardContent>
              </Card>
            </div>

            {/* 11. TABLE & 12. CARD */}
            <div className="space-y-8">
              {/* card profile */}
              <Card className="hover:shadow-[0_4px_12px_rgba(16,24,40,0.06)] transition-all">
                <CardHeader className="border-b border-border/40 bg-background-secondary/20 p-5">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-sm font-bold">
                        11. Table & 12. Card (Таблицы и Карточки)
                      </CardTitle>
                      <CardDescription className="text-[11px]">
                        Готовая витрина структуры данных
                      </CardDescription>
                    </div>
                    <div className="flex gap-1.5">
                      <Badge variant="outline">table</Badge>
                      <Badge variant="outline">card</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Table Component */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Таблица успеваемости (Table)
                    </p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ученик</TableHead>
                          <TableHead>Прогресс по Bot</TableHead>
                          <TableHead>Статус проекта</TableHead>
                          <TableHead>Оценка</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-semibold flex items-center gap-2">
                            <Avatar size="sm">
                              <AvatarFallback>АИ</AvatarFallback>
                            </Avatar>
                            <span>Алексей Иванов</span>
                          </TableCell>
                          <TableCell className="w-48">
                            <div className="flex items-center gap-2">
                              <Progress value={90} className="h-1.5" />
                              <span className="text-[10px] font-bold text-muted-foreground">
                                90%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusPill tone="success" label="Выполнено" />
                          </TableCell>
                          <TableCell className="font-bold">5 / 5</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-semibold flex items-center gap-2">
                            <Avatar size="sm">
                              <AvatarFallback>ПС</AvatarFallback>
                            </Avatar>
                            <span>Петр Сидоров</span>
                          </TableCell>
                          <TableCell className="w-48">
                            <div className="flex items-center gap-2">
                              <Progress value={45} className="h-1.5" />
                              <span className="text-[10px] font-bold text-muted-foreground">
                                45%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusPill tone="calm" label="В процессе" />
                          </TableCell>
                          <TableCell className="font-bold">—</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 13. SHEET & 14. SIDEBAR */}
            <div className="grid gap-8 lg:grid-cols-12">
              {/* Sheet component */}
              <Card className="lg:col-span-5 hover:shadow-[0_4px_12px_rgba(16,24,40,0.06)] transition-all">
                <CardHeader className="border-b border-border/40 bg-background-secondary/20 p-5">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-bold">
                      13. Sheet (Боковые шторки)
                    </CardTitle>
                    <Badge variant="outline">sheet</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 flex flex-col justify-center items-center h-64 text-center space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Шторка выезжает справа/слева. Проверьте плавное затемнение
                    overlay и скругленные углы.
                  </p>

                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="secondary">
                        Открыть панель управления
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right">
                      <SheetHeader>
                        <SheetTitle>Параметры дизайна</SheetTitle>
                        <SheetDescription>
                          Проверка кастомной панели управления внутри Registry.
                        </SheetDescription>
                      </SheetHeader>
                      <div className="p-6 space-y-4">
                        <div className="space-y-1">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                            Выбранная цветовая гамма
                          </span>
                          <p className="text-xs font-semibold">
                            Slate Light / Dark (Original #6172F3)
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                            Индикатор точности
                          </span>
                          <Progress value={100} className="h-1.5" />
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </CardContent>
              </Card>

              {/* Sidebar Component mini display */}
              <Card className="lg:col-span-7 hover:shadow-[0_4px_12px_rgba(16,24,40,0.06)] transition-all overflow-hidden">
                <CardHeader className="border-b border-border/40 bg-background-secondary/20 p-5">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-bold">
                      14. Sidebar (Боковое меню)
                    </CardTitle>
                    <Badge variant="outline">sidebar</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex h-64 bg-background-secondary/10">
                  <SidebarProvider defaultOpen={true}>
                    <div className="flex h-full w-full border-r border-border/60">
                      {/* Enclosed Sidebar Preview */}
                      <Sidebar className="relative border-r border-border/40 w-52 shrink-0 bg-card">
                        <SidebarHeader className="p-4 border-b border-border/20">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                            Projects Tracker
                          </span>
                        </SidebarHeader>
                        <SidebarContent className="p-2">
                          <SidebarGroup>
                            <SidebarGroupLabel className="text-[9px] uppercase tracking-wider text-muted-foreground px-2 py-1 block">
                              Меню
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                              <SidebarMenu>
                                <SidebarMenuItem>
                                  <SidebarMenuButton className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md hover:bg-background-secondary text-foreground font-semibold">
                                    <HugeiconsIcon
                                      icon={User02Icon}
                                      size={14}
                                    />
                                    <span>Ученики</span>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                  <SidebarMenuButton className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md hover:bg-background-secondary text-foreground text-xs font-semibold">
                                    <HugeiconsIcon
                                      icon={Calendar03Icon}
                                      size={14}
                                    />
                                    <span>Посещаемость</span>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                  <SidebarMenuButton className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md hover:bg-background-secondary text-foreground text-xs font-semibold">
                                    <HugeiconsIcon
                                      icon={Github01Icon}
                                      size={14}
                                    />
                                    <span>Проекты</span>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                              </SidebarMenu>
                            </SidebarGroupContent>
                          </SidebarGroup>
                        </SidebarContent>
                      </Sidebar>

                      {/* Sidebar Right Mock Content */}
                      <div className="flex-1 p-5 flex flex-col justify-center">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                          Макет структуры
                        </span>
                        <h4 className="text-xs font-bold text-foreground">
                          Интеграция бокового сайдбара
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-1/2">
                          Смонтирована с мягкими подложками, убирает неоновые
                          свечения и использует каноничное оригинальное
                          скругление Untitled UI.
                        </p>
                      </div>
                    </div>
                  </SidebarProvider>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Footer Info */}
          <div className="mt-16 border-t border-border/60 pt-8 flex items-center justify-between text-xs text-muted-foreground">
            <span>© 2026 Projects Tracker. Все права защищены.</span>
            <span>
              Дизайнер:{" "}
              <span className="font-semibold text-foreground">Ravva</span>
            </span>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
