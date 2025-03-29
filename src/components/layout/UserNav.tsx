"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { ExitIcon, GearIcon, PersonIcon, DashboardIcon, RocketIcon } from "@radix-ui/react-icons";

interface UserNavProps {
  user: any;
}

export function UserNav({ user }: UserNavProps) {
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
    : user?.email?.substring(0, 2).toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border border-[#1E3A29] bg-[#0F1F17]">
            <AvatarImage src={user?.image} alt={user?.name || "User"} />
            <AvatarFallback className="bg-[#1E3A29] text-[#00FF9D]">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-[#0F1F17] border border-[#1E3A29] text-white" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name || "Пользователь"}</p>
            <p className="text-xs leading-none text-[#ABABAB]">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#1E3A29]" />
        <DropdownMenuGroup>
          <Link href="/dashboard">
            <DropdownMenuItem className="cursor-pointer text-white hover:bg-[#1E3A29]">
              <DashboardIcon className="mr-2 h-4 w-4 text-[#00FF9D]" />
              <span>Дашборд</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/projects/new">
            <DropdownMenuItem className="cursor-pointer text-white hover:bg-[#1E3A29]">
              <RocketIcon className="mr-2 h-4 w-4 text-[#00FF9D]" />
              <span>Новый проект</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/profile">
            <DropdownMenuItem className="cursor-pointer text-white hover:bg-[#1E3A29]">
              <PersonIcon className="mr-2 h-4 w-4 text-[#00FF9D]" />
              <span>Профиль</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/settings">
            <DropdownMenuItem className="cursor-pointer text-white hover:bg-[#1E3A29]">
              <GearIcon className="mr-2 h-4 w-4 text-[#00FF9D]" />
              <span>Настройки</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-[#1E3A29]" />
        <DropdownMenuItem 
          className="cursor-pointer text-white hover:bg-[#1E3A29]"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <ExitIcon className="mr-2 h-4 w-4 text-[#00FF9D]" />
          <span>Выйти</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}