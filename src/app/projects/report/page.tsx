import { ProjectReportView } from "@/app/projects/report/project-report-view";
import { requireTeacherSession } from "@/lib/server/auth";
import { buildProjectReportData } from "@/lib/server/project-report";

export default async function ProjectsReportPage() {
  await requireTeacherSession();

  const report = await buildProjectReportData();

  return <ProjectReportView report={report} showBackButton />;
}
