"use server";

import { requireTeacherSession } from "@/lib/server/auth";
import { sendTeacherWeeklyDigest } from "@/lib/server/teacher-weekly-digest";

export async function sendTeacherWeeklyDigestAction() {
  await requireTeacherSession();

  return sendTeacherWeeklyDigest();
}
