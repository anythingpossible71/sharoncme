import Google from "next-auth/providers/google";

export function createGoogleProvider() {
  const enableGoogleAuth = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH;

  if (
    (enableGoogleAuth !== "true" && enableGoogleAuth !== "1") ||
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET
  ) {
    return null;
  }

  return Google({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  });
}
