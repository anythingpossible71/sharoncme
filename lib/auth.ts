import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth-config";

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// Type extensions for session
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      roles: string[];
    };
  }

  interface User {
    roles?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    roles: string[];
  }
}
