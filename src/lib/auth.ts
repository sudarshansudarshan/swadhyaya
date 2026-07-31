/**
 * NextAuth v5 configuration with samagama.in OAuth provider.
 * Maps samagama.in users to local User records.
 * Admins are also recognized via SWADHYAYA_ADMIN_EMAILS env var.
 */
import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { prisma } from './prisma';

const ADMIN_EMAILS = (process.env.SWADHYAYA_ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const samagamaProvider = process.env.SAMAGAMA_CLIENT_ID
  ? {
      id: 'samagama',
      name: 'samagama.in',
      type: 'oauth' as const,
      authorization: {
        url: `${process.env.SAMAGAMA_ISSUER}/oauth/authorize`,
        params: { scope: 'openid profile email' },
      },
      token: `${process.env.SAMAGAMA_ISSUER}/oauth/token`,
      userinfo: `${process.env.SAMAGAMA_ISSUER}/oauth/userinfo`,
      clientId: process.env.SAMAGAMA_CLIENT_ID,
      clientSecret: process.env.SAMAGAMA_CLIENT_SECRET,
      profile(profile: any) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          image: profile.picture,
          role: profile.role,
          samagamaSub: profile.sub,
        };
      },
    }
  : null;

const googleProvider = process.env.GOOGLE_CLIENT_ID
  ? {
      id: 'google',
      name: 'Google',
      type: 'oauth' as const,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: { prompt: 'consent', access_type: 'offline', response_type: 'code' },
      },
    }
  : null;

export const authConfig: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  providers: [
    ...(samagamaProvider ? [samagamaProvider] : []),
    ...(googleProvider ? [googleProvider] : []),
    Credentials({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        token: { label: 'Magic token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const email = (credentials.email as string).toLowerCase();
        if (!ADMIN_EMAILS.includes(email) && !email.endsWith('@iitrpr.ac.in')) {
          return null;
        }
        const existing = await prisma.user.findUnique({ where: { email } });
        if (!existing) return null;
        return { id: existing.id, email: existing.email, name: existing.name };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      const email = user.email.toLowerCase();
      const isAdmin = ADMIN_EMAILS.includes(email);

      const existing = await prisma.user.findUnique({ where: { email } });
      const samagamaSub =
        account?.provider === 'samagama' ? (profile?.sub as string) ?? null : existing?.samagamaSub ?? null;

      const role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' = isAdmin
        ? 'ADMIN'
        : existing?.role ?? 'STUDENT';

      await prisma.user.upsert({
        where: { email },
        create: {
          email,
          name: user.name ?? null,
          image: user.image ?? null,
          role,
          samagamaSub,
        },
        update: {
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          role: isAdmin ? 'ADMIN' : undefined,
          samagamaSub: samagamaSub ?? undefined,
        },
      });

      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (user && account) {
        token.samagamaAccessToken = account.access_token;
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.role = dbUser.role;
          token.samagamaSub = dbUser.samagamaSub;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.userId;
        (session.user as any).role = token.role;
        (session.user as any).samagamaSub = token.samagamaSub;
      }
      return session;
    },
  },
  session: { strategy: 'jwt' },
  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

/**
 * Dev auth: when SWADHYAYA_DEV_AUTH=1, allow header-based authentication.
 * Useful for local viewing without samagama.in OAuth.
 * Header format: `x-dev-user: admin@iitrpr.ac.in` (auto-creates user).
 */
export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  isAdmin: boolean;
  isInstructor: boolean;
  instructorId: string | null;
};

export async function devAuthHeader(req: Request): Promise<SessionUser | null> {
  if (process.env.SWADHYAYA_DEV_AUTH !== '1') return null;
  const email = req.headers.get('x-dev-user');
  if (!email) return null;
  const lower = email.toLowerCase();
  const isAdmin = lower === 'admin@iitrpr.ac.in' || lower.startsWith('admin');
  const existing = await prisma.user.findUnique({ where: { email: lower } });
  const user = existing ?? (await prisma.user.create({
    data: { email: lower, name: lower.split('@')[0], role: isAdmin ? 'ADMIN' : 'STUDENT' },
  }));
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role: user.role,
    isAdmin: user.role === 'ADMIN',
    isInstructor: user.role === 'INSTRUCTOR',
    instructorId: null,
  };
}
