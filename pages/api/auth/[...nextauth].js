import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      authorize: async (credentials) => {
        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });

        if (user && await bcrypt.compare(credentials.password, user.password)) {
          return user;  // Return user object on success
        }
        return null;  // Return null if login fails
      }
    })
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
    signOut: '/auth/logout',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add user information to the token if user exists
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.employeeID = user.employeeID;  // Add employeeID to the token
      }
      return token;
    },
    async session({ session, token }) {
      // Include user information in the session
      if (token) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.employeeID = token.employeeID;  // Include employeeID in the session
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
