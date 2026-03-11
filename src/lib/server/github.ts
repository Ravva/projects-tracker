import "server-only";

export interface GithubRepositoryOption {
  id: number;
  name: string;
  fullName: string;
  description: string;
  url: string;
  private: boolean;
  updatedAt: string;
  defaultBranch: string;
}

interface GithubRepositoryResponse {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  private: boolean;
  updated_at: string;
  default_branch: string;
}

export async function listGithubRepositoriesForStudent(
  accessToken: string,
): Promise<GithubRepositoryOption[]> {
  const normalizedAccessToken = accessToken.trim();

  if (!normalizedAccessToken) {
    return [];
  }

  const response = await fetch(
    "https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner",
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${normalizedAccessToken}`,
        "User-Agent": "projects-tracker",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Не удалось получить список GitHub-репозиториев.");
  }

  const repositories = (await response.json()) as GithubRepositoryResponse[];

  return repositories.map((repository) => ({
    id: repository.id,
    name: repository.name,
    fullName: repository.full_name,
    description: repository.description ?? "",
    url: repository.html_url,
    private: repository.private,
    updatedAt: repository.updated_at,
    defaultBranch: repository.default_branch,
  }));
}
