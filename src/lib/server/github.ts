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

interface GithubRepositoryMetadataResponse {
  default_branch: string;
  private: boolean;
  html_url: string;
}

interface GithubContentFileResponse {
  type: "file";
  content?: string;
  encoding?: string;
}

interface GithubCommitResponse {
  sha: string;
  commit?: {
    author?: {
      date?: string | null;
    } | null;
  } | null;
}

export interface GithubRepositoryMetadata {
  defaultBranch: string;
  private: boolean;
  htmlUrl: string;
}

export interface GithubCommitSnapshot {
  sha: string;
  committedAt: string;
}

export class GithubRequestError extends Error {
  status: number;
  isRateLimit: boolean;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GithubRequestError";
    this.status = status;
    this.isRateLimit =
      status === 403 && message.toLowerCase().includes("rate limit");
  }
}

function buildGithubHeaders(accessToken?: string) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "projects-tracker",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (accessToken?.trim()) {
    headers.Authorization = `Bearer ${accessToken.trim()}`;
  }

  return headers;
}

async function fetchGithubJson<T>(
  url: string,
  options: {
    accessToken?: string;
    allow404?: boolean;
  } = {},
): Promise<T | null> {
  const response = await fetch(url, {
    headers: buildGithubHeaders(options.accessToken),
    cache: "no-store",
  });

  if (options.allow404 && response.status === 404) {
    return null;
  }

  if (!response.ok) {
    let message = `GitHub API request failed with ${response.status}.`;

    try {
      const data = (await response.json()) as { message?: string };

      if (data.message?.trim()) {
        message = data.message.trim();
      }
    } catch {}

    throw new GithubRequestError(message, response.status);
  }

  return (await response.json()) as T;
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
      headers: buildGithubHeaders(normalizedAccessToken),
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

export async function getGithubRepositoryMetadata(
  owner: string,
  repo: string,
  accessToken = process.env.GITHUB_TOKEN,
): Promise<GithubRepositoryMetadata> {
  const response = await fetchGithubJson<GithubRepositoryMetadataResponse>(
    `https://api.github.com/repos/${owner}/${repo}`,
    { accessToken },
  );

  if (!response) {
    throw new Error("GitHub repository metadata not found.");
  }

  return {
    defaultBranch: response.default_branch,
    private: response.private,
    htmlUrl: response.html_url,
  };
}

export async function getGithubRepositoryFileText(
  owner: string,
  repo: string,
  path: string,
  ref: string,
  accessToken = process.env.GITHUB_TOKEN,
) {
  const response = await fetchGithubJson<GithubContentFileResponse>(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(ref)}`,
    {
      accessToken,
      allow404: true,
    },
  );

  if (!response || response.type !== "file" || !response.content) {
    return null;
  }

  if (response.encoding === "base64") {
    return Buffer.from(response.content, "base64").toString("utf8");
  }

  return response.content;
}

export async function listGithubRepositoryCommits(
  owner: string,
  repo: string,
  ref: string,
  options: {
    accessToken?: string;
    maxPages?: number;
    perPage?: number;
  } = {},
): Promise<GithubCommitSnapshot[]> {
  const accessToken = options.accessToken ?? process.env.GITHUB_TOKEN;
  const perPage = options.perPage ?? 100;
  const maxPages = options.maxPages ?? 5;
  const commits: GithubCommitSnapshot[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const response = await fetchGithubJson<GithubCommitResponse[]>(
      `https://api.github.com/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(ref)}&per_page=${perPage}&page=${page}`,
      { accessToken },
    );

    if (!response || response.length === 0) {
      break;
    }

    commits.push(
      ...response
        .map((commit) => ({
          sha: commit.sha,
          committedAt: commit.commit?.author?.date ?? "",
        }))
        .filter((commit) => Boolean(commit.committedAt)),
    );

    if (response.length < perPage) {
      break;
    }
  }

  return commits;
}
