import { TeacherDashboard } from "@/components/app/teacher-dashboard";
import { requireTeacherSession } from "@/lib/server/auth";

export default async function Home() {
  const teacher = await requireTeacherSession();

  return <TeacherDashboard teacher={teacher} />;
}
