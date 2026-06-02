import { withAuth } from "next-auth/middleware";

export default withAuth({
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ req, token }) => {
      const { searchParams } = req.nextUrl;
      const isTeacherPreview = searchParams.get("preview") === "teacher";
      if (isTeacherPreview) {
        return true;
      }
      return !!token;
    },
  },
});

export const config = {
  matcher: [
    "/",
    "/auth/complete",
    "/student/link",
    "/my-project/:path*",
    "/students/:path*",
    "/attendance",
    "/attendance/report",
    "/projects/:path*",
  ],
};
