import Link from "next/link";
import type { ReactNode } from "react";

import { StatusPill } from "@/components/app/status-pill";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getProjectProgressLabel,
  getProjectRiskLabel,
  getProjectRiskTone,
} from "@/lib/project-risk";
import { getProjectStatusLabel } from "@/lib/project-status";
import {
  getProjectAiStatusLabel,
  getProjectAiStatusTone,
  getProjectSyncStatusLabel,
  getProjectSyncStatusTone,
} from "@/lib/project-sync";
import type { ProjectRecord } from "@/lib/types";

function formatLastCommitLabel(value: string) {
  if (!value || value === "Нет данных") {
    return "Последние изменения: нет данных";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Последние изменения: нет данных";
  }

  return `Последние изменения: ${new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Moscow",
  }).format(parsed)}`;
}

function RowLink({
  children,
  href,
  padded = true,
}: {
  children: ReactNode;
  href: string;
  padded?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        padded
          ? "block -mx-4 -my-4 px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          : "block px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      }
    >
      {children}
    </Link>
  );
}

export function ProjectsTable({ projects }: { projects: ProjectRecord[] }) {
  if (projects.length === 0) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ученик</TableHead>
            <TableHead>Проект</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Repo sync</TableHead>
            <TableHead>AI</TableHead>
            <TableHead>Риск</TableHead>
            <TableHead className="text-right">Прогресс</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell
              colSpan={7}
              className="py-10 text-center text-muted-foreground"
            >
              Appwrite не настроен или коллекция `projects` пока пуста.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ученик</TableHead>
          <TableHead>Проект</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Repo sync</TableHead>
          <TableHead>AI</TableHead>
          <TableHead>Риск</TableHead>
          <TableHead className="text-right">Прогресс</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => {
          const href = `/projects/${project.id}`;

          return (
            <TableRow
              key={project.id}
              className="transition-colors hover:bg-muted/40"
            >
              <TableCell className="p-0 font-medium">
                <RowLink href={href} padded={false}>
                  {project.studentName}
                </RowLink>
              </TableCell>
              <TableCell>
                <RowLink href={href}>
                  <div className="font-medium">{project.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatLastCommitLabel(project.lastCommit)}
                  </div>
                  {project.syncStatusReason ? (
                    <div className="text-xs text-muted-foreground">
                      {project.syncStatusReason}
                    </div>
                  ) : null}
                </RowLink>
              </TableCell>
              <TableCell className="p-0">
                <RowLink href={href} padded={false}>
                  {getProjectStatusLabel(project.status)}
                </RowLink>
              </TableCell>
              <TableCell>
                <RowLink href={href}>
                  <StatusPill
                    tone={getProjectSyncStatusTone(project.syncStatus)}
                    label={getProjectSyncStatusLabel(project.syncStatus)}
                  />
                </RowLink>
              </TableCell>
              <TableCell>
                <RowLink href={href}>
                  <StatusPill
                    tone={getProjectAiStatusTone(project.aiStatus)}
                    label={getProjectAiStatusLabel(project.aiStatus)}
                  />
                </RowLink>
              </TableCell>
              <TableCell>
                <RowLink href={href}>
                  <StatusPill
                    tone={getProjectRiskTone(project)}
                    label={getProjectRiskLabel(project.risk)}
                  />
                </RowLink>
              </TableCell>
              <TableCell className="p-0 text-right font-medium">
                <RowLink href={href} padded={false}>
                  {getProjectProgressLabel(project)}
                </RowLink>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
