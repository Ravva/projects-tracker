"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  getCurrentGithubAccessToken,
  requireStudentSession,
} from "@/lib/server/auth";
import { listGithubRepositoriesForStudent } from "@/lib/server/github";
import {
  createStudentProjectFromGithubSelection,
  runProjectAiAnalysis,
} from "@/lib/server/repositories/projects";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function normalizeRepositoryUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function inferAiProviderLabelFromMessage(message: string) {
  const normalized = message.trim().toUpperCase();

  if (
    /HUGGING FACE|HF_TOKEN|HF_|HF\b/.test(normalized) &&
    !/AI GATEWAY/.test(normalized)
  ) {
    return "HF";
  }

  return "CF";
}

export async function chooseStudentProjectAction(formData: FormData) {
  const student = await requireStudentSession();
  const githubAccessToken = await getCurrentGithubAccessToken();
  let autoAnalysisNotice = "";
  let selectionMode: "new" | "restart" = "new";
  const repositoryName = readString(formData, "repositoryName");
  const repositoryUrl = readString(formData, "repositoryUrl");
  const repositoryDescription = readString(formData, "repositoryDescription");

  try {
    const repositories = await listGithubRepositoriesForStudent({
      accessToken: githubAccessToken,
      githubLogin: student.githubLogin,
    });
    const selectedRepository = repositories.find(
      (repository) =>
        normalizeRepositoryUrl(repository.url) ===
        normalizeRepositoryUrl(repositoryUrl),
    );

    if (!selectedRepository) {
      throw new Error(
        "Этот репозиторий недоступен для выбора. Обновите страницу и попробуйте снова.",
      );
    }

    if (selectedRepository.private) {
      throw new Error(
        "Приватный репозиторий выбрать нельзя. Он доступен только для просмотра.",
      );
    }

    const selectionResult = await createStudentProjectFromGithubSelection({
      studentId: student.studentId,
      studentName: student.studentName,
      repositoryName: repositoryName || selectedRepository.name,
      repositoryUrl: selectedRepository.url,
      repositoryDescription:
        repositoryDescription || selectedRepository.description,
      repositoryPrivate: selectedRepository.private,
    });
    const project = selectionResult.project;

    selectionMode = selectionResult.selectionMode;

    try {
      await runProjectAiAnalysis(project.$id);
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message.trim()
          : "Автоматический AI-анализ пока не завершился.";
      const providerLabel = inferAiProviderLabelFromMessage(message);

      autoAnalysisNotice = `Репозиторий привязан, но автоматический AI-анализ (${providerLabel}) пока не завершился: ${message}`;

      console.error("[my-project] Automatic AI analysis failed", {
        studentId: student.studentId,
        githubLogin: student.githubLogin,
        projectId: project.$id,
        repositoryUrl,
        error,
      });
    }
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim()
        ? error.message.trim()
        : "Не удалось привязать репозиторий. Повторите попытку позже.";

    console.error("[my-project] Failed to create student project", {
      studentId: student.studentId,
      githubLogin: student.githubLogin,
      repositoryUrl,
      error,
    });

    redirect(`/my-project?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/my-project");
  revalidatePath("/projects");
  revalidatePath("/");

  const params = new URLSearchParams({
    success:
      selectionMode === "restart" ? "project-restarted" : "project-created",
  });
  const createdProjectName = repositoryName || repositoryUrl;

  if (createdProjectName) {
    params.set("projectName", createdProjectName);
  }

  if (autoAnalysisNotice) {
    params.set("notice", autoAnalysisNotice);
  }

  redirect(`/my-project?${params.toString()}`);
}
