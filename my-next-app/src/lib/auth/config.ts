import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Simple demo check
        if (credentials.email === 'admin@makeitso.finance' && credentials.password === 'SecurePass123!') {
          return {
            id: '1',
            email: 'admin@makeitso.finance',
            name: 'Admin User',
          }
        }

        return null
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/auth/signin'
  },
  callbacks: {
    async redirect() {
      return '/'
    }
  }
}

