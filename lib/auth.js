import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { sql } from '@vercel/postgres'
import bcrypt from 'bcryptjs'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        try {
          const result = await sql`
            SELECT * FROM users WHERE email = ${credentials.email}
          `
          const user = result.rows[0]
          if (!user || !user.password_hash) return null
          const isValid = await bcrypt.compare(credentials.password, user.password_hash)
          if (!isValid) return null
          await sql`UPDATE users SET last_login = NOW() WHERE id = ${user.id}`
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name
          }
        } catch (error) {
          console.error('Credentials auth error:', error)
          return null
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.includes('/login') || url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/cards`
      }
      if (url.startsWith(baseUrl)) return url
      return `${baseUrl}/cards`
    },

    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          const result = await sql`
            SELECT * FROM users WHERE google_id = ${account.providerAccountId}
          `
          if (result.rows.length === 0) {
            const emailCheck = await sql`
              SELECT * FROM users WHERE email = ${user.email}
            `
            if (emailCheck.rows.length > 0) {
              await sql`
                UPDATE users 
                SET google_id = ${account.providerAccountId}, last_login = NOW()
                WHERE email = ${user.email}
              `
            } else {
              await sql`
                INSERT INTO users (email, name, google_id, last_login)
                VALUES (${user.email}, ${user.name}, ${account.providerAccountId}, NOW())
              `
            }
          } else {
            await sql`
              UPDATE users SET last_login = NOW() 
              WHERE google_id = ${account.providerAccountId}
            `
          }
        } catch (error) {
          console.error('Google sign in error:', error)
          return false
        }
      }
      return true
    },

    async jwt({ token, user, account }) {
      if (account && user) {
        token.provider = account.provider
      }
      if (token.email) {
        try {
          const result = await sql`
            SELECT id FROM users WHERE email = ${token.email}
          `
          if (result.rows.length > 0) {
            token.userId = result.rows[0].id
          }
        } catch (error) {
          console.error('JWT error:', error)
        }
      }
      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/auth-error',
    newUser: '/cards',
  },

  session: {
    strategy: 'jwt',
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === 'development',
}