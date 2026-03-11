import { redirect } from "next/navigation";

import { getCurrentAuthRole } from "@/lib/server/auth";

export default async function AuthCompletePage() {
  const role = await getCurrentAuthRole();

  if (role === "teacher") {
    redirect("/");
  }

  if (role === "student") {
    redirect("/my-project");
  }

  redirect("/login?error=AccessDenied");
}
