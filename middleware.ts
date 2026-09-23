import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const pathname = req.nextUrl.pathname;

      if (pathname.startsWith("/admin")) {
        return token?.role === "ADMIN";
      }

      return Boolean(token);
    },
  },
  pages: {
    signIn: "/auth/login",
  },
});

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/pools/:path*"],
};
