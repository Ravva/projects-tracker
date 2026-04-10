import "server-only";

import crypto from "node:crypto";

const ONE_YEAR_IN_MS = 365 * 24 * 60 * 60 * 1000;

function getProjectReportShareSecret() {
  return process.env.PROJECT_REPORT_SHARE_SECRET?.trim() || "";
}

function buildSignature(input: { weekStart: string; expiresAt: string }) {
  const secret = getProjectReportShareSecret();

  if (!secret) {
    throw new Error(
      "Не настроен секрет project share report. Добавьте PROJECT_REPORT_SHARE_SECRET.",
    );
  }

  return crypto
    .createHmac("sha256", secret)
    .update(`${input.weekStart}:${input.expiresAt}`)
    .digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function buildProjectReportSharePath(weekStart: string) {
  const expiresAt = new Date(Date.now() + ONE_YEAR_IN_MS).toISOString();
  const signature = buildSignature({ weekStart, expiresAt });

  return `/project-report/share?weekStart=${encodeURIComponent(weekStart)}&expires=${encodeURIComponent(expiresAt)}&signature=${encodeURIComponent(signature)}`;
}

export function verifyProjectReportShareLink(input: {
  weekStart?: string;
  expires?: string;
  signature?: string;
}) {
  const weekStart = input.weekStart?.trim() ?? "";
  const expiresAt = input.expires?.trim() ?? "";
  const signature = input.signature?.trim() ?? "";

  if (!weekStart || !expiresAt || !signature) {
    return false;
  }

  const expiresAtTime = new Date(expiresAt).getTime();

  if (Number.isNaN(expiresAtTime) || expiresAtTime <= Date.now()) {
    return false;
  }

  try {
    const expectedSignature = buildSignature({ weekStart, expiresAt });

    return safeEqual(signature, expectedSignature);
  } catch {
    return false;
  }
}
