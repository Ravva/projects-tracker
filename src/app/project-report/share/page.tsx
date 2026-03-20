import { notFound } from "next/navigation";

import { ProjectReportView } from "@/app/projects/report/project-report-view";
import { buildProjectReportData } from "@/lib/server/project-report";
import { verifyProjectReportShareLink } from "@/lib/server/project-report-share";

export default async function SharedProjectReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    weekStart?: string;
    expires?: string;
    signature?: string;
  }>;
}) {
  const { weekStart, expires, signature } = await searchParams;

  if (!verifyProjectReportShareLink({ weekStart, expires, signature })) {
    notFound();
  }

  const report = await buildProjectReportData(weekStart);

  return <ProjectReportView report={report} showBackButton={false} />;
}
