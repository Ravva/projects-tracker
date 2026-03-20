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

export interface ProjectsTableRowData {
  studentId: string;
  studentName: string;
  project: ProjectRecord | null;
}

function formatLastCommitLabel(value: string) {
  if (!value || value === "Нет данных") {
    return "нет данных";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "нет данных";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow",
  }).format(parsed);
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

export function ProjectsTable({ rows }: { rows: ProjectsTableRowData[] }) {
  if (rows.length === 0) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ученик</TableHead>
            <TableHead>Проект</TableHead>
            <TableHead>Последнее изменение</TableHead>
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
              colSpan={8}
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
          <TableHead>Последнее изменение</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Repo sync</TableHead>
          <TableHead>AI</TableHead>
          <TableHead>Риск</TableHead>
          <TableHead className="text-right">Прогресс</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const project = row.project;

          if (!project) {
            return (
              <TableRow
                key={row.studentId}
                className="transition-colors hover:bg-muted/40"
              >
                <TableCell className="font-medium">
                  <div className="px-4 py-4">{row.studentName}</div>
                </TableCell>
                <TableCell>
                  <div className="px-4 py-4 text-muted-foreground">
                    отсутствует
                  </div>
                </TableCell>
                <TableCell>
                  <div className="px-4 py-4 text-muted-foreground">
                    отсутствует
                  </div>
                </TableCell>
                <TableCell>
                  <div className="px-4 py-4 text-muted-foreground">
                    отсутствует
                  </div>
                </TableCell>
                <TableCell>
                  <div className="px-4 py-4 text-muted-foreground">-</div>
                </TableCell>
                <TableCell>
                  <div className="px-4 py-4 text-muted-foreground">-</div>
                </TableCell>
                <TableCell>
                  <div className="px-4 py-4 text-muted-foreground">-</div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  <div className="px-4 py-4 text-muted-foreground">
                    отсутствует
                  </div>
                </TableCell>
              </TableRow>
            );
          }

          const href = `/projects/${project.id}`;

          return (
            <TableRow
              key={row.studentId}
              className="transition-colors hover:bg-muted/40"
            >
              <TableCell className="p-0 font-medium">
                <RowLink href={href} padded={false}>
                  {row.studentName}
                </RowLink>
              </TableCell>
              <TableCell>
                <RowLink href={href}>
                  <div className="font-medium">{project.name}</div>
                  {project.syncStatusReason ? (
                    <div className="text-xs text-muted-foreground">
                      {project.syncStatusReason}
                    </div>
                  ) : null}
                </RowLink>
              </TableCell>
              <TableCell className="p-0">
                <RowLink href={href} padded={false}>
                  {formatLastCommitLabel(project.lastCommit)}
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
