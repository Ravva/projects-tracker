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
  pushed_at: string;
}

export interface GithubRepositoryMetadata {
  defaultBranch: string;
  private: boolean;
  htmlUrl: string;
  pushedAt: string;
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

function mapGithubRepositoryOption(
  repository: GithubRepositoryResponse,
): GithubRepositoryOption {
  return {
    id: repository.id,
    name: repository.name,
    fullName: repository.full_name,
    description: repository.description ?? "",
    url: repository.html_url,
    private: repository.private,
    updatedAt: repository.updated_at,
    defaultBranch: repository.default_branch,
  };
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

const githubCache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL_MS = 120000; // 2 mins

async function fetchGithubJson<T>(
  url: string,
  options: {
    accessToken?: string;
    allow404?: boolean;
    revalidate?: number;
    bypassCache?: boolean;
  } = {},
): Promise<T | null> {
  const cacheKey = `${url}:${options.accessToken ?? ""}`;
  if (!options.bypassCache) {
    const cached = githubCache.get(cacheKey);
    const now = Date.now();
    if (cached && cached.expiry > now) {
      return cached.data as T;
    }
  }

  const fetchOptions: RequestInit & { next?: { revalidate: number } } = {
    headers: buildGithubHeaders(options.accessToken),
  };

  if (typeof options.revalidate === "number") {
    fetchOptions.next = { revalidate: options.revalidate };
  } else {
    fetchOptions.cache = "no-store";
  }

  const response = await fetch(url, fetchOptions);

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

  const result = (await response.json()) as T;
  githubCache.set(cacheKey, {
    data: result,
    expiry: Date.now() + CACHE_TTL_MS,
  });
  return result;
}

export async function listGithubRepositoriesForStudent(
  input:
    | string
    | {
        accessToken?: string;
        githubLogin?: string;
      },
): Promise<GithubRepositoryOption[]> {
  const normalizedAccessToken =
    typeof input === "string"
      ? input.trim()
      : (input.accessToken?.trim() ?? "");
  const normalizedGithubLogin =
    typeof input === "string" ? "" : (input.githubLogin?.trim() ?? "");

  if (normalizedAccessToken) {
    try {
      const repositories = await fetchGithubJson<GithubRepositoryResponse[]>(
        "https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner",
        {
          accessToken: normalizedAccessToken,
        },
      );

      return (repositories ?? []).map(mapGithubRepositoryOption);
    } catch (error) {
      if (!normalizedGithubLogin) {
        if (error instanceof GithubRequestError) {
          if (error.status === 401) {
            throw new Error(
              "GitHub-сессия ученика устарела. Выйдите и войдите через GitHub заново.",
            );
          }

          if (error.isRateLimit) {
            throw new Error(
              "GitHub временно ограничил запросы. Повторите попытку чуть позже.",
            );
          }
        }

        throw new Error("Не удалось получить список GitHub-репозиториев.");
      }
    }
  }

  if (!normalizedGithubLogin) {
    return [];
  }

  try {
    const repositories = await fetchGithubJson<GithubRepositoryResponse[]>(
      `https://api.github.com/users/${encodeURIComponent(normalizedGithubLogin)}/repos?per_page=100&sort=updated&type=owner`,
      {},
    );

    return (repositories ?? []).map(mapGithubRepositoryOption);
  } catch (error) {
    if (error instanceof GithubRequestError && error.isRateLimit) {
      throw new Error(
        "GitHub временно ограничил запросы. Повторите попытку чуть позже.",
      );
    }

    throw new Error("Не удалось получить список GitHub-репозиториев.");
  }
}

export async function getGithubRepositoryMetadata(
  owner: string,
  repo: string,
  accessToken = process.env.GITHUB_TOKEN,
  bypassCache = false,
): Promise<GithubRepositoryMetadata> {
  const response = await fetchGithubJson<GithubRepositoryMetadataResponse>(
    `https://api.github.com/repos/${owner}/${repo}`,
    { accessToken, revalidate: 60, bypassCache },
  );

  if (!response) {
    throw new Error("GitHub repository metadata not found.");
  }

  return {
    defaultBranch: response.default_branch,
    private: response.private,
    htmlUrl: response.html_url,
    pushedAt: response.pushed_at,
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
    bypassCache?: boolean;
  } = {},
): Promise<GithubCommitSnapshot[]> {
  const accessToken = options.accessToken ?? process.env.GITHUB_TOKEN;
  const perPage = options.perPage ?? 100;
  const maxPages = options.maxPages ?? 5;
  const commits: GithubCommitSnapshot[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const response = await fetchGithubJson<GithubCommitResponse[]>(
      `https://api.github.com/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(ref)}&per_page=${perPage}&page=${page}`,
      { accessToken, revalidate: 60, bypassCache: options.bypassCache },
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

export interface GithubTreeEntry {
  path: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
}

export async function getGithubRepositoryTree(
  owner: string,
  repo: string,
  ref: string,
  accessToken = process.env.GITHUB_TOKEN,
): Promise<GithubTreeEntry[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`;
  const response = await fetchGithubJson<{ tree: GithubTreeEntry[] }>(url, {
    accessToken,
    revalidate: 60,
  });
  return response?.tree ?? [];
}
