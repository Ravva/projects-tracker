import { NextResponse } from "next/server";

import { runProjectSyncBatch } from "@/lib/server/project-sync-batch";

function getCronSecret() {
  return process.env.PROJECT_SYNC_CRON_SECRET?.trim() ?? "";
}

function isAuthorized(request: Request) {
  const cronSecret = getCronSecret();

  if (!cronSecret) {
    return false;
  }

  const authorizationHeader = request.headers.get("authorization") ?? "";
  const headerSecret = request.headers.get("x-project-sync-secret") ?? "";
  const bearerPrefix = "Bearer ";

  if (
    authorizationHeader.startsWith(bearerPrefix) &&
    authorizationHeader.slice(bearerPrefix.length).trim() === cronSecret
  ) {
    return true;
  }

  return headerSecret.trim() === cronSecret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const result = await runProjectSyncBatch();

    return NextResponse.json({
      ok: true,
      checkedProjects: result.checkedProjects,
      targetedProjects: result.targetedProjects,
      syncedProjects: result.syncedProjects,
      aiWarnings: result.aiWarnings,
      failures: result.failures,
      runAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[GitHub Actions project sync] Failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error && error.message.trim()
            ? error.message.trim()
            : "Project sync batch failed.",
      },
      { status: 500 },
    );
  }
}
