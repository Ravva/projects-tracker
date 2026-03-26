import { AttendanceGridClient } from "@/app/attendance/attendance-grid-client";
import { AttendanceWeeklyReportCard } from "@/app/attendance/attendance-weekly-report-card";
import { TeacherShell } from "@/components/app/teacher-shell";
import { Card, CardContent } from "@/components/ui/card";
import { buildAttendanceReportSharePath } from "@/lib/server/attendance-report-share";
import { requireTeacherSession } from "@/lib/server/auth";
import { formatWeekRangeLabel } from "@/lib/server/date-utils";
import {
  getAttendanceWeek,
  shiftWeekStart,
} from "@/lib/server/repositories/attendance";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ weekStart?: string }>;
}) {
  const teacher = await requireTeacherSession();
  const { weekStart: requestedWeekStart } = await searchParams;
  const attendanceWeek = await getAttendanceWeek(requestedWeekStart);
  const { lessons, rows, weekStart } = attendanceWeek;
  const previousWeekStart = shiftWeekStart(weekStart, -1);
  const nextWeekStart = shiftWeekStart(weekStart, 1);
  const weekRangeLabel = formatWeekRangeLabel(weekStart);
  const sharePath = buildAttendanceReportSharePath(weekStart);

  return (
    <TeacherShell
      eyebrow="Weekly attendance"
      title="Attendance"
      teacherName={teacher.name}
      teacherEmail={teacher.email}
    >
      <section>
        <Card className="border-border/70 bg-card/88 shadow-none">
          <CardContent>
            <AttendanceGridClient
              lessons={lessons}
              nextWeekStart={nextWeekStart}
              previousWeekStart={previousWeekStart}
              rows={rows}
              weekRangeLabel={weekRangeLabel}
              weekStart={weekStart}
            />
          </CardContent>
        </Card>
      </section>
      <section className="mt-6">
        <AttendanceWeeklyReportCard
          sharePath={sharePath}
          weekStart={weekStart}
        />
      </section>
    </TeacherShell>
  );
}
