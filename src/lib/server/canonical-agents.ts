import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_CANONICAL_AGENTS_BLOB_URL =
  "https://github.com/Ravva/projects-tracker/blob/main/AGENTS.md";
const DEFAULT_CANONICAL_AGENTS_RAW_URL =
  "https://raw.githubusercontent.com/Ravva/projects-tracker/main/AGENTS.md";

function normalizeAgentsContent(content: string) {
  return content.replace(/\r\n/g, "\n").trim();
}

async function readLocalAgentsFile() {
  const localPath = path.join(process.cwd(), "AGENTS.md");
  const content = await readFile(localPath, "utf8");

  return normalizeAgentsContent(content);
}

export function getCanonicalAgentsBlobUrl() {
  return process.env.CANONICAL_AGENTS_BLOB_URL?.trim()
    ? process.env.CANONICAL_AGENTS_BLOB_URL.trim()
    : DEFAULT_CANONICAL_AGENTS_BLOB_URL;
}

export function getCanonicalAgentsRawUrl() {
  return process.env.CANONICAL_AGENTS_RAW_URL?.trim()
    ? process.env.CANONICAL_AGENTS_RAW_URL.trim()
    : DEFAULT_CANONICAL_AGENTS_RAW_URL;
}

export async function getCanonicalAgentsDocument() {
  const blobUrl = getCanonicalAgentsBlobUrl();
  const rawUrl = getCanonicalAgentsRawUrl();

  try {
    const response = await fetch(rawUrl, {
      headers: {
        Accept: "text/plain; charset=utf-8",
      },
      next: {
        revalidate: 3600,
      },
    });

    if (response.ok) {
      const remoteContent = normalizeAgentsContent(await response.text());

      if (remoteContent) {
        return {
          content: remoteContent,
          source: "remote" as const,
          blobUrl,
          rawUrl,
        };
      }
    }
  } catch {}

  return {
    content: await readLocalAgentsFile(),
    source: "local" as const,
    blobUrl,
    rawUrl,
  };
}
