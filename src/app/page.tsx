import { redirect } from "next/navigation";

import { TeacherDashboard } from "@/components/app/teacher-dashboard";
import {
  getCurrentAuthRole,
  requireAuthenticatedSession,
  requireTeacherSession,
} from "@/lib/server/auth";

export default async function Home() {
  const role = await getCurrentAuthRole();

  if (role === "student") {
    redirect("/my-project");
  }

  if (role !== "teacher") {
    await requireAuthenticatedSession();
    redirect("/login");
  }

  const teacher = await requireTeacherSession();

  return <TeacherDashboard teacher={teacher} />;
}
