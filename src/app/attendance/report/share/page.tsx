import { notFound } from "next/navigation";

import { AttendanceReportView } from "@/app/attendance/report/attendance-report-view";
import { buildAttendanceReportData } from "@/lib/server/attendance-report";
import { verifyAttendanceReportShareLink } from "@/lib/server/attendance-report-share";
import { getAttendanceWeek } from "@/lib/server/repositories/attendance";

export default async function SharedAttendanceReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    weekStart?: string;
    expires?: string;
    signature?: string;
  }>;
}) {
  const { weekStart, expires, signature } = await searchParams;

  if (!verifyAttendanceReportShareLink({ weekStart, expires, signature })) {
    notFound();
  }

  const attendanceWeek = await getAttendanceWeek(weekStart);
  const report = buildAttendanceReportData(attendanceWeek);

  return <AttendanceReportView report={report} showBackButton={false} />;
}
