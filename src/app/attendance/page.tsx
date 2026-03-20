import { clearAttendanceAction } from "@/app/attendance/actions";
import { AttendanceGridClient } from "@/app/attendance/attendance-grid-client";
import { AttendanceWeeklyReportCard } from "@/app/attendance/attendance-weekly-report-card";
import { TeacherShell } from "@/components/app/teacher-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

  return (
    <TeacherShell
      eyebrow="Weekly attendance"
      title="Attendance"
      teacherName={teacher.name}
      teacherEmail={teacher.email}
      actions={
        <form action={clearAttendanceAction}>
          <input type="hidden" name="weekStart" value={weekStart} />
          <Button variant="outline" className="rounded-xl bg-background/90">
            Очистить отметки
          </Button>
        </form>
      }
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
        <AttendanceWeeklyReportCard weekStart={weekStart} />
      </section>
    </TeacherShell>
  );
}
