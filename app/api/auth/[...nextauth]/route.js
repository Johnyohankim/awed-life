import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { sql } from '@vercel/postgres'
import bcrypt from 'bcryptjs'

const authOptions = {
  providers: [
    // Email/Password login
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Find user in database
        const result = await sql`
          SELECT * FROM users WHERE email = ${credentials.email}
        `
        
        const user = result.rows[0]
        
        if (!user || !user.password_hash) {
          return null
        }

        // Check password
        const isValid = await bcrypt.compare(credentials.password, user.password_hash)
        
        if (!isValid) {
          return null
        }

        // Update last login
        await sql`
          UPDATE users 
          SET last_login = NOW() 
          WHERE id = ${user.id}
        `

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name
        }
      }
    }),

    // Google Sign-In
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === 'google') {
        // Check if user exists
        const result = await sql`
          SELECT * FROM users WHERE google_id = ${account.providerAccountId}
        `
        
        if (result.rows.length === 0) {
          // Create new user
          await sql`
            INSERT INTO users (email, name, google_id, last_login)
            VALUES (${user.email}, ${user.name}, ${account.providerAccountId}, NOW())
          `
        } else {
          // Update last login
          await sql`
            UPDATE users 
            SET last_login = NOW() 
            WHERE google_id = ${account.providerAccountId}
          `
        }
      }
      return true
    },

    async session({ session, token }) {
      if (token.sub) {
        // Get user ID from database
        let result
        
        if (token.email) {
          result = await sql`
            SELECT id FROM users WHERE email = ${token.email}
          `
        }
        
        if (result && result.rows.length > 0) {
          session.user.id = result.rows[0].id
        }
      }
      return session
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id
      }
      return token
    }
  },

  pages: {
    signIn: '/login',
  },

  session: {
    strategy: 'jwt',
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }