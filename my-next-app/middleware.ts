import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Additional middleware logic can go here
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
    pages: {
      signIn: '/auth/signin'
    }
  }
)

export const config = {
  // Protect all routes except auth pages and public assets
  matcher: ['/((?!auth|api/auth|_next/static|_next/image|favicon.ico).*)']
}