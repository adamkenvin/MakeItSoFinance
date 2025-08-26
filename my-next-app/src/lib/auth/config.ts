import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// Demo user data - in production this would come from a database
const demoUsers = [
  {
    id: '1',
    email: 'admin@makeitso.finance',
    passwordHash: bcrypt.hashSync('SecurePass123!', 12),
    name: 'Admin User',
    role: 'admin'
  }
]

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Find user by email
        const user = demoUsers.find(u => u.email === credentials.email)
        
        if (!user) {
          return null
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(credentials.password, user.passwordHash)
        
        if (!passwordMatch) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to the root after successful login to show original budget functionality
      if (url.startsWith('/') && !url.startsWith('//')) {
        return `${baseUrl}${url}`
      }
      // Default redirect to root (original budget page)
      return baseUrl
    }
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key'
}

