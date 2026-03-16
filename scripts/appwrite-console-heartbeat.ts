import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { buildAppwriteConsoleProjectUrl } from "@/lib/server/appwrite";

type ParsedArgs = {
  openBrowser: boolean;
};

function parseArgs(argv: string[]): ParsedArgs {
  return {
    openBrowser: !argv.includes("--no-open"),
  };
}

function openUrl(url: string) {
  if (process.platform === "win32") {
    spawnSync("cmd", ["/c", "start", "", url], { stdio: "ignore" });
    return;
  }

  if (process.platform === "darwin") {
    spawnSync("open", [url], { stdio: "ignore" });
    return;
  }

  spawnSync("xdg-open", [url], { stdio: "ignore" });
}

function formatUtcDate(value: Date) {
  return value.toISOString().replace(".000Z", "Z");
}

const args = parseArgs(process.argv.slice(2));
const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;

if (!endpoint || !projectId) {
  console.error(
    "APPWRITE_ENDPOINT and APPWRITE_PROJECT_ID are required to prepare the Appwrite anti-pause check.",
  );
  process.exit(1);
}

const launchedAt = new Date();
const recommendedCheckAt = new Date(
  launchedAt.getTime() + 6 * 24 * 60 * 60 * 1000,
);
const consoleUrl = buildAppwriteConsoleProjectUrl(endpoint, projectId);
const heartbeatPath = resolve(
  process.cwd(),
  ".codex",
  "appwrite-console-heartbeat.json",
);

mkdirSync(dirname(heartbeatPath), { recursive: true });
writeFileSync(
  heartbeatPath,
  JSON.stringify(
    {
      launchedAt: formatUtcDate(launchedAt),
      recommendedCheckAt: formatUtcDate(recommendedCheckAt),
      endpoint,
      projectId,
      consoleUrl,
    },
    null,
    2,
  ),
);

if (args.openBrowser) {
  openUrl(consoleUrl);
}

console.log(`Appwrite Console URL: ${consoleUrl}`);
console.log(`Heartbeat saved to: ${heartbeatPath}`);
console.log(
  `Recommended next console check: ${formatUtcDate(recommendedCheckAt)}`,
);
console.log(
  "Open the Console and interact with the project before seven full inactive days pass.",
);
