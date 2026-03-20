import { AttendanceReportView } from "@/app/attendance/report/attendance-report-view";
import { buildAttendanceReportData } from "@/lib/server/attendance-report";
import { requireTeacherSession } from "@/lib/server/auth";
import { getAttendanceWeek } from "@/lib/server/repositories/attendance";

export default async function AttendanceReportPage({
  searchParams,
}: {
  searchParams: Promise<{ weekStart?: string }>;
}) {
  await requireTeacherSession();

  const { weekStart } = await searchParams;
  const attendanceWeek = await getAttendanceWeek(weekStart);
  const report = buildAttendanceReportData(attendanceWeek);
  const backHref = weekStart
    ? `/attendance?weekStart=${attendanceWeek.weekStart}`
    : "/attendance";

  return (
    <AttendanceReportView report={report} showBackButton backHref={backHref} />
  );
}
