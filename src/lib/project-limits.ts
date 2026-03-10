import type { ProjectInput } from "@/lib/types";

export const PROJECT_FIELD_LIMITS = {
  name: 255,
  summary: 2000,
  githubUrl: 1000,
  specMarkdown: 4000,
  planMarkdown: 4000,
} as const;

function trimToLimit(value: string, limit: number) {
  return value.slice(0, limit);
}

export function normalizeProjectInput(input: ProjectInput): ProjectInput {
  return {
    studentId: input.studentId,
    name: trimToLimit(input.name, PROJECT_FIELD_LIMITS.name),
    summary: trimToLimit(input.summary, PROJECT_FIELD_LIMITS.summary),
    githubUrl: trimToLimit(input.githubUrl, PROJECT_FIELD_LIMITS.githubUrl),
    status: input.status,
    specMarkdown: trimToLimit(
      input.specMarkdown,
      PROJECT_FIELD_LIMITS.specMarkdown,
    ),
    planMarkdown: trimToLimit(
      input.planMarkdown,
      PROJECT_FIELD_LIMITS.planMarkdown,
    ),
  };
}
